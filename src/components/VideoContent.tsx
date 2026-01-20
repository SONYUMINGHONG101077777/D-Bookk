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

type Props = {
  videoId: string;
  onOpenVideoToc?: () => void;
  refetch: () => void;
  isRefetching: boolean;
};

// Mock video data - same as in VideoTOC.tsx
type VideoTopic = {
  id: number;
  parent_id: number | null;
  name_en: string;
  name_kh: string;
  name_ch: string;
  video_url?: string;
  video_thumb?: string;
  video_title_en?: string;
  video_title_kh?: string;
  video_title_ch?: string;
  description_en?: string;
  description_kh?: string;
  description_ch?: string;
  created_at?: string;
  status?: number;
  company_id?: string;
  children?: VideoTopic[];
};

const mockVideos: VideoTopic[] = [
  {
    id: 1,
    parent_id: null,
    name_en: "Getting Started",
    name_kh: "ចាប់ផ្តើម",
    name_ch: "开始",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-01-01",
  },
  {
    id: 2,
    parent_id: 1,
    name_en: "Introduction to PALM Tech",
    name_kh: "សេចក្តីណែនាំអំពី PALM Tech",
    name_ch: "PALM Tech 介绍",
    video_url: "https://youtu.be/388BBynKooI?si=atvBmVSOIrHxYq4C",
    video_thumb: "https://img.youtube.com/vi/388BBynKooI/maxresdefault.jpg",
    video_title_en: "Introduction to PALM Tech Platform",
    video_title_kh: "សេចក្តីណែនាំអំពីវេទិកា PALM Tech",
    video_title_ch: "PALM Tech 平台介绍",
    description_en:
      "Learn the basics of PALM Tech platform and how to get started with our features.",
    description_kh:
      "ស្វែងយល់ពីគ្រឹះនៃវេទិកា PALM Tech និងរបៀបចាប់ផ្តើមជាមួយលក្ខណៈពិសេសរបស់យើង។",
    description_ch: "了解 PALM Tech 平台的基础知识以及如何开始使用我们的功能。",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-01-15",
  },
  {
    id: 3,
    parent_id: 1,
    name_en: "Basic Features",
    name_kh: "លក្ខណៈពិសេសមូលដ្ឋាន",
    name_ch: "基本功能",
    video_url: "https://youtu.be/388BBynKooI?si=atvBmVSOIrHxYq4C",
    video_thumb: "https://img.youtube.com/vi/388BBynKooI/maxresdefault.jpg",
    video_title_en: "Exploring Basic Features",
    video_title_kh: "ការស្វែងយល់ពីលក្ខណៈពិសេសមូលដ្ឋាន",
    video_title_ch: "探索基本功能",
    description_en:
      "Discover the basic features that make PALM Tech easy to use for beginners.",
    description_kh:
      "ស្វែងរកលក្ខណៈពិសេសមូលដ្ឋានដែលធ្វើឱ្យ PALM Tech ងាយស្រួលប្រើសម្រាប់អ្នកចាប់ផ្តើម។",
    description_ch: "发现让初学者轻松使用 PALM Tech 的基本功能。",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-01-20",
  },
  {
    id: 4,
    parent_id: null,
    name_en: "Advanced Tutorials",
    name_kh: "ការបង្រៀនកម្រិតខ្ពស់",
    name_ch: "高级教程",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-02-01",
  },
  {
    id: 5,
    parent_id: 4,
    name_en: "Advanced Settings",
    name_kh: "ការកំណត់កម្រិតខ្ពស់",
    name_ch: "高级设置",
    video_url: "https://youtu.be/388BBynKooI?si=atvBmVSOIrHxYq4C",
    video_thumb: "https://img.youtube.com/vi/388BBynKooI/maxresdefault.jpg",
    video_title_en: "Mastering Advanced Settings",
    video_title_kh: "ការបង្រៀនការកំណត់កម្រិតខ្ពស់",
    video_title_ch: "掌握高级设置",
    description_en:
      "Learn how to configure advanced settings for optimal performance.",
    description_kh:
      "ស្វែងយល់ពីរបៀបកំណត់រចនាសម្ព័ន្ធការកំណត់កម្រិតខ្ពស់សម្រាប់ប្រសិទ្ធភាពល្អបំផុត។",
    description_ch: "了解如何配置高级设置以获得最佳性能。",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-02-10",
  },
  {
    id: 6,
    parent_id: 4,
    name_en: "Troubleshooting",
    name_kh: "ការដោះស្រាយបញ្ហា",
    name_ch: "故障排除",
    video_url: "https://youtu.be/388BBynKooI?si=atvBmVSOIrHxYq4C",
    video_thumb: "https://img.youtube.com/vi/388BBynKooI/maxresdefault.jpg",
    video_title_en: "Common Issues and Solutions",
    video_title_kh: "បញ្ហាទូទៅនិងដំណោះស្រាយ",
    video_title_ch: "常见问题和解决方案",
    description_en:
      "Learn how to troubleshoot common issues and find quick solutions.",
    description_kh: "ស្វែងយល់ពីរបៀបដោះស្រាយបញ្ហាទូទៅ និងស្វែងរកដំណោះស្រាយរហ័ស។",
    description_ch: "了解如何排除常见问题并找到快速解决方案。",
    company_id: "PALM Tech",
    status: 1,
    created_at: "2024-02-15",
  },
];

// Helper to find video by ID
const findVideoById = (id: string): VideoTopic | undefined => {
  const numId = parseInt(id, 10);
  return mockVideos.find((video) => video.id === numId);
};

