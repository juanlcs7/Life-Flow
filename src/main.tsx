import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerLifeFlowPwa } from "./lib/pwa";
import { initializeMonitoring } from "./lib/monitoring";

initializeMonitoring();
registerLifeFlowPwa();
createRoot(document.getElementById("root")!).render(<App />);
