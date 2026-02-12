import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { LanguageProvider } from "./context/LanguageContext";
import { NavProvider } from "./context/NavContext";
import { AuthProvider } from "@/context/AuthContext";

// Create a root div element if it doesn't exist (for hydration)
const rootElement = document.getElementById("root") || document.createElement("div");
if (!document.getElementById("root")) {
  rootElement.id = "root";
  document.body.appendChild(rootElement);
}

// Changed the order of providers to make sure LanguageProvider is available before any component tries to use it
createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <NavProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NavProvider>
    </LanguageProvider>
  </QueryClientProvider>
);
