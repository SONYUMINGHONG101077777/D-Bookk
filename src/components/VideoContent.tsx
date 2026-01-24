"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useReaderStore } from "../store/readerStore";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Home,
  Menu,
  Video as VideoIcon,
  AlertCircle,
} from "lucide-react";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import LoadingModal from "./shared/LoadingModal";
import { videoApi, type VideoItem } from "../lib/video_api";
import { videoUtils } from "../lib/video_queries";

type Props = {
  videoId: string;
  onOpenVideoToc?: () => void;
  refetch: () => void;
  isRefetching: boolean;
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

  const setCurrent = useReaderStore((s) => s.setCurrent);
  const language = useReaderStore((s) => s.language);

  const [videoData, setVideoData] = useState<VideoItem | null>(null);
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use language from store
  const currentLanguage = language || "en";

  // Fetch all videos on mount
  const fetchAllVideos = useCallback(async () => {
    console.log("Fetching all videos...");
    try {
      const response = await videoApi.getVideos({ status: 1 });
      if (response.success && response.data) {
        setAllVideos(response.data);
        console.log(`Loaded ${response.data.length} videos`);
      } else {
        console.error("Failed to load videos:", response.error);
      }
    } catch (err) {
      console.error("Error fetching all videos:", err);
    }
  }, []);

  useEffect(() => {
    fetchAllVideos();
  }, [fetchAllVideos]);

  // Fetch video data
  const fetchVideo = useCallback(async () => {
    if (!videoId) {
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
      if (response.success && response.data) {
        setVideoData(response.data);
        setCurrent("video", response.data.id.toString());
      } else {
        throw new Error(response.error || "Video not found");
      }
    } catch (err) {
      console.error("Error fetching video:", err);
      setError(err instanceof Error ? err.message : "Failed to load video. Please try again.");
      setVideoData(null);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, setCurrent]);

  useEffect(() => {
    fetchVideo();
  }, [fetchVideo]);

  const navigateToHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const getVideoItems = useCallback((): VideoItem[] => {
    // Filter videos that have a video_url
    return allVideos.filter((video) => video.video_url && video.video_url.trim() !== "");
  }, [allVideos]);

  const findVideoIndex = useCallback((id: string): number => {
    const videoItems = getVideoItems();
    const numId = parseInt(id, 10);
    return videoItems.findIndex((video) => video.id === numId);
  }, [getVideoItems]);

  const navigateToNextVideo = useCallback(() => {
    if (!videoId) return;

    const videoItems = getVideoItems();
    const currentIndex = findVideoIndex(videoId);

    if (currentIndex !== -1 && currentIndex < videoItems.length - 1) {
      const nextVideo = videoItems[currentIndex + 1];
      navigate(`/video?video_id=${nextVideo.id}`);
    }
  }, [videoId, navigate, getVideoItems, findVideoIndex]);

  const navigateToPrevVideo = useCallback(() => {
    if (!videoId) return;

    const videoItems = getVideoItems();
    const currentIndex = findVideoIndex(videoId);

    if (currentIndex > 0) {
      const prevVideo = videoItems[currentIndex - 1];
      navigate(`/video?video_id=${prevVideo.id}`);
    }
  }, [videoId, navigate, getVideoItems, findVideoIndex]);

  const getVideoTitle = useCallback(() => {
    if (!videoData) {
      return "Loading Video...";
    }

    return videoUtils.getLocalizedName(videoData, currentLanguage);
  }, [videoData, currentLanguage]);

  const getCategoryName = useCallback(() => {
    if (!videoData || !videoData.parent_id) {
      return "Videos";
    }

    const parent = allVideos.find((v) => v.id === videoData.parent_id);
    if (parent) {
      return videoUtils.getLocalizedName(parent, currentLanguage);
    }

    return "Videos";
  }, [videoData, allVideos, currentLanguage]);

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
      return videoUtils.getYouTubeThumbnail(youtubeId);
    }
    return null;
  }, [videoData, youtubeId]);

  const videoItems = getVideoItems();
  const currentIndex = videoId ? findVideoIndex(videoId) : -1;
  const totalVideos = videoItems.length;

  // Get related videos (same parent category)
  const relatedVideos = useMemo(() => {
    if (!videoData || !videoData.parent_id) return [];

    return videoItems.filter(
      (video) => video.parent_id === videoData.parent_id && video.id !== videoData.id
    ).slice(0, 3);
  }, [videoData, videoItems]);

  // Loading state
  if ((isLoading || isRefetching) && !videoData) {
    return (
      <section className="flex h-screen flex-col overflow-hidden bg-card">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVideoToc}
              className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              aria-label="menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                PALM Tech Video Center
              </div>
              <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate">
                Loading Video...
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <LoadingModal isLoading={true} />
        </div>
      </section>
    );
  }

  // Error state
  if (error && !isLoading && !isRefetching) {
    return (
      <section className="flex h-screen flex-col overflow-hidden bg-card">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVideoToc}
              className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              aria-label="menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                PALM Tech Video Center
              </div>
              <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate">
                Error Loading Video
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Video</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={fetchVideo}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={navigateToHome}
                className="px-4 py-2 border rounded-md hover:bg-accent"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // No video selected state
  if ((!videoData || !videoId) && !isLoading && !isRefetching) {
    return (
      <section className="flex h-screen flex-col overflow-hidden bg-card">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenVideoToc}
              className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
              aria-label="menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-sm text-muted-foreground truncate">
                PALM Tech Video Center
              </div>
              <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate">
                Video Center
              </h1>
            </div>
            <span className="flex gap-2">
              <button
                onClick={navigateToHome}
                className="p-2 hover:bg-accent rounded-md"
                title="Back to Home"
                aria-label="Back to Home"
              >
                <Home size={18} />
              </button>
            </span>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <VideoIcon className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Video Selected</h3>
            <p className="text-muted-foreground mb-4">
              Select a video from the video list to start watching
            </p>
            <button
              onClick={onOpenVideoToc}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Browse Videos
            </button>
          </div>
        </main>
      </section>
    );
  }

  // Main content when video is selected
  return (
    <section className="flex h-screen flex-col overflow-hidden bg-card">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenVideoToc}
            className="md:hidden inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-accent"
            aria-label="menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
              {getCategoryName()}
            </div>
            <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate">
              {getVideoTitle()}
            </h1>
          </div>
          <span className="flex gap-2">
            <button
              onClick={navigateToHome}
              className="p-2 hover:bg-accent rounded-md"
              title="Back to Home"
              aria-label="Back to Home"
            >
              <Home size={18} />
            </button>

            <button
              onClick={() => {
                console.log("Refreshing...");
                refetch();
              }}
              className="p-2 hover:bg-accent rounded-md"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>
          </span>
        </div>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 no-scrollbar"
      >
        {(isRefetching || isLoading) && (
          <LoadingModal isLoading={isRefetching || isLoading} />
        )}

        <div className="max-w-4xl mx-auto">
          {/* Video Player */}
          <div className="mb-8">
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-6 shadow-lg">
              {youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                  title={getVideoTitle()}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              ) : videoData && videoData.video_url ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <AlertCircle className="w-16 h-16 text-white/50 mb-4" />
                  <div className="text-white text-center">
                    <p className="text-lg mb-2">Video cannot be embedded</p>
                    <a
                      href={videoData.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <VideoIcon size={16} />
                      Watch on external site
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <div className="text-white text-center">
                    <AlertCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-lg">No video available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
              <h2 className="text-2xl font-bold mb-4">{getVideoTitle()}</h2>

              {videoData && (
                <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                  {videoUtils.getLocalizedVideoTitle(videoData, currentLanguage)}
                </p>
              )}

              {thumbnailUrl && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    Thumbnail:
                  </p>
                  <img
                    src={thumbnailUrl}
                    alt="Video thumbnail"
                    className="w-48 h-27 object-cover rounded-lg shadow"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Video Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {videoData && videoData.company_id && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Company:</span>
                    <span className="bg-accent px-2 py-1 rounded">
                      {videoData.company_id}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Category:</span>
                  <span>{getCategoryName()}</span>
                </div>
                {videoData && videoData.created_at && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Uploaded:</span>
                    <span>
                      {new Date(videoData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 py-1 rounded ${videoData?.status === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {videoData && videoData.status === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Videos - Show other videos in same category */}
            {relatedVideos.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-6 pb-2 border-b">
                  Related Videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedVideos.map((relatedVideo) => {
                    const relatedYoutubeId = videoUtils.extractYouTubeId(relatedVideo.video_url);
                    const relatedThumbnail = relatedVideo.video_thumb || 
                      (relatedYoutubeId ? videoUtils.getYouTubeThumbnail(relatedYoutubeId, 'medium') : null);

                    const getRelatedName = () => {
                      return videoUtils.getLocalizedName(relatedVideo, currentLanguage);
                    };

                    return (
                      <div
                        key={relatedVideo.id}
                        className="group bg-card border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        onClick={() =>
                          navigate(`/video?video_id=${relatedVideo.id}`)
                        }
                      >
                        {relatedThumbnail && (
                          <div className="aspect-video overflow-hidden bg-gray-100">
                            <img
                              src={relatedThumbnail}
                              alt={getRelatedName()}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-base truncate mb-2">
                            {getRelatedName()}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {videoUtils.getLocalizedVideoTitle(relatedVideo, currentLanguage)}
                          </p>
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
      {totalVideos > 1 && currentIndex !== -1 && (
        <footer className="border-t bg-background/95 backdrop-blur px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={navigateToPrevVideo}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={currentIndex <= 0}
              >
                <ChevronLeft size={18} />
                <span className="text-sm font-medium">Previous</span>
              </button>

              <div className="text-sm text-muted-foreground">
                Video {toKhmerNumber(currentIndex + 1)} of{" "}
                {toKhmerNumber(totalVideos)}
              </div>

              <button
                onClick={navigateToNextVideo}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={currentIndex >= totalVideos - 1}
              >
                <span className="text-sm font-medium">Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
}