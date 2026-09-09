# Budget Tracker

An offline, installable budget tracker with monthly budgets, Online / Office / Card / EMI expenses, transaction history, and daily allowance tracking.

## Run locally

Run `python3 -m http.server 4173`, then open http://localhost:4173. No dependency installation is required.

## Validate and build

- `node --test tests/app.test.mjs` exercises expense validation and submission, budget adjustments, deletion confirmation, keyboard modal behavior, daily pace, and monthly reset using a lightweight DOM stub and the localStorage fallback.
- `node build.mjs` validates JavaScript and the web manifest, then copies the static app to `dist/` for deployment.

The tests do not replace browser checks of layout, IndexedDB, or service-worker behavior.

## Data and offline use

Budgets and expenses stay in IndexedDB on the current device and browser origin, with a localStorage fallback. The storage schema and existing keys are unchanged. A preview on another domain has separate storage; it does not contain transactions from an existing installation. Updating the app on its original domain retains existing data.

The service worker caches the app shell for offline use. Bump its cache version whenever shell assets change. All runtime assets are local; the app has no external font or script dependencies.

## Interface

The dashboard uses a responsive two-column layout on larger screens and one column on phones. Expense entry, budget controls, and month navigation remain directly accessible. Destructive actions require confirmation, dialogs support Escape and keyboard focus containment, and reduced-motion preferences are respected.
