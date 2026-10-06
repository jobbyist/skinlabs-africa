/** App badge (Badging API): installed apps on Android/desktop Chromium and iOS 16.4+ web apps. Feature-detected no-ops elsewhere. */
type BadgeNavigator = Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };

export const setBadge = async (count: number) => {
  const nav = navigator as BadgeNavigator;
  try {
    if (count > 0) await nav.setAppBadge?.(count);
    else await nav.clearAppBadge?.();
  } catch {
    /* unsupported or not permitted */
  }
};

export const clearBadge = () => setBadge(0);