// Helper to get all videos that have video_url (actual videos)
const getVideoItems = (): VideoTopic[] => {
  return mockVideos.filter((video) => video.video_url);
};

// Helper to find video index
const findVideoIndex = (id: string): number => {
  const videoItems = getVideoItems();
  const numId = parseInt(id, 10);
  return videoItems.findIndex((video) => video.id === numId);
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

  const [videoData, setVideoData] = useState<VideoTopic | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use language from store
  const currentLanguage = language || "en";

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

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const video = findVideoById(videoId);
      if (video) {
        setVideoData(video);
        setCurrent("video", video.id.toString());
      } else {
        setError("Video not found");
        setVideoData(null);
      }
    } catch (err) {
      console.error("Error fetching video:", err);
      setError("Failed to load video. Please try again.");
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

  const navigateToNextVideo = useCallback(() => {
    if (!videoId) return;

    const videoItems = getVideoItems();
    const currentIndex = findVideoIndex(videoId);

    if (currentIndex !== -1 && currentIndex < videoItems.length - 1) {
      const nextVideo = videoItems[currentIndex + 1];
      navigate(`/video?video_id=${nextVideo.id}`);
    }
  }, [videoId, navigate]);

  const navigateToPrevVideo = useCallback(() => {
    if (!videoId) return;

    const videoItems = getVideoItems();
    const currentIndex = findVideoIndex(videoId);

    if (currentIndex > 0) {
      const prevVideo = videoItems[currentIndex - 1];
      navigate(`/video?video_id=${prevVideo.id}`);
    }
  }, [videoId, navigate]);

  const getVideoTitle = useCallback(() => {
    if (!videoData) {
      return "Loading Video...";
    }

    switch (currentLanguage) {
      case "kh":
        return (
          videoData.name_kh || videoData.name_en || `Video ${videoData.id}`
        );
      case "ch":
        return (
          videoData.name_ch || videoData.name_en || `Video ${videoData.id}`
        );
      default:
        return videoData.name_en || `Video ${videoData.id}`;
    }
  }, [videoData, currentLanguage]);

  const getCategoryName = useCallback(() => {
    if (!videoData) {
      return "Videos";
    }

    if (videoData.parent_id) {
      const parent = mockVideos.find((v) => v.id === videoData.parent_id);
      if (parent) {
        switch (currentLanguage) {
          case "kh":
            return parent.name_kh || parent.name_en || "Videos";
          case "ch":
            return parent.name_ch || parent.name_en || "Videos";
          default:
            return parent.name_en || "Videos";
        }
      }
    }

    return "Videos";
  }, [videoData, currentLanguage]);

  // Extract YouTube ID for embedding
  const youtubeId = useMemo(() => {
    if (!videoData?.video_url) return null;

    // Extract YouTube ID from URL
    const url = videoData.video_url;
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }, [videoData]);

  // Get thumbnail URL
  const thumbnailUrl = useMemo(() => {
    if (videoData?.video_thumb) {
      return videoData.video_thumb;
    }
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }
    return null;
  }, [videoData, youtubeId]);

  const videoItems = getVideoItems();
  const currentIndex = videoId ? findVideoIndex(videoId) : -1;
  const totalVideos = videoItems.length;

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

              {videoData &&
                (videoData.video_title_en ||
                  videoData.video_title_kh ||
                  videoData.video_title_ch) && (
                  <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                    {currentLanguage === "kh"
                      ? videoData.video_title_kh || videoData.video_title_en
                      : currentLanguage === "ch"
                        ? videoData.video_title_ch || videoData.video_title_en
                        : videoData.video_title_en}
                  </p>
                )}

              {videoData &&
                (videoData.description_en ||
                  videoData.description_kh ||
                  videoData.description_ch) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">
                      {currentLanguage === "kh"
                        ? videoData.description_kh || videoData.description_en
                        : currentLanguage === "ch"
                          ? videoData.description_ch || videoData.description_en
                          : videoData.description_en}
                    </p>
                  </div>
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
            {videoData && videoData.parent_id && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-6 pb-2 border-b">
                  Related Videos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {videoItems
                    .filter(
                      (video) =>
                        video.parent_id === videoData.parent_id &&
                        video.id !== videoData.id,
                    )
                    .slice(0, 3)
                    .map((relatedVideo) => {
                      const relatedYoutubeId = relatedVideo.video_url?.match(
                        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\\s]{11})/,
                      )?.[1];
                      const relatedThumbnail =
                        relatedVideo.video_thumb ||
                        (relatedYoutubeId
                          ? `https://img.youtube.com/vi/${relatedYoutubeId}/mqdefault.jpg`
                          : null);

                      const getRelatedName = () => {
                        switch (currentLanguage) {
                          case "kh":
                            return (
                              relatedVideo.name_kh ||
                              relatedVideo.name_en ||
                              `Video ${relatedVideo.id}`
                            );
                          case "ch":
                            return (
                              relatedVideo.name_ch ||
                              relatedVideo.name_en ||
                              `Video ${relatedVideo.id}`
                            );
                          default:
                            return (
                              relatedVideo.name_en || `Video ${relatedVideo.id}`
                            );
                        }
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
                            {relatedVideo.video_title_en && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {currentLanguage === "kh"
                                  ? relatedVideo.video_title_kh ||
                                    relatedVideo.video_title_en
                                  : currentLanguage === "ch"
                                    ? relatedVideo.video_title_ch ||
                                      relatedVideo.video_title_en
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
