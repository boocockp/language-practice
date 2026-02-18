import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./app/App";
import { CurrentLanguageProvider } from "./contexts/CurrentLanguageContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CurrentLanguageProvider>
      <App />
    </CurrentLanguageProvider>
  </StrictMode>,
);
