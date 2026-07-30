import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerLifeFlowPwa } from "./lib/pwa";

registerLifeFlowPwa();
createRoot(document.getElementById("root")!).render(<App />);
