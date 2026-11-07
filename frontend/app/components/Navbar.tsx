"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useCreditBalance } from "../lib/creditBalance";
import type { CreditBalanceStatus } from "../lib/creditBalance";
import type { DemoCredits, DemoUser } from "./DemoUser";
import { useDemoBalance } from "./DemoBalance";
import { useCartCount } from "./cartCount";
import { OPEN_TOP_UP_EVENT } from "./pricing/topUp";
import type { OpenTopUpDetail, TopUpView } from "./pricing/topUp";

// Top-up pop-up: loaded the first time it opens, so its code and styles aren't on every page.
const TopUpModal = dynamic(() => import("./pricing/TopUpModal"), { ssr: false });

type NavLink = {
  label: string;
  stackedLabel?: [string, string];
  sub: string;
  signedOutSub?: string;
  href: string;
};

type CreditsTickerProps = {
  credits?: number;
  cardBank?: number;
  status?: CreditBalanceStatus;
  /** Opens the top-up credits pop-up (owned by NavRight, so the hamburger can open it too). */
  onTopUp: (view: TopUpView) => void;
};

type NavRightProps = {
  loggedIn: boolean;
  user: DemoUser;
  creditBalance: number;
  creditStatus: CreditBalanceStatus;
  cardBank: number;
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * Landing variant only: the bar's links, repeated in the menu for screens
   * too narrow to show them in the bar (phones).
   */
  compactLinks?: NavLink[];
  /** False when the cluster is shown without a session (`alwaysSignedIn`). */
  hasSession: boolean;
};

type NavbarProps = {
  loggedIn?: boolean;
  user?: DemoUser;
  credits?: DemoCredits;
  cardBank?: number;
  followUserOnScroll?: boolean;
  /**
   * "landing" is used only by the public landing page (`/`): Community Cards
   * replaces Pricing, and signed-out visitors get a small-screen menu.
   * Every other screen uses "default", which is unchanged.
   */
  navVariant?: "default" | "landing";
  /**
   * Show the signed-in cluster (credits, cards, cart, menu)
   * even when there is no session. Used by the signed-in home (`/home`).
   */
  alwaysSignedIn?: boolean;
};

const COMMUNITY_CARDS_HREF = "/community-cards";

const NAV_LINKS: NavLink[] = [
  { label: "Personalize a Template", stackedLabel: ["Personalize", "a Template"], sub: "Curated designs, ready to make yours.", signedOutSub: "Browse card styles, then sign up to save, purchase credits, and generate.", href: "/create/personalize-a-template" },
  { label: "Build My Card", stackedLabel: ["Build", "My Card"], sub: "Start from scratch: photo, moment, optional QR song.", signedOutSub: "Preview step one, then sign up and purchase credits to continue.", href: "/create/build-my-card" },
  { label: "Saved Cards & Songs", stackedLabel: ["Saved", "Cards & Songs"], sub: "Saved cards, drafts, songs, and send-ready creations.", signedOutSub: "Sign up or log in to purchase cards and tokens, then save everything you make.", href: "/create/my-cards-and-songs" },
  { label: "Pricing", sub: "Card packs, credits, and what shipping covers.", signedOutSub: "Pricing is public. Purchase buttons ask you to sign up or log in first.", href: "/pricing" },
];

const findLink = (href: string) => NAV_LINKS.find((link) => link.href === href)!;

// Landing bar: Personalize · Build · Community · Pricing, evenly spaced, with
// landing-specific hover copy (sub and signedOutSub so it shows signed in or out).
const LANDING_NAV_LINKS: NavLink[] = [
  {
    ...findLink("/create/personalize-a-template"),
    sub: "Personalize one of our pre-built cards like Comic and Horoscope.",
    signedOutSub: "Personalize one of our pre-built cards like Comic and Horoscope.",
  },
  {
    ...findLink("/create/build-my-card"),
    sub: "Have an idea for a card? Answer a few questions and watch your card come to life.",
    signedOutSub: "Have an idea for a card? Answer a few questions and watch your card come to life.",
  },
  {
    label: "Community Cards",
    stackedLabel: ["Community", "Cards"],
    sub: "Choose from our collection of ready to send cards, just add your personal message. No AI credits required.",
    href: COMMUNITY_CARDS_HREF,
  },
  {
    ...findLink("/pricing"),
    sub: "Choose from flexible options as low as $6.99.",
    signedOutSub: "Choose from flexible options as low as $6.99.",
  },
];

