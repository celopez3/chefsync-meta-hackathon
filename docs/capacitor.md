# Wrapping ChefSync with Capacitor (later)

The web app is already shaped for this. Nothing here is installed yet —
follow these steps when you want the native shell.

## What is already Capacitor-ready

- `vite.config.ts` uses `base: "./"`, so `dist/` loads from
  `capacitor://localhost` as well as from the Hono server.
- All API calls go through `src/lib/api.ts` (`apiUrl()`). On the web it is
  same-origin; in a shell set `VITE_API_BASE_URL=https://<your-worker>`
  because `capacitor://localhost/api` reaches nothing. CORS is already
  enabled on the Hono app.
- Camera access sits behind `src/lib/camera.ts`. Web uses
  `capture="environment"` (the phone's own camera app); only that file
  changes when the native camera plugin lands.
- Layout uses `viewport-fit=cover` and `env(safe-area-inset-*)` for
  notches / home indicators, and the sticky bottom action bar already
  behaves like a native tab action.

## Steps

The UI shell is Ionic React (`IonApp`, tab bar, modal sheets), which is
the framework Capacitor is designed to host — no UI rework is needed,
only the native wrapper below.

```bash
npm install @capacitor/core @capacitor/camera
npm install -D @capacitor/cli
npx cap init ChefSync chefsync.app --web-dir=dist
npx cap add ios      # and/or: npx cap add android
npm run build
npx cap sync
npx cap open ios     # or android
```

Then:

1. Set `VITE_API_BASE_URL` to the deployed Worker URL (a phone or shell
   cannot reach this PC's `localhost`; for on-device dev, use the PC's
   LAN IP over HTTPS or the deployed API).
2. Swap the implementation in `src/lib/camera.ts` to
   `Camera.getPhoto({ source: CameraSource.Camera, resultType: ... })`
   and convert the result to a `File`. Callers do not change.
3. Add the platform camera permission strings Capacitor's docs require
   (`NSCameraUsageDescription` on iOS, camera permission on Android).

## Phone demo without Capacitor (today)

Run `npm start` on this PC, then on a phone on the same Wi-Fi open
`http://<this-pc-ip>:8787`. "Take a photo" opens the rear camera
directly, and the scan runs as soon as the photo is added.
