# Field Punch

A mobile-first PWA for capturing **site walk-through punch lists**. Walk a job
site, snap a photo, add a note, and Field Punch builds an organized, exportable
punch list — all on your device, and it works with no signal.

## Why

Punch lists (the list of defects and unfinished work to resolve before a project
closes out) are usually captured on paper or scattered across camera rolls and
text threads. Field Punch turns the walk-through itself into the list.

## Features

- 📷 **Capture in seconds** — take a photo, add a title, location, trade, and
  priority. Photos are downscaled on-device so storage stays light.
- 📋 **Organized punch list** — filter by status (open / in progress / done),
  sorted so open, high-priority items float to the top.
- ✏️ **Track to close-out** — tap an item to update its status or edit details.
- 📄 **Export a report** — generate a clean, printable punch list report and
  save it to PDF or print it to hand off.
- 📶 **Offline-first** — everything is stored locally in IndexedDB (photos
  included). Installable to your home screen; no account, no backend, no signal
  required.

## Tech

- **Vite + React + TypeScript**
- **IndexedDB** (via `idb`) for offline storage of projects, items, and photos
- **vite-plugin-pwa** for installability and offline app-shell caching
- **Hash router** so it deploys as a static site anywhere

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build
```

Open the dev URL on your phone (same network) or use your browser's device
emulation. To exercise the camera, open it on an actual mobile device — the
capture button uses the rear camera via `<input capture="environment">`.

## Run it on your phone (GitHub Pages)

The app auto-deploys to GitHub Pages via `.github/workflows/deploy.yml`.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment
→ Source** and select **GitHub Actions**. That's it — every push to `main` (and,
for now, to the preview branch) builds and publishes the site.

**Live URL:** `https://plillie96.github.io/fieldforce-mvp/`

**On iPhone (Safari):** open the URL → tap **Share** → **Add to Home Screen**. It
launches full-screen like a native app, and the camera button uses the rear
camera. HTTPS from Pages is what makes the install + offline caching work.

> The site is served from the `/fieldforce-mvp/` subpath, so `vite.config.ts`
> sets `base` accordingly. On a custom domain or user/org site, change it to `/`.

## Data & privacy

All data lives in your browser's IndexedDB on the device that captured it.
Nothing is uploaded. Clearing site data or uninstalling the PWA removes it, so
export a report before wiping. Cloud sync and multi-device sharing are natural
next steps (see below).

## Roadmap ideas

- Cloud sync / shared projects across a crew
- Assign items to subcontractors and email the report
- Annotate photos (arrows, circles) on the issue
- GPS / room tagging and floor-plan pins
- CSV export in addition to the PDF report

## Project structure

```
src/
  db.ts            IndexedDB data layer (projects, items, photos)
  image.ts         on-device photo downscaling
  types.ts         shared types and enums
  usePhotoUrl.ts   hook: photo blob -> object URL
  components/ui.tsx shared UI (top bar, badges, empty state)
  pages/
    Home.tsx        projects list + create
    ProjectView.tsx punch list with filters
    CaptureItem.tsx photo + details capture flow
    ItemDetail.tsx  view / edit / status
    Report.tsx      printable punch list report
```
