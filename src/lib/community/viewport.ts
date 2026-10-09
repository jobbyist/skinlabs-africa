/**
 * Keyboard-aware sizing. On phones the software keyboard shrinks the *visual* viewport but not the layout viewport, so a
 * bottom sheet pinned to `bottom: 0` ends up underneath it. The inset is how far the visual viewport's bottom edge sits above the
 * layout viewport's bottom edge.
 */
export interface ViewportLike {
  height: number;
  offsetTop: number;
}

/** Below this the "keyboard" is browser chrome (URL bar collapsing), not a keyboard. */
export const KEYBOARD_MIN_INSET = 80;

export const keyboardInset = (layoutHeight: number, vv: ViewportLike | null | undefined): number => {
  if (!vv) return 0;
  return Math.max(0, Math.round(layoutHeight - vv.height - vv.offsetTop));
};

export interface SheetMetrics {
  /** Distance from the bottom of the screen (0 when no keyboard). */
  bottom: number;
  /** Height the sheet may use: a share of what is actually visible. */
  maxHeight: number | null;
  keyboardOpen: boolean;
}

export const sheetMetrics = (layoutHeight: number, vv: ViewportLike | null | undefined, share = 0.94): SheetMetrics => {
  if (!vv) return { bottom: 0, maxHeight: null, keyboardOpen: false };
  const inset = keyboardInset(layoutHeight, vv);
  return { bottom: inset, maxHeight: Math.round(vv.height * share), keyboardOpen: inset >= KEYBOARD_MIN_INSET };
};
