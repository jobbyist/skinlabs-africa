/** Window events that let any surface (settings card, footer, a CTA) open lazy-loaded PWA dialogs. */
export const PWA_UI_EVENTS = {
  openInstall: "skinlabs:pwa-open-install",
  openNotifications: "skinlabs:pwa-open-notifications",
} as const;

/** Opens the branded install dialog on request (skips the engagement/cooldown rules). */
export const openInstallPrompt = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PWA_UI_EVENTS.openInstall));
};

/** Opens the "Stay in the loop" notification permission dialog. Permission is only ever requested from its button. */
export const openNotificationPrompt = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PWA_UI_EVENTS.openNotifications));
};
