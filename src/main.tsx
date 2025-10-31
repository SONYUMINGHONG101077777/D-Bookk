import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { queryClient } from "./lib/queryClient.ts";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {persister} from "./lib/queryClient.ts"
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <PersistQueryClientProvider client={queryClient} persistOptions={{persister}}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
    </PersistQueryClientProvider>
  </BrowserRouter>
);
