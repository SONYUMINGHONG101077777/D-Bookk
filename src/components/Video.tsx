import { useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, ChevronDown } from "lucide-react";
import { useReaderStore } from "../store/readerStore";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import { videoApi, type VideoItem, type VideoTreeItem } from "../lib/video_api";
import { videoUtils } from "../lib/video_queries";

type Props = {
  currentVideoId: string | null;
  onOpenVideo: (videoId: string) => void;
  onClose?: () => void;
};

type Language = "kh" | "eng" | "ch";

const languageOptions: { value: Language; label: string; flag: string }[] = [
  { value: "kh", label: "ខ្មែរ", flag: "/flags/kh.png" },
  { value: "eng", label: "English", flag: "/flags/gb.png" },
  { value: "ch", label: "中文", flag: "/flags/cn.png" },
];

const translations = {
  kh: {
    location: "PALM Tech Video Center",
    searchVideo: "ស្វែងរកវីដេអូ",
    closeMenu: "បិទម៉ឺនុយ",
    searchPlaceholder: "ស្វែងរកវីដេអូ...",
    totalVideos: (count: number) => `ទាំងអស់មាន ${toKhmerNumber(count)} វីដេអូ`,
    noVideos: "មិនមានវីដេអូ",
    loadingVideos: "កំពុងផ្ទុកវីដេអូ...",
  },
  eng: {
    location: "PALM Tech Video Center",
    searchVideo: "Search Videos",
    closeMenu: "Close menu",
    searchPlaceholder: "Search videos...",
    totalVideos: (count: number) => `Total ${count} videos`,
    noVideos: "No videos available",
    loadingVideos: "Loading videos...",
  },
  ch: {
    location: "PALM Tech Video Center",
    searchVideo: "搜索视频",
    closeMenu: "关闭菜单",
    searchPlaceholder: "搜索视频...",
    totalVideos: (count: number) => `共有 ${count} 个视频`,
    noVideos: "没有视频",
    loadingVideos: "正在加载视频...",
  },
};

// Helper to build video category hierarchy
const buildVideoTree = (videos: VideoItem[]): VideoTreeItem[] => {
  console.log("Building video tree from:", videos);
  
  if (!videos || videos.length === 0) {
    console.warn("No videos provided to buildVideoTree");
    return [];
  }

  return videoUtils.buildTree(videos);
};

