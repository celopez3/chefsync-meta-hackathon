/**
 * Camera seam — the one place a Capacitor build swaps out.
 *
 * Today (web): "Take a photo" is a file input with
 * capture="environment". On a phone that opens the rear camera app
 * directly (native UI, flash, tap-to-focus); on desktop it degrades to
 * a file picker. There is deliberately no in-page live viewfinder:
 * getUserMedia needs HTTPS, duplicates the camera app, and confused
 * the flow next to the capture button.
 *
 * With Capacitor later: implement take-a-photo with @capacitor/camera
 * behind this module and callers do not change. See docs/capacitor.md.
 */
export const CAMERA_INPUT_PROPS = { accept: "image/*", capture: "environment" } as const;
