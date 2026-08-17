import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders, AppContent } from "./App";
import { PodcastPlayerProvider } from "./components/PodcastPlayer";
import "./index.css";

hydrateRoot(
  document.getElementById("root")!,
  <AppProviders>
    <BrowserRouter>
      <PodcastPlayerProvider>
        <AppContent />
      </PodcastPlayerProvider>
    </BrowserRouter>
  </AppProviders>,
);
