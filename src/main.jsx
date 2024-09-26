import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-balham.css";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { AppContextProvider } from "./context/AppContextProvider.jsx";
import { Wrapper } from "./components/Wrapper.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppContextProvider>
      <Wrapper>
        <App />
      </Wrapper>
    </AppContextProvider>
  </StrictMode>
);
