import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installDomResilience } from "./lib/domResilience";
import { reloadForNewDeployment } from "./lib/chunkRecovery";

installDomResilience();

// Vite fires this when a lazy chunk's preload (JS or CSS) 404s — i.e. this tab
// is running a build that has since been replaced. One guarded reload fixes it.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewDeployment()) event.preventDefault();
});

// PWA functionality is temporarily disabled (see vite.config.ts). Actively
// unregister any service worker and clear its caches so visitors who
// installed the app previously fall back to a plain, always-fresh site.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => void registration.unregister());
  }).catch((error) => {
    console.warn("Failed to unregister service worker:", error);
  });
}
if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => void caches.delete(key));
  }).catch((error) => {
    console.warn("Failed to clear caches:", error);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
