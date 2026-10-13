import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installDomResilience } from "./lib/domResilience";
import { reloadForNewDeployment } from "./lib/chunkRecovery";
import { initPwa } from "./lib/pwa/init";
import { installRoutePrefetch } from "./lib/routePrefetch";
import { installHaptics } from "./lib/haptics";

installDomResilience();

// Vite fires this when a lazy chunk's preload (JS or CSS) 404s — i.e. this tab
// is running a build that has since been replaced. One guarded reload fixes it.
window.addEventListener("vite:preloadError", (event) => {
  if (reloadForNewDeployment()) event.preventDefault();
});

// PWA layer (service worker, install prompt capture, network status): src/lib/pwa.
// Replaces the earlier teardown that unregistered every worker and cleared ALL
// caches on each load — which would also have wiped members' offline podcast downloads.
initPwa();
installRoutePrefetch();
installHaptics();

createRoot(document.getElementById("root")!).render(<App />);