function IconCart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h2.4l2.3 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.96-1.6L21 9H6" />
      <circle cx="10" cy="21" r="1.4" />
      <circle cx="17" cy="21" r="1.4" />
    </svg>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/** "1 credit", "2 credits". */
function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

function CreditsTicker({ credits = 0, cardBank = 0, status = "idle", onTopUp }: CreditsTickerProps) {
  const loading = status === "loading";
  const error = status === "error";
  // The box always reads "Credits N": 0 while the balance loads or if it
  // can't be fetched. The tooltip and spoken label still say which it is.
  const creditValue = loading || error ? 0 : credits;
  const linkTitle = error
    ? "Credit balance unavailable."
    : "View Saved Cards & Songs";
  // Spoken name includes the counts, which the visible boxes show.
  const spokenLabel = loading
    ? "Loading credits"
    : error
      ? "Credit balance unavailable"
      : `${plural(credits, "credit")}, ${plural(cardBank, "card")}. View Saved Cards & Songs`;
  const linkRef = React.useRef<HTMLAnchorElement | null>(null);

  return (
    <div className="souv-balance-wrap">
      <Link
        ref={linkRef}
        className="souv-credits souv-credits-stack souv-credits-link"
        href="/create/my-cards-and-songs"
        title={linkTitle}
        aria-label={spokenLabel}
      >
        <span className="souv-credit"><em>Credits</em><b>{creditValue}</b></span>
        <span className="souv-credit souv-credit-bank">
          <em>Cards</em><b>{cardBank}</b>
        </span>
      </Link>
      {/* Shown on hover and on keyboard focus: top up cards or credits in a pop-up (owner, 2026-11-05 /
          2026-11-07; "Top up cards" replaced "See pricing"), or go to Saved Cards & Songs (where the box
          itself also links). */}
      <div className="souv-cardbank-pop">
        <div className="souv-cardbank-pop-card">
          <div className="souv-cardbank-pop-arrow" />
          <div className="souv-rule-gold" />
          {(["cards", "credits"] as const).map((view) => (
            <button
              key={view}
              type="button"
              className="souv-cardbank-sendlink"
              aria-haspopup="dialog"
              onClick={(event) => {
                // Keyboard (Enter/Space, detail 0): focus the Credits box first, so it gets focus
                // back when the pop-up closes. This menu hides once focus leaves it, so focus
                // couldn't return to this button. Mouse clicks skip this, so the menu doesn't
                // reappear after the pop-up closes.
                if (event.detail === 0) linkRef.current?.focus({ preventScroll: true });
                onTopUp?.(view);
              }}
            >
              {view === "cards" ? "Top up cards" : "Top up credits"}
            </button>
          ))}
          <Link className="souv-cardbank-sendlink" href="/create/my-cards-and-songs">Saved Cards &amp; Songs</Link>
        </div>
      </div>
    </div>
  );
}

/** A press outside an open menu is "used up" by closing it if its click follows within this time. */
const OUTSIDE_CLICK_WINDOW_MS = 600;

/**
 * Dismissal for a nav menu (`wrapRef` holds its button and panel):
 * - Escape closes it and returns focus to the button.
 * - A press outside closes it, and that press's click does nothing else, so
 *   nothing hidden behind the menu gets activated. Presses on the nav bar
 *   itself still go through (e.g. opening the next menu straight away).
 * - Keyboard focus moving to something outside closes it.
 *   (Clicks inside never close it: Safari doesn't focus buttons on click.)
 * Returns the `onBlur` handler for the wrapper.
 */
