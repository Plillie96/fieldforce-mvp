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

## Run it on your phone (Vercel)

The repository is connected to Vercel, which builds and deploys on every push —
production from `main`, and a preview URL for every pull request. Vercel runs its
own build (`npm run build`), so no GitHub Actions or extra config is needed.

**On iPhone (Safari):** open the deployment URL → tap **Share** → **Add to Home
Screen**. It launches full-screen like a native app, and the camera button uses
the rear camera. Vercel's HTTPS is what makes the install + offline caching work.

> Vercel serves from the domain root, so `base` defaults to `/`. A GitHub Pages
> project-site build can still opt into the `/fieldforce-mvp/` subpath by setting
> the `GITHUB_PAGES=true` environment variable at build time.

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
