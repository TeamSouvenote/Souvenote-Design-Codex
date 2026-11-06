import assert from "node:assert/strict";
import test from "node:test";
import { webcrypto } from "node:crypto";

import { cleanHostedUiReturnPath } from "./cognitoAuth.ts";

test("preserves safe internal post-login destinations", () => {
  assert.equal(
    cleanHostedUiReturnPath("/create/personalize-a-template?draft=123#preview", "/create"),
    "/create/personalize-a-template?draft=123#preview",
  );
  assert.equal(cleanHostedUiReturnPath("/welcome", "/create"), "/welcome");
});

test("rejects external and malformed post-login destinations", () => {
  for (const value of [
    "https://attacker.example/collect",
    "//attacker.example/collect",
    "/\\attacker.example/collect",
    "/create\nSet-Cookie: session=stolen",
  ]) {
    assert.equal(cleanHostedUiReturnPath(value, "/create"), "/create");
  }
});

// ---- "Remember me" session storage ----------------------------------------
function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => { data.set(key, String(value)); },
    removeItem: (key) => { data.delete(key); },
    keys: () => [...data.keys()],
  };
}

async function withBrowserStorage(run) {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  // Object.keys(storage) must list the stored keys, as it does in browsers.
  const asStorage = (s) => new Proxy(s, { ownKeys: () => s.keys(), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) });
  const originalWindow = globalThis.window;
  const originalEvent = globalThis.Event;
  let currentUrl = new URL("http://localhost:3000/login?returnTo=%2Fcreate");
  const navigate = (url) => { currentUrl = new URL(url, currentUrl); };
  globalThis.window = {
    localStorage: asStorage(localStorage), sessionStorage: asStorage(sessionStorage), dispatchEvent: () => true,
    crypto: webcrypto, btoa: globalThis.btoa, atob: globalThis.atob,
    location: {
      get href() { return currentUrl.href; },
      get origin() { return currentUrl.origin; },
      get pathname() { return currentUrl.pathname; },
      get search() { return currentUrl.search; },
      assign: navigate, replace: navigate,
    },
    history: { replaceState: (_state, _title, url) => navigate(url) },
  };
  globalThis.Event = class { constructor(type) { this.type = type; } };
  try {
    await run({ localStorage, sessionStorage });
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    globalThis.Event = originalEvent;
  }
}

const session = { idToken: "id", accessToken: "access", refreshToken: "refresh", expiresAt: Date.now() + 3_600_000, email: "qa@example.com", sub: "sub" };

test("a remembered sign-in is kept in localStorage", async () => {
  const auth = await import("./cognitoAuth.ts");
  await withBrowserStorage(({ localStorage, sessionStorage }) => {
    auth.setSessionPersistence(true);
    auth.storeCognitoSession(session);
    assert.ok(localStorage.getItem(auth.AUTH_SESSION_STORAGE_KEY));
    assert.equal(sessionStorage.getItem(auth.AUTH_SESSION_STORAGE_KEY), null);
    assert.equal(auth.getStoredCognitoSession()?.email, "qa@example.com");
  });
});

test("an unremembered sign-in is kept in sessionStorage only, replacing a remembered one", async () => {
  const auth = await import("./cognitoAuth.ts");
  await withBrowserStorage(({ localStorage, sessionStorage }) => {
    auth.setSessionPersistence(true);
    auth.storeCognitoSession(session);
    auth.setSessionPersistence(false);
    auth.storeCognitoSession(session);
    assert.equal(localStorage.getItem(auth.AUTH_SESSION_STORAGE_KEY), null);
    assert.ok(sessionStorage.getItem(auth.AUTH_SESSION_STORAGE_KEY));
    assert.equal(auth.getStoredCognitoSession()?.email, "qa@example.com");
  });
});

test("signing out clears both storages and the Cognito SDK token cache", async () => {
  const auth = await import("./cognitoAuth.ts");
  await withBrowserStorage(({ localStorage, sessionStorage }) => {
    auth.setSessionPersistence(false);
    auth.storeCognitoSession(session);
    localStorage.setItem("CognitoIdentityServiceProvider.client.qa.idToken", "cached");
    auth.clearCognitoAuthState();
    assert.equal(auth.getStoredCognitoSession(), null);
    assert.equal(sessionStorage.getItem(auth.AUTH_SESSION_STORAGE_KEY), null);
    assert.equal(localStorage.getItem("CognitoIdentityServiceProvider.client.qa.idToken"), null);
  });
});

