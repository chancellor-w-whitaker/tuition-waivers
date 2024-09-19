import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import App from "./App.jsx";
import "./index.css";
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
