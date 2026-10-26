# Sonar frontend

React + Vite web app (installable PWA) for Sonar, the early warning for low blood sugar.

## Run

1. Start the backend from the repo root: `py app.py` (serves http://127.0.0.1:5000)
2. In this folder: `npm install`, then `npm run dev`

## Build and check

- `npm run build`: production build in `dist/` (includes the service worker and manifest)
- `npm run lint`: must pass with no errors
- `npm run preview`: serve the production build locally

## Configuration

- `VITE_API_URL`: backend address, set at build time on the host. Defaults to `http://127.0.0.1:5000`.

## Deploying

- **Frontend (Vercel):** project Root Directory `frontend`, Vite preset, output `dist`. Set `VITE_API_URL` to the
  backend's URL (e.g. `https://sonar-api.onrender.com`) for Production; it's read at build time, so redeploy after
  changing it. `vercel.json` rewrites every path to `index.html` (the app uses client-side routes like
  `/demo/...`); real files (assets, `sw.js`, icons) are still served first.
- **Backend (Render):** see `render.yaml` in the repo root. Set `ALLOWED_ORIGINS` there to this site's URL, or the
  browser will block API calls (CORS).
- The free Render plan sleeps when idle. The app pings `/api/health` on load, waits up to 90 seconds per request
  (3 minutes for upload and Nightscout), and shows "Waking up the server…" when a request takes over 5 seconds.

## Icons

`public/icon.svg` is the source logo. After changing it, run `npm run generate-pwa-assets` to regenerate the PNG
icons (192, 512, maskable, Apple touch) and `favicon.ico`.

## Privacy

Uploaded and Nightscout data live in React state only and are never written to browser storage. The service worker
caches only the app's own files, never API responses. Only display settings (units, view, theme) are saved in
localStorage.
