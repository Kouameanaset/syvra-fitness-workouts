// Entry point: the first file the browser runs (index.html loads it).

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";

// createRoot connects React to the <div id="root"> of index.html.
// BrowserRouter gives every component access to the URL (routing).
// StrictMode runs extra checks in development (it renders effects twice on
// purpose to reveal bugs, which is why useFetch ignores stale responses).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
