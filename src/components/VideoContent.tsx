"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReaderStore } from "../store/readerStore";
import { ChevronLeft, ChevronRight, RefreshCcw, Home } from "lucide-react";
import { videoApi, type VideoItem } from "../lib/video_api";
import { videoUtils } from "../lib/video_queries";
import LoadingModal from "./shared/LoadingModal";

type Props = {
  videoId: string;
  onOpenVideoToc?: () => void;
  refetch: () => void;
  isRefetching: boolean;
};

// Helper function to find video in tree
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const findVideoInTree = (
  videos: VideoItem[],
  videoId: string
): VideoItem | undefined => {
  if (!videos || videos.length === 0) return undefined;

  for (const video of videos) {
    if (video.id.toString() === videoId) {
      return video;
    }
    if (video.children_recursive && video.children_recursive.length > 0) {
      const found = findVideoInTree(video.children_recursive, videoId);
      if (found) return found;
    }
  }
  return undefined;
};

export default function VideoContent({
  videoId,
  onOpenVideoToc,
  refetch,
  isRefetching,
}: Props) {
  console.log("VideoContent Component - Video ID:", videoId);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const setCurrent = useReaderStore((s) => s.setCurrent);
  const language = useReaderStore((s) => s.language);

  const [videoData, setVideoData] = useState<VideoItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);

  // Use language from store
  const currentLanguage = language || "eng";

  // Fetch all videos on mount
  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        console.log("Fetching all videos for navigation");
        const response = await videoApi.getVideos({
          language: currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en',
          status: 1
        });
        
        if (response.success && response.data) {
          const videos = Array.isArray(response.data) ? response.data : [response.data];
          setAllVideos(videos);
          
          // Flatten tree for navigation
          const tree = videoUtils.buildTree(videos);
          const flatVideos = videoUtils.flattenTree(tree);
          
          // Find current video index
          const index = flatVideos.findIndex(v => v.id.toString() === videoId);
          if (index !== -1) {
            setCurrentVideoIndex(index);
            
            // Get related videos (siblings)
            const currentVideo = flatVideos[index];
            if (currentVideo.parent_id !== null) {
              const siblings = flatVideos.filter(v => 
                v.parent_id === currentVideo.parent_id && 
                v.id !== currentVideo.id
              );
              setRelatedVideos(siblings.slice(0, 3)); // Limit to 3 related videos
            }
          }
        }
      } catch (err) {
        console.error("Error fetching all videos:", err);
      }
    };

    fetchAllVideos();
  }, [videoId, currentLanguage]);

  // Fetch specific video data
  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) {
        console.log("No video ID, clearing video data");
        setVideoData(null);
        setError(null);
        return;
      }

      console.log(`Fetching video ${videoId}`);
      setIsLoading(true);
      setError(null);

      try {
        const id = parseInt(videoId, 10);
        if (isNaN(id)) {
          throw new Error("Invalid video ID");
        }

        const response = await videoApi.getVideoById(id);
        console.log("Video API response:", response);

        if (response.success && response.data) {
          const video = Array.isArray(response.data) ? response.data[0] : response.data;
          setVideoData(video);
          setCurrent("video", video.id.toString());
        } else {
          setError(response.error || "Video not found");
          setVideoData(null);
        }
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video. Please try again.");
        setVideoData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [videoId, setCurrent]);

  const navigateToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const navigateToNextVideo = useCallback(() => {
    if (allVideos.length === 0) return;

    const tree = videoUtils.buildTree(allVideos);
    const flatVideos = videoUtils.flattenTree(tree);
    
    const nextIndex = (currentVideoIndex + 1) % flatVideos.length;
    const nextVideo = flatVideos[nextIndex];
    
    if (nextVideo) {
      navigate(`/video?video_id=${nextVideo.id}`);
    }
  }, [allVideos, currentVideoIndex, navigate]);

  const navigateToPrevVideo = useCallback(() => {
    if (allVideos.length === 0) return;

    const tree = videoUtils.buildTree(allVideos);
    const flatVideos = videoUtils.flattenTree(tree);
    
    const prevIndex = (currentVideoIndex - 1 + flatVideos.length) % flatVideos.length;
    const prevVideo = flatVideos[prevIndex];
    
    if (prevVideo) {
      navigate(`/video?video_id=${prevVideo.id}`);
    }
  }, [allVideos, currentVideoIndex, navigate]);

  const getVideoTitle = () => {
    if (!videoData) {
      return "Loading Video...";
    }

    const title = videoUtils.getLocalizedVideoTitle(videoData, 
      currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
    );
    return title || videoUtils.getLocalizedName(videoData, 
      currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
    );
  };

  const getCategoryName = () => {
    if (!videoData || !allVideos.length) {
      return "";
    }

    if (videoData.parent_id) {
      const parent = allVideos.find(v => v.id === videoData.parent_id);
      if (parent) {
        return videoUtils.getLocalizedName(parent, 
          currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
        );
      }
    }
    
    return "Videos";
  };

  // Extract YouTube ID for embedding
  const youtubeId = useMemo(() => {
    if (!videoData?.video_url) return null;
    return videoUtils.extractYouTubeId(videoData.video_url);
  }, [videoData]);

  // Get thumbnail URL
  const thumbnailUrl = useMemo(() => {
    if (videoData?.video_thumb) {
      return videoData.video_thumb;
    }
    if (youtubeId) {
      return videoUtils.getYouTubeThumbnail(youtubeId, 'maxres');
    }
    return null;
  }, [videoData, youtubeId]);

  if (error && !isLoading && !isRefetching) {
    return (
      <section className="flex h-screen flex-col overflow-hidden bg-[rgb(var(--card))] relative">
        <header className="sticky top-0 z-20 backdrop-blur border-b border-slate-200 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVideoToc}
              className="md:hidden text inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              aria-label="menu"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-gray-400 truncate">
                PALM Tech Video Center
              </div>
              <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate text">
                Error Loading Video
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Video
              </h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-screen flex-col overflow-hidden bg-[rgb(var(--card))] relative">
      <header className="sticky top-0 z-20 backdrop-blur border-b border-slate-200 px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenVideoToc}
            className="md:hidden text inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            aria-label="menu"
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm text-gray-400 truncate">
              {getCategoryName()}
            </div>
            <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate text">
              {getVideoTitle()}
            </h1>
          </div>
          <span className="flex gap-2">
            <button
              onClick={navigateToHome}
              className="p-1 hover:bg-accent rounded"
              title="Back to Home"
              aria-label="Back to Home"
            >
              <Home size={17} className="text" />
            </button>
            
            <button
              onClick={() => {
                console.log("Refreshing...");
                refetch();
              }}
              className="p-1 hover:bg-accent rounded"
              title="Refresh"
            >
              <RefreshCcw size={17} className="text" />
            </button>
          </span>
        </div>
      </header>

      {(!videoData || !videoId) && !isLoading && !isRefetching && (
        <main className="mx-auto no-scrollbar py-4 max-w-3xl overflow-y-auto">
          <div className="text-center mt-4 text-muted-foreground">
            Select a video from the video list to start watching
          </div>
        </main>
      )}

      {videoData && (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-10 no-scrollbar"
          >
            {(isRefetching || isLoading) && (
              <LoadingModal isLoading={isRefetching || isLoading} />
            )}

            <div className="max-w-4xl mx-auto">
              {/* Video Player */}
              <div className="mb-6">
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  {youtubeId ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                      title={getVideoTitle()}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoData.video_url ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-white text-center">
                        <p>Video cannot be embedded</p>
                        <a
                          href={videoData.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline mt-2 inline-block"
                        >
                          Watch on external site
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <div className="text-white text-center">
                        <p>No video available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="bg-card rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-bold mb-2">{getVideoTitle()}</h2>
                  {videoData.video_title_en && (
                    <p className="text-muted-foreground mb-4">
                      {currentLanguage === 'kh' 
                        ? videoData.video_title_kh || videoData.video_title_en
                        : currentLanguage === 'ch'
                        ? videoData.video_title_ch || videoData.video_title_en
                        : videoData.video_title_en}
                    </p>
                  )}
                  
                  {thumbnailUrl && (
                    <div className="mb-4">
                      <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        className="w-32 h-18 object-cover rounded"
                      />
                    </div>
                  )}

                  {/* Video Metadata */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    {videoData.company_id && (
                      <div>Company: {videoData.company_id}</div>
                    )}
                    <div>Category: {getCategoryName()}</div>
                    {videoData.created_at && (
                      <div>Uploaded: {new Date(videoData.created_at).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>

                {/* Related Videos */}
                {relatedVideos.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {relatedVideos.map((relatedVideo) => {
                        const relatedYoutubeId = videoUtils.extractYouTubeId(relatedVideo.video_url);
                        const relatedThumbnail = relatedVideo.video_thumb || 
                          (relatedYoutubeId ? videoUtils.getYouTubeThumbnail(relatedYoutubeId, 'medium') : null);
                        
                        return (
                          <div
                            key={relatedVideo.id}
                            className="bg-card border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => navigate(`/video?video_id=${relatedVideo.id}`)}
                          >
                            {relatedThumbnail && (
                              <div className="aspect-video overflow-hidden">
                                <img
                                  src={relatedThumbnail}
                                  alt={videoUtils.getLocalizedName(relatedVideo, 
                                    currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
                                  )}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-3">
                              <h4 className="font-medium text-sm truncate">
                                {videoUtils.getLocalizedName(relatedVideo, 
                                  currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
                                )}
                              </h4>
                              {relatedVideo.video_title_en && (
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  {currentLanguage === 'kh' 
                                    ? relatedVideo.video_title_kh || relatedVideo.video_title_en
                                    : currentLanguage === 'ch'
                                    ? relatedVideo.video_title_ch || relatedVideo.video_title_en
                                    : relatedVideo.video_title_en}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          {allVideos.length > 0 && (
            <footer className="border-t px-4 py-4 sm:px-6 md:absolute fixed bottom-0 left-0 right-0 bg-[rgb(var(--card))]">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={navigateToPrevVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                  <span className="text-sm font-medium">Previous</span>
                </button>

                <div className="text-sm text-slate-600">
                  Video {currentVideoIndex + 1} of {videoUtils.flattenTree(videoUtils.buildTree(allVideos)).length}
                </div>

                <button
                  onClick={navigateToNextVideo}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="text-sm font-medium">Next</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            </footer>
          )}
        </>
      )}
    </section>
  );
}