import assert from "node:assert/strict";
import test from "node:test";

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
  globalThis.window = { localStorage: asStorage(localStorage), sessionStorage: asStorage(sessionStorage), dispatchEvent: () => true };
  globalThis.Event = class { constructor(type) { this.type = type; } };
  try {
    await run({ localStorage, sessionStorage });
  } finally {
    delete globalThis.window;
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
