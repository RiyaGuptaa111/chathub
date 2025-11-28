import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { CssBaseline } from "@mui/material";
import { HelmetProvider } from "react-helmet-async";
import {Provider} from "react-redux"
import store from "./redux/store.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/* Provider is used to make the Redux store available to all components in your application.
Any component within the Provider can access the store and dispatch actions. */}
    <HelmetProvider>
      <CssBaseline />

      {/* //disable right click */}
      <div onContextMenu={(e) => e.preventDefault()}>
        <App />
      </div>
    </HelmetProvider>
    </Provider>
  </StrictMode>
);