export default function VideoTOC({
  currentVideoId,
  onOpenVideo,
  onClose,
}: Props) {
  console.log("VideoTOC Component - Current Video ID:", currentVideoId);
  
  const setParams = useSearchParams()[1];
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const language = useReaderStore((s) => s.language);

  const [query, setQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use language from store instead of local state
  const currentLanguage: Language = (language as Language) || "eng";
  const t = translations[currentLanguage];

  // Fetch videos on component mount
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching videos from API");
        const response = await videoApi.getVideos({
          language: currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en',
          status: 1 // Only active videos
        });
        
        console.log("Video API response:", response);
        
        if (response.success && response.data) {
          const videoData = Array.isArray(response.data) ? response.data : [response.data];
          console.log(`Loaded ${videoData.length} videos`);
          setVideos(videoData);
          
          // Expand first root category by default
          const tree = buildVideoTree(videoData);
          const firstRoot = tree[0];
          
          if (firstRoot) {
            console.log("Expanding first root category:", firstRoot.id);
            setExpandedSections(new Set([firstRoot.id]));
          }
        } else {
          setError(response.error || "Failed to load videos");
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, [currentLanguage]);

  const onBackHome = () => {
    setParams(new URLSearchParams(), { replace: true });
    setCurrent("", "");
    window.location.reload();
  };

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    console.log("Filtering videos with query:", query);
    console.log("Total videos:", videos?.length);
    
    if (!videos || videos.length === 0) {
      console.warn("No videos to filter");
      return [];
    }

    if (!query.trim()) {
      const tree = buildVideoTree(videos);
      console.log("No query, returning full tree:", tree.length);
      return tree;
    }

    const searchLower = query.toLowerCase();
    console.log("Searching for:", searchLower);
    
    // Filter videos by name in current language
    const filtered = videos.filter((video) => {
      const name = videoUtils.getLocalizedName(video, 
        currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
      );
      return name.toLowerCase().includes(searchLower);
    });
    
    console.log("Filtered videos:", filtered.length);
    const tree = buildVideoTree(filtered);
    console.log("Built tree from filtered:", tree.length);
    return tree;
  }, [videos, query, currentLanguage]);

  const toggleSection = (videoId: number) => {
    console.log("Toggling section:", videoId);
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(videoId)) {
      newExpanded.delete(videoId);
    } else {
      newExpanded.add(videoId);
    }
    setExpandedSections(newExpanded);
  };

  // Check if item has children
  const hasChildren = (video: VideoTreeItem) => {
    return video.children && video.children.length > 0;
  };

  // Check if item is a video (has video_url) or just a category
  const isVideoItem = (video: VideoTreeItem) => {
    return !!video.video_url;
  };

  // Recursive rendering of video tree
  const renderVideoTree = (
    videos: VideoTreeItem[],
    level = 0
  ) => {
    console.log("Rendering video tree level", level, "with items:", videos.length);
    
    if (!videos || videos.length === 0) {
      console.warn("No videos to render at level", level);
      return null;
    }

    return videos.map((video) => {
      const children = video.children || [];
      const itemHasChildren = hasChildren(video);
      const isExpanded = expandedSections.has(video.id);
      const isCurrent = String(video.id) === currentVideoId;
      const itemIsVideo = isVideoItem(video);

      console.log(`Video ${video.id}:`, {
        name: videoUtils.getLocalizedName(video, 
          currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
        ),
        hasChildren: itemHasChildren,
        isVideo: itemIsVideo,
        isExpanded,
        isCurrent
      });

      const getName = () => {
        return videoUtils.getLocalizedName(video, 
          currentLanguage === 'kh' ? 'kh' : currentLanguage === 'ch' ? 'ch' : 'en'
        );
      };

      return (
        <div key={video.id} className="w-full">
          {/* Video Item */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              isCurrent
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => {
              console.log(`Clicked video ${video.id}`, { 
                itemHasChildren, 
                itemIsVideo 
              });
              if (itemHasChildren) {
                toggleSection(video.id);
              } else if (itemIsVideo) {
                console.log(`Opening video ${video.id}`);
                onOpenVideo(String(video.id));
              }
            }}
          >
            {itemHasChildren && (
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={14} className="text-muted-foreground" />
                )}
              </span>
            )}
            {!itemHasChildren && <span className="w-4"></span>}

            <span className="flex-1 truncate text-sm font-medium">
              {getName()}
              {itemIsVideo && (
                <span className="ml-2 text-xs text-muted-foreground">▶️</span>
              )}
            </span>
          </div>

          {/* Render children if expanded */}
          {isExpanded && itemHasChildren && children.length > 0 && (
            <div className="ml-4">
              {renderVideoTree(children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground">{t.loadingVideos}</div>
          </div>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b">
        <span
          className="flex flex-col hover:bg-accent px-2 py-2 rounded-md cursor-pointer overflow-hidden"
          onClick={onBackHome}
        >
          <h2 className="text-2xl font-bold truncate text-foreground">
            {t.location}
          </h2>
        </span>
        <button
          onClick={onClose}
          className="rounded-lg border px-2.5 py-1.5 text-sm hover:bg-accent text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {t.location}
        </h1>
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t.searchVideo}
        </h2>
      </div>

      {/* Search + Language */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent truncate"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
        </div>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center justify-center w-12 h-10 rounded-lg border bg-background hover:bg-accent gap-1 px-1 transition-colors"
          >
            <img
              src={languageOptions.find((l) => l.value === currentLanguage)?.flag}
              alt={currentLanguage}
              className="w-5 h-4 object-contain"
            />
          </button>

          {isLanguageDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsLanguageDropdownOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 bg-card border rounded-lg shadow-lg z-30 min-w-[120px]">
                {languageOptions.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    onClick={() => {
                      console.log("Changing language to:", value);
                      useReaderStore.getState().setLanguage(value);
                      setIsLanguageDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent overflow-hidden transition-colors text-foreground"
                  >
                    <img
                      src={flag}
                      alt={value}
                      className="w-5 h-4 flex-shrink-0"
                    />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Total videos */}
      <h3 className="my-2 text-base font-semibold text-foreground truncate">
        {t.totalVideos(videos?.length || 0)}
      </h3>

      {/* Videos Tree */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-0.5">
          {filteredVideos.length > 0 ? (
            renderVideoTree(filteredVideos)
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {query.trim() ? "No videos found matching your search" : t.noVideos}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t text-center">
        <button
          onClick={onBackHome}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full"
        >
          Back to Home
        </button>
      </div>
    </aside>
  );
}