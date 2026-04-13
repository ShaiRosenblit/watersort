/**
 * Tactile feedback via the Web Vibration API.
 *
 * **Supported:** Most Android browsers (Chrome, Firefox, Samsung Internet, Edge)
 * on HTTPS (and localhost). Vibrations run in direct response to user gestures
 * (tap handlers), which matches browser requirements.
 *
 * **Not supported:** iOS Safari / WebKit do not implement `navigator.vibrate`,
 * so there is no standard way to buzz from a web page on iPhone. A native
 * shell (e.g. Capacitor) would be needed for haptics there.
 */
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Some WebViews throw if vibrate is blocked */
  }
}

/** Light tap — selecting a tube, navigation */
export function tapLight() {
  vibrate(10);
}

/** Medium tap — successful pour, undo applied */
export function tapMedium() {
  vibrate(18);
}

/** Error buzz — invalid move */
export function tapError() {
  vibrate([28, 45, 28]);
}

/** Celebration — win */
export function tapCelebration() {
  vibrate([35, 55, 35, 55, 90]);
}

/** Whether the device/browser might vibrate (still may no-op per policy). */
export function hapticsAvailable(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}
