# Real-device and screen-reader checklist (for the owner)

Date: 2026-11-09 (Part 3, Build My Card and Personalize, added the same day). Branch `mock-data-mode`.

Browser emulation and scripted checks can't replace a real phone or a real screen reader. The audit (`SITE-AUDIT-2026-11-08.md`) checked layouts at 1280×720, 1024×768, 768×1024 and 375×812 and read the accessibility tree by script, but **no real device and no screen reader was used**. Run these yourself and note anything odd next to the item.

**Setup:** use a deployed preview, or your computer's address on the same Wi-Fi (`npm run dev -- -H 0.0.0.0`, then `http://<your-computer's-IP>:3000`). Mock mode works on a phone: log in as demo@souvenote.com / Souvenote123!. The Mock data badge (bottom right) adds credits or resets everything.

---

## Part 1: Real devices

Do each item on an **iPhone (Safari)**, an **Android phone (Chrome)** and an **iPad (Safari)**, in portrait, plus landscape where it says so.

### Safe areas and the home indicator
- [ ] On an iPhone with a notch or Dynamic Island, nothing in the top nav sits under the status bar, and nothing at the bottom sits under the home indicator. Check: `/`, `/create`, Delivery's action bar and the cookie banner.
- [ ] **Cookie banner** (clear site data first, or open a private tab): it sits above the home indicator, its Decline and Accept buttons are fully tappable, and it doesn't cover the page's main button. The page still scrolls with it open.
- [ ] Turn the phone to landscape on `/` and `/delivery`: no content hides behind the notch on the left or right.

### One-screen layouts (100dvh)
- [ ] **Log In** and **Sign Up:** the card fits the screen without scrolling while the address bar is showing. It still fits after you scroll and the bar shrinks or grows, and nothing jumps.
- [ ] **Build My Card** and **Personalize a Template** questionnaire steps: each step fits one screen, and the Next/Back bar stays at the bottom.
- [ ] **Pop-ups:** Top up cards, Top up credits, Checkout, Community Cards' "Send this card", two-step setup and Delete account. Note whether each fits one screen or scrolls. On phones, Top up and Checkout are known to scroll (audit Part B), so note how that feels.

### Sticky nav and action bars
- [ ] The top nav stays at the top while you scroll and doesn't flicker or leave a gap when the address bar hides.
- [ ] Delivery's forest action bar (Back to review, Continue to checkout) stays visible at the bottom and doesn't cover the last field.
- [ ] The hamburger menu opens and closes, scrolls if the phone is short, and the page behind doesn't scroll at the same time.

### The keyboard covering fields
- [ ] **Delivery:** tap First name, Postal code and the return address's City. Each field scrolls into view above the keyboard, the sticky action bar doesn't sit on top of it, and you can reach "Continue to checkout" after closing the keyboard.
- [ ] **Contact:** type a long message. The text area stays visible, and the character counter can be read.
- [ ] **Settings:** Personal info (Phone, Birthday picker), Saved recipients (add one), Payment methods ("Last four digits" brings up the number pad), Change password, and the two-step code (number pad, and iOS offers the code from Messages or Passwords).
- [ ] **Log In code step:** the number pad appears and one-time-code autofill is offered.
- [ ] No page zooms in when a field is focused (iOS does this for text under 16px).

### QR code and song
- [ ] Print a finished card with a song from Saved Cards & Songs. Scan the inside QR code with the iPhone camera and the Android camera (or Google Lens) at arm's length, in normal room light. It opens the song page and the song plays.
- [ ] Scan the two-step setup QR code (Settings → Password & sign-in → Turn on) with Google Authenticator and 1Password. The account name shows as Souvenote with the right email. In mock mode the accepted code is 246810, not the app's code.

### Apple Pay and Google Pay
- [ ] In Checkout, Safari on an iPhone with a card in Wallet shows the Apple Pay button, and Chrome on Android shows Google Pay. Note: in mock mode these buttons are styled stand-ins, so this only checks look and tap size until real Stripe is connected (see `LAUNCH-READINESS.md`).
- [ ] The buttons are at least as tall as the Pay button, and their labels are readable.

### Touch targets and gestures
- [ ] Every button and link is easy to hit with a thumb, especially: the quantity "−" / "+" (Cart, Big Sender), the carousel dots on `/create`, the Community Cards chips and row arrows (tablet), the footer links, the sign-in footer links and "Cookie settings", and the Settings "Edit" / "Delete" / "Remove" links.
- [ ] Swiping the `/create` carousel, the Welcome carousel and the Community Cards rows feels natural and doesn't scroll the whole page sideways.
- [ ] Landing gallery: tapping a card turns it over, and "Try with your own photo" opens the camera roll.

### iPad only
- [ ] At 768 and 1024 wide (portrait and landscape): the nav switches correctly, the hover-only popovers (credits and cards in the nav) also open with a tap, and nothing depends on hover to work.

---

## Part 2: Screen reader (VoiceOver on iPhone or Mac; NVDA on Windows)

**Can't be done here.** The audit read the accessibility tree by script only: names, roles, headings, landmarks, live regions, `aria-pressed` and `aria-current`. A real pass is still needed.

**Quick start:**
- **NVDA (free, Windows):** Insert+Space switches between browse and focus mode. H moves to the next heading, D to the next landmark, Tab to the next control.
- **VoiceOver on Mac:** Cmd+F5. Ctrl+Option+U opens the rotor (headings, landmarks, links).
- **VoiceOver on iPhone:** Settings → Accessibility. Swipe right for the next item, and use the rotor (two-finger twist) for headings.

On each page, check that:
- [ ] **Page load:** the page title is read. After moving to another page, VoiceOver or NVDA starts at the new page's main heading (the new page-focus rule), not the top of the nav.
- [ ] **Skip link:** the first Tab gives "Skip to content", and pressing it moves to the main content.
- [ ] **Headings:** the headings list makes sense on its own. There's one main heading per page, and the script word (for example "worth *keeping*") is read as part of the heading, not separately.
- [ ] **Landmarks:** the list shows banner, navigation, main and contentinfo (footer).
- [ ] **Nav:** the credits badge reads as "20 credits, 0 cards…" and its popover links are reachable. The Menu button says expanded or collapsed.
- [ ] **Buttons with icons only** (cart, menu, close ×, carousel dots, row arrows, the reveal-password eye) all have names.
- [ ] **Toggles** are read with their state, for example "Canada, toggle button, pressed": the Prices for switch, Delivery's One recipient / Multiple and Send now / Schedule, and the cookie banner's choice when reopened.
- [ ] **Forms:**
  - Each field reads its label. Required fields say so. On a wrong submit, the error is read with the field (Contact, Saved recipients ZIP, Payment methods' last four, Change password, the two-step code, Log In).
  - Status messages are announced without moving focus: "Saving…" and "Saved." in Settings, "Your details are saved.", and the Delivery status line.
- [ ] **Pop-ups:**
  - The title and description are read on open, and focus stays inside. Escape closes it, and focus returns to the button that opened it.
  - Pop-ups to check: Top up, Checkout, Log in before checkout, Community send, two-step setup, Turn off, Delete account, Remove card, Delete recipient, Delete saved card, the Welcome modal, and "Your cards are waiting".
- [ ] **Busy buttons:** pressing Save, Send, Pay or Log In reads the busy label ("Saving…", "Logging in…"), focus doesn't jump to the top of the page, and the result is read afterwards.
- [ ] **Images:**
  - The logo is read as "Souvenote".
  - Decorative card art and engravings are skipped.
  - The QR code in two-step setup is read as "QR code to add Souvenote to your authenticator app".
- [ ] **FAQ:** each question reads as a button, collapsed or expanded. The answer is read after it's opened.
- [ ] **Legal tables on a phone:** the table area is announced as a scrollable region with its name.
- [ ] **Cookie banner:** on first visit it's announced as "Cookies on Souvenote, region". Reopened from "Cookie settings", focus lands on its heading and the current choice is read.

---

## Part 3: Build My Card and Personalize a Template (added 2026-11-09)

Run one full card in each flow on an iPhone (Safari), an Android phone (Chrome) and an iPad. Build My Card: photo → Decorate → message → song → Create → Review. Personalize: Comic Card (it has a photo step), then Horoscope (date selects).

### Photos
- [ ] **Camera roll on iPhone:** "Choose photos" opens the photo picker. Pick two normal iPhone photos (they're HEIC on the phone). They upload and show as thumbnails; nothing says the format is wrong. Safari should hand them over as JPEG because the picker only accepts JPEG, PNG and WebP. Note it if it doesn't.
- [ ] **Take a photo:** from the same picker choose "Take Photo" (iPhone) or the camera (Android). The new photo is added. Note: the site's Permissions-Policy turns off live camera access (`camera=()`), which doesn't affect the system camera in the picker. If the camera option is missing, tell the developer.
- [ ] **Large files:** pick a 12+ MB photo or a long panorama. It's added or refused with a clear message, and the page doesn't freeze.
- [ ] **16-photo limit:** add photos until "Choose photos" is dimmed. Pressing it again does nothing, and focus or the screen doesn't jump.
- [ ] **iPad drop zone:** with Split View or Slide Over, drag a photo from Photos onto "Drop photos here". It's added and the rights pop-up opens.

### The rights pop-up
- [ ] **On a phone it's two screens:** the promises, then "Next: confirm" with the two tick boxes. Each tick box is easy to hit (tap the words too), and "Agree & continue" only works once both are ticked.
- [ ] **On a short phone** (iPhone SE, or with the address bar showing), note whether the first screen needs scrolling (it's 712px tall; a proposal to fix it is in the Prompt 2 flows report).
- [ ] The Terms and Privacy links open in a new tab, and going back keeps your ticks.

### One section per screen and "Your card so far"
- [ ] Each phone step fits one screen with the Back/Continue bar at the bottom. "Next: …" moves between a step's sections (wearers, the song and QR code, the Comic Card panels), and Back steps back.
- [ ] **"Your card so far" sheet:** tap the bar to open it. It slides up from the bottom, scrolls inside, and its bottom edge clears the home indicator. Note if the page behind it scrolls too.
- [ ] "Change" on a row in the sheet closes it and opens that question.

### Scroll rows and date selects (Personalize)
- [ ] **Gallery rows:** swipe each row sideways. The page doesn't scroll up or down at the same time, and the last card isn't hidden behind the edge.
- [ ] **Horoscope's birthday:** the month and day selects open the phone's own picker (wheel on iPhone, list on Android), and the chosen date shows the right sign.

### Typing with the keyboard open
- [ ] **Message step:** type a long message (about 400 characters) with the keyboard open. The box grows, the text you're typing stays visible above the keyboard, and the counter can still be read. The Continue bar doesn't cover the box.
- [ ] **"What should change?":** tap the few-words field. It scrolls above the keyboard, and the sign-off select opens the phone's picker.
- [ ] No step zooms in when a field is focused.

### Create, Review and the song
- [ ] **Create:** "Making your card" can't be closed while it works, and the phone doesn't lock or dim mid-way on a slow connection.
- [ ] **Review on a phone:** the three cards (front, message, song) each show their decision buttons without hunting; Approve shows "Approved".
- [ ] **Song preview on iOS:** once real audio is connected (today Review says "A player appears here once real audio is connected"), press Play. It plays through the speaker with the ring/silent switch on silent too, stops when you leave the page, and doesn't start by itself.
- [ ] **QR code:** print a card with a song and scan the inside code with both phones' cameras (see "QR code and song" above).

### Screen reader in the flows (VoiceOver or NVDA)
- [ ] **Each new step:** after Continue, the step's heading is read ("Choose a blueprint, heading level 1"). On phones, "Next: …" reads "Part 2 of 3: …".
- [ ] **Radio cards:** the shape, blueprint, border and song choices read as "radio button, 1 of 3, checked/not checked", and the arrow keys move the choice.
- [ ] **AI writer, "Suggest a caption" and lyrics:** pressing one reads "Writing your message…" (or "Finding the right words…"). **Note whether anything is read when the draft arrives.** Our scripted check found nothing is announced, so you may have to move to the box yourself.
- [ ] **Sign-off select:** note whether its name is read once ("Sign-off") or with the hint twice.
- [ ] **Rights pop-up:** the title and the first sentence are read on opening; the status line ("Tick both boxes to continue.") is read after each tick.
- [ ] **Review:** each decision button reads with its card ("Approve front, toggle button, not pressed"). After pressing it, note what's read: the button now shows "Approved" but is still named "Approve front".
- [ ] **"Your card so far" on desktop:** in the headings list, the stage names (Photo, Basics…) should sit under a "Your card so far" heading.

