import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import VideoTOC from "./VideoTOC";
import VideoContent from "./VideoContent";

export default function Video() {
  const [searchParams] = useSearchParams();
  const videoId = searchParams.get("video_id");
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const handleOpenVideo = useCallback((id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("video_id", id);
    // Update URL without full page reload
    window.history.pushState(null, "", `?${newParams.toString()}`);
    setIsSidebarOpen(false);
  }, [searchParams]);

  const handleRefetch = useCallback(async () => {
    console.log("Refreshing video data...");
    setIsRefetching(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsRefetching(false);
    // Trigger a re-render of components
    window.dispatchEvent(new Event('locationchange'));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar - Always visible on desktop */}
      <div className="hidden md:flex h-full w-64">
        <VideoTOC
          currentVideoId={videoId}
          onOpenVideo={handleOpenVideo}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setIsSidebarOpen(false)} 
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 z-50">
            <VideoTOC
              currentVideoId={videoId}
              onOpenVideo={handleOpenVideo}
              onClose={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <VideoContent
          videoId={videoId || ""}
          onOpenVideoToc={toggleSidebar}
          refetch={handleRefetch}
          isRefetching={isRefetching}
        />
      </div>
    </div>
  );
}