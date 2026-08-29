import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