function useMenuDismiss(
  open: boolean,
  close: () => void,
  wrapRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>,
) {
  const closeRef = React.useRef(close);
  React.useEffect(() => {
    closeRef.current = close;
  });

  React.useEffect(() => {
    if (!open) return;
    let outsidePressAt = 0;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      closeRef.current();
      triggerRef.current?.focus();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      closeRef.current();
      const onNavBar = target instanceof Element && target.closest(".souv-nav");
      if (!onNavBar) outsidePressAt = Date.now();
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
      if (Date.now() - outsidePressAt > OUTSIDE_CLICK_WINDOW_MS) return;
      // The menu closed on an outside press: swallow that press's click.
      const pressedAt = outsidePressAt;
      function swallowClick(event: MouseEvent) {
        document.removeEventListener("click", swallowClick, true);
        if (Date.now() - pressedAt > OUTSIDE_CLICK_WINDOW_MS) return;
        event.preventDefault();
        event.stopPropagation();
      }
      document.addEventListener("click", swallowClick, true);
      window.setTimeout(() => document.removeEventListener("click", swallowClick, true), OUTSIDE_CLICK_WINDOW_MS);
    };
  }, [open, wrapRef, triggerRef]);

  return React.useCallback((event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) closeRef.current();
  }, []);
}

