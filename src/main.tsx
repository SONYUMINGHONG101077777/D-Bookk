import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { queryClient } from "./lib/queryClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";

// ADD more 
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onOfflineReady() {
    console.log('PWA ready to work offline')
  }
})

createRoot(document.getElementById("root")!).render(
<BrowserRouter> 
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryClientProvider>
</BrowserRouter>

);
