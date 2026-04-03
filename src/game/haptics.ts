/** Light tap — selecting a tube, tapping a button */
export function tapLight() {
  navigator.vibrate?.(8);
}

/** Medium tap — successful pour */
export function tapMedium() {
  navigator.vibrate?.(15);
}

/** Error buzz — invalid move */
export function tapError() {
  navigator.vibrate?.([30, 50, 30]);
}

/** Celebration — win */
export function tapCelebration() {
  navigator.vibrate?.([40, 60, 40, 60, 80]);
}