function NavRight({
  loggedIn,
  user,
  creditBalance,
  creditStatus,
  cardBank,
  menuOpen,
  setMenuOpen,
  compactLinks,
  hasSession,
}: NavRightProps) {
  const router = useRouter();
  const { logout } = useAuth();
  // Live: the number of items in the saved cart, updated whenever it changes.
  const cartCount = useCartCount();
  const pathname = usePathname();
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  // The Top up pop-up: which view it opened on, and where to return after paying (mid-creation only).
  const [topUp, setTopUp] = React.useState<{ view: TopUpView; returnTo?: string } | null>(null);
  const menuWrapRef = React.useRef<HTMLDivElement | null>(null);
  const siteMenuId = React.useId();
  const onMenuBlur = useMenuDismiss(menuOpen, () => setMenuOpen(false), menuWrapRef, menuButtonRef);
  const loginHref = `/login?${new URLSearchParams({ returnTo: pathname || "/" }).toString()}`;

  // openTopUp() in pricing/topUp.ts: pages ask for the pop-up when someone is out of
  // credits or cards mid-creation. Only a signed-in nav answers; otherwise the
  // caller falls back to the Pricing page.
  React.useEffect(() => {
    if (!loggedIn) return;
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenTopUpDetail>).detail;
      if (!detail) return;
      detail.handled = true;
      setMenuOpen(false);
      setTopUp({ view: detail.view, returnTo: detail.returnTo });
    };
    window.addEventListener(OPEN_TOP_UP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_TOP_UP_EVENT, onOpen);
  }, [loggedIn, setMenuOpen]);

  if (!loggedIn) {
    return (
      <div className="souv-nav-right">
        <Link className="souv-nav-login" href="/login">Log In</Link>
        <Link className="souv-cta-flow" href="/signup"><span>Start for Free</span></Link>
      </div>
    );
  }

  return (
    <div className="souv-nav-right">
      <CreditsTicker credits={creditBalance} cardBank={cardBank} status={creditStatus} onTopUp={(view) => setTopUp({ view })} />
      {topUp && <TopUpModal initialView={topUp.view} returnTo={topUp.returnTo} onClose={() => setTopUp(null)} />}
      <span className="souv-nav-sep" aria-hidden="true" />

      <div className="souv-iconbtn-wrap">
        <Link className="souv-iconbtn" aria-label={cartCount > 0 ? `Cart, ${plural(cartCount, "item")}` : "Cart, empty"} href="/cart">
          <IconCart />
          {cartCount > 0 && <span className="souv-cart-badge" aria-hidden="true">{cartCount}</span>}
        </Link>
      </div>

      {/* One menu for everything: the account items first, then (phones only,
          landing variant) the bar's links, then help and legal, then Sign Out. */}
      <div ref={menuWrapRef} className="souv-iconbtn-wrap" onBlur={onMenuBlur}>
        <button
          ref={menuButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? siteMenuId : undefined}
          className={`souv-iconbtn ${menuOpen ? "is-open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <IconMenu />
        </button>
        {menuOpen && (
          <div id={siteMenuId} className="souv-popmenu souv-popmenu-site souv-popmenu-wide">
            {/* Without a session (only while /home is confirming the sign-in)
                there is no user to name and nothing to sign out of. */}
            {hasSession && (
              <>
                <div className="souv-popmenu-userhead">
                  <div className="souv-popmenu-avatar">{user.initials}</div>
                  <div>
                    <div className="souv-popmenu-name">{user.name}</div>
                    <div className="souv-popmenu-email">{user.email}</div>
                    {/* Same numbers as the bar's Credits/Cards box (0 while loading or unavailable). */}
                    <div className="souv-popmenu-balance">
                      {plural(creditStatus === "loading" || creditStatus === "error" ? 0 : creditBalance, "credit")}
                      {" · "}
                      {cardBank === 1 ? "1 card to send" : `${cardBank} cards to send`}
                    </div>
                  </div>
                </div>
                <div className="souv-popmenu-sep" />
              </>
            )}
            <Link href="/account/profile" className="souv-popmenu-item">Profile</Link>
            <Link href="/account/settings" className="souv-popmenu-item">Account Settings</Link>
            <div className="souv-popmenu-sep" />
            <Link href="/create/my-cards-and-songs" className="souv-popmenu-item">Saved Cards &amp; Songs</Link>
            {/* Owner, 2026-11-07: both open the Top up pop-up (cards or credits view). */}
            {(["cards", "credits"] as const).map((view) => (
              <button
                key={view}
                type="button"
                className="souv-popmenu-item"
                aria-haspopup="dialog"
                onClick={() => {
                  setMenuOpen(false);
                  // Focus returns to the menu button when the pop-up closes.
                  menuButtonRef.current?.focus();
                  setTopUp({ view });
                }}
              >
                {view === "cards" ? "Top Up Cards" : "Top Up Credits"}
              </button>
            ))}
            <div className="souv-popmenu-sep" />
            {compactLinks && (
              // Phones only (hidden from 701px up, where the bar shows these).
              <div className="souv-popmenu-compact-links">
                {compactLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="souv-popmenu-item">{link.label}</Link>
                ))}
                <div className="souv-popmenu-sep" />
              </div>
            )}
            <Link href="/faq" className="souv-popmenu-item">FAQ</Link>
            <Link href="/contact" className="souv-popmenu-item">Contact Us</Link>
            <div className="souv-popmenu-sep" />
            <Link href="/legal/cookie-policy" className="souv-popmenu-item">Cookie Policy</Link>
            <Link href="/legal/refund-policy" className="souv-popmenu-item">Refund Policy</Link>
            <Link href="/legal/terms-of-service" className="souv-popmenu-item">Terms of Service</Link>
            <Link href="/legal/privacy-policy" className="souv-popmenu-item">Privacy Policy</Link>
            <div className="souv-popmenu-sep" />
            {hasSession ? (
              <button
                type="button"
                className="souv-popmenu-logout"
                onClick={() => {
                  const redirectingToHostedLogout = logout({ hostedUi: true });
                  setMenuOpen(false);
                  if (!redirectingToHostedLogout) router.push("/");
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link href={loginHref} className="souv-popmenu-logout">Log In</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Navbar({
  user = { name: "Amelia Hart", email: "amelia@souvenote.com", initials: "AH" },
  credits = { images: 0, songs: 0 },
  cardBank = 0,
  followUserOnScroll = false,
  navVariant = "default",
  alwaysSignedIn = false,
}: NavbarProps) {
  const isLanding = navVariant === "landing";
  const navLinks = isLanding ? LANDING_NAV_LINKS : NAV_LINKS;
  const auth = useAuth();
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const signedIn = auth.status === "authenticated";
  // `alwaysSignedIn` (the signed-in home) keeps the signed-in cluster even without a session.
  const resolvedLoggedIn = signedIn || alwaysSignedIn;
  const resolvedUser = auth.displayUser || user;
  // Card bank: cards bought at checkout (Print and Send, Big Sender). Stored in
  // this browser only for now (DemoBalance.ts): the backend has no card
  // entitlements yet (DEVELOPER_HANDOFF.md "Pricing"). A screen can still pass
  // its own count; most pass 0, so the stored count is used then.
  const storedBalance = useDemoBalance();
  const resolvedCardBank = cardBank || storedBalance.cardBank;
  // The landing uses pre-tinted gold artwork; every other screen keeps the originals.
  const logoSrc = resolvedLoggedIn
    ? (isLanding ? "/assets/logomark-gold-silver.png" : "/assets/LogoMark.png")
    : (isLanding ? "/assets/wordmark-gold.png" : "/assets/WordmarkLobster.png");
  const localCreditBalance = (credits.images ?? 0) + (credits.songs ?? 0);
  const creditBalance = useCreditBalance({
    enabled: signedIn,
    fallbackBalance: localCreditBalance,
  });
  // No session: "Loading" while it's being restored, then "Offline" (no balance to show).
  const creditStatus = signedIn
    ? (creditBalance.status === "idle" ? "loading" : creditBalance.status)
    : resolvedLoggedIn
      ? (auth.status === "loading" ? "loading" : "error")
      : creditBalance.status;

  return (
    <header className={`souv-nav ${resolvedLoggedIn ? "is-signed-in" : "is-signed-out"} ${followUserOnScroll ? "is-follow-user-on-scroll" : ""}`}>
      <Link href={resolvedLoggedIn ? "/home" : "/"} className={`souv-nav-logo ${resolvedLoggedIn ? "is-mark" : "is-wordmark"}`} aria-label="Souvenote home">
        <img src={logoSrc} alt="Souvenote" />
      </Link>

      <nav className="souv-nav-links" aria-label="Main">
        {navLinks.map((link, index) => (
          <React.Fragment key={link.label}>
            {index > 0 && !isLanding && <span className="souv-nav-dot" aria-hidden="true">{"\u00b7"}</span>}
            {/* The description popover opens on keyboard focus as well as hover. */}
            <div
              className="souv-nav-link-wrap"
              onMouseEnter={() => setHovered(link.label)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(link.label)}
              onBlur={() => setHovered(null)}
            >
              <Link href={link.href} className={`souv-nav-link ${hovered === link.label ? "is-hover" : ""}`} aria-label={link.label}>
                {link.stackedLabel ? (
                  <span className="souv-nav-label-stack">
                    <span>{link.stackedLabel[0]}</span>
                    <span>{link.stackedLabel[1]}</span>
                  </span>
                ) : (
                  link.label
                )}
                <span className="souv-nav-underline" />
              </Link>
              {hovered === link.label && (
                <div className="souv-nav-popover">
                  <div className="souv-nav-popover-arrow" />
                  <div className="souv-rule-gold" />
                  <div className="souv-nav-popover-body">
                    <div className="souv-nav-popover-title">{link.label}</div>
                    <div className="souv-nav-popover-rule" />
                    <div className="souv-nav-popover-sub">{resolvedLoggedIn ? link.sub : link.signedOutSub || link.sub}</div>
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        ))}
      </nav>

      <NavRight
        loggedIn={resolvedLoggedIn}
        user={resolvedUser}
        creditBalance={creditBalance.balance}
        creditStatus={creditStatus}
        cardBank={resolvedCardBank}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        compactLinks={isLanding ? navLinks : undefined}
        hasSession={signedIn}
      />
    </header>
  );
}

export { Navbar };
export type { NavbarProps };
