import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupIonicReact } from "@ionic/react";
import App from "./App";
/* Ionic CSS is imported (layered) from index.css so Tailwind wins. */
import "./index.css";

setupIonicReact();

createRoot(document.getElementById("root")!).render(
  <StrictMode><App /></StrictMode>,
);
