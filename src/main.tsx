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

// import { createRoot } from "react-dom/client";
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { QueryClientProvider } from "@tanstack/react-query";
// import "./index.css";
// import App from "./App.tsx";
// import { ThemeProvider } from "./components/ThemeProvider.tsx";
// import { queryClient } from "./lib/queryClient.ts";

// // PWA registration
// import { registerSW } from 'virtual:pwa-register'

// registerSW({
//   onOfflineReady() {
//     console.log('PWA ready to work offline')
//   }
// })

// createRoot(document.getElementById("root")!).render(
//   <BrowserRouter>
//     <QueryClientProvider client={queryClient}>
//       <ThemeProvider>
//         <Routes>
//           {/* Reader route - for reading text */}
//           <Route path="/reader/:bookId" element={<App />} />
          
//           {/* Video route - for watching video */}
//           <Route path="/video/:bookId" element={<App />} />
          
//           {/* Default route - redirect to reader */}
//           <Route path="/" element={<Navigate to="/reader/64" replace />} />
          
//           {/* Catch-all route - redirect to reader */}
//           <Route path="*" element={<Navigate to="/reader/64" replace />} />
//         </Routes>
//       </ThemeProvider>
//     </QueryClientProvider>
//   </BrowserRouter>
// );