# PokerStack

A mobile-first tracker for a private poker cash game. Record buy-ins and rebuys, reconcile chips, calculate profit/loss, and settle up with friends. PokerStack does not deal cards or run online poker.

## Run locally

Requires Node.js 20.9 or later (Node.js 22 recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000. For a production build:

```bash
npm run build
npm start
```

## Features

- Setup for 2–20 players, unique names, decimal cash buy-ins, and EUR/USD/GBP/VND.
- One initial buy-in per player; quick rebuys, custom half/whole rebuys, removal confirmation, timestamped history, and undo.
- Live money-in, total buy-ins, and issued chips. Money-in means total session investment, not a hand's pot.
- Automatic recovery of an active game and partially entered final chip counts.
- Chip reconciliation, explicit missing/extra chip warnings, and confirmed unbalanced settlement.
- Ranked results, invested/cash-out totals, accessible profit/loss labels, and net verification.
- Suggested direct payments using largest-balance-first matching. These reduce transfers but do not guarantee the mathematical minimum. Skip them if a central bank pays cash-outs. Unbalanced sessions have no suggested transfers.
- Completed history, individual/all-history deletion with confirmation, new games, and rematches.
- System/light/dark appearance, default currency, removal preference, and raw JSON backup export.
- PWA manifest, PNG icons, Apple metadata, safe-area-aware bottom navigation, and a production service worker.

## Technology and structure

Next.js App Router, React, strict TypeScript, Tailwind CSS v4, Lucide React, and native accessible dialogs. No database, authentication, analytics, API keys, or environment variables are required.

```text
app/                Application shell, metadata, and responsive design tokens
components/         Setup, live game, settlement, results, history, settings, UI primitives
hooks/useStore.ts   Hydration, synchronous persistence, cross-tab updates, and theme
lib/calculations.ts Exact payout calculations and suggested payments
lib/storage.ts      Versioned storage and game creation
lib/validation.ts   Setup and persisted-data validation
types/game.ts      Game, player, history event, settings, and store interfaces
public/             Manifest, service worker, and app icons
tests/             Domain calculation tests
e2e/               Mobile Chromium and WebKit browser tests
```

Navigation uses URL fragments (`/#game`, `/#history`, `/#settings`, `/#results/<id>`), so every screen shares the same small offline application shell. Results links reference data in the current browser; they are not public share links.

## Calculations and limits

Cash buy-ins accept two decimal places and are converted to integer hundredths of the selected currency. All four currencies display two decimal places consistently, including VND. Half buy-ins are rounded to the nearest hundredth when calculating each player's invested amount.

Payouts use exact `BigInt` rational arithmetic and a largest-remainder allocation. Balanced games distribute exactly the total invested amount; ties use original seating order. A player may receive a rounding adjustment of a hundredth, which keeps the table's displayed net at zero. This avoids floating-point amounts and arbitrary fractional-cent comparisons.

Limits keep calculations and rendering predictable: buy-in 0.01–1,000,000; whole chips per buy-in 1–1,000,000,000; 1–1,000 buy-ins per player in increments of 0.5; whole final chip counts 0–1,000,000,000,000; player names 1–40 characters. Half rebuys require a starting stack divisible by two so no fractional physical chips are issued. Additional currencies can be added in `types/game.ts` and the currency registry in `lib/calculations.ts`.

## Local data and recovery

The versioned JSON document is stored under `pokerstack.v1` in `localStorage`. It includes one active session, completed history, and settings. Writes happen synchronously on each important action before confirming the UI change. The app validates reads and writes, preserves unreadable data, and displays a visible error if storage is unavailable or full. Other tabs receive storage updates; use one tab for edits to avoid simultaneous conflicting actions.

On refresh/reopen, unfinished sessions show **Continue game** and a confirmed **Discard game** action. Settlement is saved to history automatically; new games do not remove history. Storage is specific to the browser, device, and site origin. Private browsing, browser cleanup, device loss, and Safari storage eviction can remove it. An iOS home-screen installation may have separate storage from Safari. Export backups in Settings before clearing browser data. Backup export is JSON; an import UI is not included.

## Install on iPhone

1. Open PokerStack in Safari.
2. Tap **Share**.
3. Select **Add to Home Screen**.
4. Tap **Add**.

On Android, use **Install app** / **Add to Home Screen** in the browser menu. Installation requires a supported browser and HTTPS (localhost is permitted for development).

## Offline use

The production service worker caches the app shell and static assets after an initial successful online load. Wait for the first load to finish before going offline. Calculations and game data never require a network connection. The worker is disabled under `npm run dev`; verify offline behavior with `npm run build && npm start` on localhost or an HTTPS deployment.

New service workers wait for older tabs to close before taking over. Shell navigation uses network-first with a cached offline fallback; immutable build assets use cache-first. If the browser evicts its caches, an online load is needed again. Real iPhone installation/offline behavior should be checked on the target device; automated WebKit tests do not expose service workers.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Mobile end-to-end tests:

```bash
npx playwright install chromium webkit
npm run build
npm run test:e2e
```

Playwright starts a production server if port 3000 is free. Stop any development server first. Tests use isolated browser storage and cover the supplied €160 session, refresh recovery, partial chip recovery, payouts, rematch, fractional rebuys, undo, confirmation dialogs, mismatches, deletion, themes, validation, responsive width, and Chromium offline recovery. WebKit runs at an iPhone-sized viewport; it does not substitute for a physical-device Safari check.

Format source with `npm run format`.

## Deploy to Vercel

1. Push the project to a Git repository.
2. Import that repository into Vercel and select the **Next.js** framework preset.
3. Keep the standard install and build commands (`npm install`, `npm run build`). No environment variables are required.
4. Deploy and open the HTTPS URL.
5. Verify a complete session and Add to Home Screen from your iPhone.

There is no backend to provision. Each deployment hostname has separate local storage; use a stable production domain for real sessions.