async function withHostedUi(run) {
  const config = {
    NEXT_PUBLIC_COGNITO_REGION: "us-east-2",
    NEXT_PUBLIC_COGNITO_USER_POOL_ID: "us-east-2_test",
    NEXT_PUBLIC_COGNITO_CLIENT_ID: "test-client",
    NEXT_PUBLIC_COGNITO_DOMAIN: "https://auth.example.com",
    // Exercise the root callback used by the local app, followed by /login on failure.
    NEXT_PUBLIC_COGNITO_REDIRECT_URI: "http://localhost:3000",
  };
  const previousConfig = Object.fromEntries(Object.keys(config).map((key) => [key, process.env[key]]));
  const previousFetch = globalThis.fetch;
  Object.assign(process.env, config);
  const auth = await import("./cognitoAuth.ts");
  try {
    await withBrowserStorage(async (storage) => {
      auth.clearCognitoAuthState();
      await run(auth, storage);
    });
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousConfig)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

async function googleCallback(auth, extraParams = { code: "one-use-code" }) {
  await auth.startHostedUiSignIn("Google", "/create?draft=123");
  const authorizeUrl = new URL(window.location.href);
  assert.equal(authorizeUrl.searchParams.get("identity_provider"), "Google");
  const state = authorizeUrl.searchParams.get("state");
  window.location.assign(`http://localhost:3000/?${new URLSearchParams({ state, ...extraParams })}`);
}

test("Google callback exchanges a code once and retains provider, route, and destination", async () => {
  await withHostedUi(async (auth) => {
    await googleCallback(auth);
    let exchanges = 0;
    globalThis.fetch = async (url, options) => {
      exchanges++;
      assert.equal(url, "https://auth.example.com/oauth2/token");
      assert.equal(options.body.get("redirect_uri"), "http://localhost:3000");
      assert.ok(options.body.get("code_verifier"));
      const claims = { email: session.email, sub: session.sub, exp: Math.floor(Date.now() / 1000) + 3600 };
      const idToken = `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
      return Response.json({ id_token: idToken, access_token: "access", refresh_token: "refresh" });
    };
    const [first, second] = await Promise.all([auth.completeHostedUiSignIn(), auth.completeHostedUiSignIn()]);
    assert.equal(exchanges, 1);
    assert.equal(first, second);
    assert.equal(first.email, session.email);
    assert.deepEqual(auth.consumeHostedUiAttempt(), { provider: "Google", authPath: "/login?returnTo=%2Fcreate" });
    assert.equal(auth.consumeHostedUiReturnTo(), "/create?draft=123");
    assert.equal(new URL(window.location.href).searchParams.has("code"), false);
  });
});

test("account-sync failure keeps its category and provider after cleanup and a page reload", async () => {
  await withHostedUi(async (auth) => {
    const retryPath = auth.rememberHostedUiError({
      code: "HostedUiServiceUnavailable", provider: "Google", message: "Internal server error",
    }, "/login?returnTo=%2Fcreate");
    window.location.assign(retryPath);
    auth.clearCognitoAuthState({ preserveHostedUiError: true });
    assert.equal(auth.consumeHostedUiError()?.code, "HostedUiServiceUnavailable");

    // A full-page redirect loses module memory. Reconstruct from the public URL only.
    window.location.assign(retryPath);
    auth.clearCognitoAuthState();
    const error = auth.consumeHostedUiError();
    assert.equal(error?.code, "HostedUiServiceUnavailable");
    assert.equal(error?.provider, "Google");
    assert.match(auth.socialAuthFailureMessage(error), /Google signed in, but Souvenote/);
    assert.doesNotMatch(auth.socialAuthFailureMessage(error), /email is not connected/);
    assert.equal(new URL(window.location.href).searchParams.get("returnTo"), "/create");
    assert.equal(auth.consumeHostedUiError(), null);
  });
});

test("cancelled Google sign-in preserves the provider without forwarding error descriptions", async () => {
  await withHostedUi(async (auth) => {
    await googleCallback(auth, { error: "access_denied", error_description: "Private account details" });
    await assert.rejects(auth.completeHostedUiSignIn(), { code: "access_denied" });
    assert.doesNotMatch(window.location.href, /Private|error_description|state=/);
    auth.clearCognitoAuthState();
    const error = auth.consumeHostedUiError();
    assert.equal(error?.provider, "Google");
    assert.match(auth.socialAuthFailureMessage(error), /Google sign-in was cancelled or denied/);
  });
});

test("token, network, and missing-claim failures return to login with a useful error", async () => {
  for (const [fetchResponse, expectedCode] of [
    [async () => Response.json({ error: "invalid_grant" }, { status: 400 }), "HostedUiTokenError"],
    [async () => { throw new TypeError("Failed to fetch"); }, "HostedUiTokenError"],
    [async () => Response.json({ id_token: "header.e30.signature", access_token: "access" }), "HostedUiConfigurationError"],
  ]) {
    await withHostedUi(async (auth, { localStorage }) => {
      await googleCallback(auth);
      globalThis.fetch = fetchResponse;
      await assert.rejects(auth.completeHostedUiSignIn(), { code: expectedCode });
      assert.equal(window.location.pathname, "/login");
      assert.equal(localStorage.getItem("souv_cognito_oauth_state"), null);
      auth.clearCognitoAuthState();
      const error = auth.consumeHostedUiError();
      assert.equal(error?.code, expectedCode);
      assert.equal(error?.provider, "Google");
    });
  }
});

test("an invalid callback state is rejected before exchanging any code", async () => {
  await withHostedUi(async (auth) => {
    await googleCallback(auth);
    const callback = new URL(window.location.href);
    callback.searchParams.set("state", "untrusted-state");
    window.location.assign(callback.href);
    globalThis.fetch = () => assert.fail("An unverified callback must not reach the token endpoint");
    await assert.rejects(auth.completeHostedUiSignIn(), { code: "InvalidHostedUiState" });
    assert.equal(auth.getStoredCognitoSession(), null);
    assert.equal(auth.consumeHostedUiError()?.code, "InvalidHostedUiState");
  });
});

test("account conflicts and unknown errors have distinct copy and allowlisted retry codes", async () => {
  await withHostedUi(async (auth) => {
    assert.match(auth.socialAuthFailureMessage({ code: "HostedUiAccountConflict", provider: "Google" }), /original sign-in method/);
    assert.match(auth.socialAuthFailureMessage({ code: "HostedUiError" }), /^Social sign-in/);
    const path = auth.rememberHostedUiError({ code: "private-error-details", message: "Private details" }, "/login");
    assert.equal(new URL(path, window.location.origin).searchParams.get("souvOauthError"), "HostedUiError");
    assert.doesNotMatch(path, /private|Private/);
  });
});
