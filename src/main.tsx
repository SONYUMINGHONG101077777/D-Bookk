import React from 'react'
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import Video from "./components/Video.tsx"; 
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { queryClient } from "./lib/queryClient.ts";
import { QueryClientProvider } from "@tanstack/react-query";

// PWA registration
import { registerSW } from 'virtual:pwa-register'

registerSW({
  onOfflineReady() {
    console.log('PWA ready to work offline')
  }
})

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/reader/:bookId?" element={<App />} />
            <Route path="/video" element={<Video />} /> 
            <Route path="*" element={<App />} />
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);