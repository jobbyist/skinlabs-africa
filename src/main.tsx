import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initAnalytics } from "./lib/analytics";
import "./i18n/config";
import "./index.css";

initAnalytics();
createRoot(document.getElementById("root")!).render(<App />);
