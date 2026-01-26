import { useSearchParams } from "react-router-dom";
import { useState, useMemo, useCallback, type JSX } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronRight, ChevronDown, Home, Video as VideoIcon } from "lucide-react";
import { useReaderStore } from "../store/readerStore";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import LoadingModal from "./shared/LoadingModal";
import { videoUtils, type VideoTreeItem, videoQueries } from "../lib/video_queries";

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
    searchNoResults: "រកមិនឃើញវីដេអូ",
    backToHome: "ត្រឡប់ទៅទំព័រដើម",
  },
  eng: {
    location: "PALM Tech Video Center",
    searchVideo: "Search Videos",
    closeMenu: "Close menu",
    searchPlaceholder: "Search videos...",
    totalVideos: (count: number) => `Total ${count} videos`,
    noVideos: "No videos available",
    loadingVideos: "Loading videos...",
    searchNoResults: "No videos found matching your search",
    backToHome: "Back to Home",
  },
  ch: {
    location: "PALM Tech Video Center",
    searchVideo: "搜索视频",
    closeMenu: "关闭菜单",
    searchPlaceholder: "搜索视频...",
    totalVideos: (count: number) => `共有 ${count} 个视频`,
    noVideos: "没有视频",
    loadingVideos: "正在加载视频...",
    searchNoResults: "未找到匹配的视频",
    backToHome: "返回首页",
  },
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
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const currentLanguage: Language = (language as Language) || "eng";
  const t = translations[currentLanguage];

  const { 
    data: videosResponse, 
    isLoading,
    error 
  } = useQuery(videoQueries.getVideos({ status: 1 }));

  const videos = useMemo(() => {
    if (videosResponse?.success) {
      return videosResponse.data || [];
    }
    return [];
  }, [videosResponse]);

  const videoTree = useMemo(() => {
    console.log("Building tree from videos:", videos.length);
    return videoUtils.buildTree(videos);
  }, [videos]);

  const onBackHome = () => {
    setParams(new URLSearchParams(), { replace: true });
    setCurrent("", "");
    window.location.href = "/";
  };

  const filteredTree = useMemo(() => {
    console.log("Filtering videos with query:", query);

    if (!query.trim()) {
      return videoTree;
    }

    const searchLower = query.toLowerCase();
    
    const filteredVideos = videos.filter((video) => {
      const nameEn = video.name_en?.toLowerCase() || '';
      const nameKh = video.name_kh?.toLowerCase() || '';
      const nameCh = video.name_ch?.toLowerCase() || '';
      const titleEn = video.video_title_en?.toLowerCase() || '';
      const titleKh = video.video_title_kh?.toLowerCase() || '';
      const titleCh = video.video_title_ch?.toLowerCase() || '';
      
      return nameEn.includes(searchLower) || 
             nameKh.includes(searchLower) || 
             nameCh.includes(searchLower) ||
             titleEn.includes(searchLower) ||
             titleKh.includes(searchLower) ||
             titleCh.includes(searchLower);
    });

    return videoUtils.buildTree(filteredVideos);
  }, [query, videoTree, videos]);

  const toggleSection = useCallback((videoId: number) => {
    setExpandedSections((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(videoId)) {
        newExpanded.delete(videoId);
      } else {
        newExpanded.add(videoId);
      }
      return newExpanded;
    });
  }, []);

  const hasChildren = useCallback((video: VideoTreeItem): boolean => {
    return Array.isArray(video.children) && video.children.length > 0;
  }, []);

  const isVideoItem = useCallback((video: VideoTreeItem): boolean => {
    return !!video.video_url && video.video_url.trim() !== "";
  }, []);

  const getVideoName = useCallback((video: VideoTreeItem): string => {
    const lang = currentLanguage === 'eng' ? 'en' : currentLanguage;
    return videoUtils.getLocalizedName(video, lang);
  }, [currentLanguage]);

  const renderVideoTree = useCallback(
    (treeItems: VideoTreeItem[], level = 0): JSX.Element[] => {
      if (!treeItems || treeItems.length === 0) {
        return [];
      }

      return treeItems.map((video) => {
        const children = video.children || [];
        const itemHasChildren = hasChildren(video);
        const isExpanded = expandedSections.has(video.id);
        const isCurrent = String(video.id) === currentVideoId;
        const itemIsVideo = isVideoItem(video);

        const handleClick = () => {
          if (itemHasChildren) {
            toggleSection(video.id);
          } else if (itemIsVideo) {
            console.log(`Opening video ${video.id}`);
            onOpenVideo(String(video.id));
          }
        };

        return (
          <div key={video.id} className="w-full">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                isCurrent
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "hover:bg-accent text-foreground"
              }`}
              style={{ paddingLeft: `${level * 20 + 12}px` }}
              onClick={handleClick}
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
                {getVideoName(video)}
                {itemIsVideo && (
                  <span className="ml-2">
                    <VideoIcon size={12} className="text-muted-foreground" />
                  </span>
                )}
              </span>
            </div>

            {isExpanded && itemHasChildren && children.length > 0 && (
              <div className="ml-4">{renderVideoTree(children, level + 1)}</div>
            )}
          </div>
        );
      });
    },
    [expandedSections, currentVideoId, hasChildren, isVideoItem, toggleSection, onOpenVideo, getVideoName]
  );

  const handleLanguageChange = (value: Language) => {
    console.log("Changing language to:", value);
    useReaderStore.getState().setLanguage(value);
    setIsLanguageDropdownOpen(false);
  };

  const videoCount = useMemo(() => {
    return videos.filter(v => v.video_url && v.video_url.trim() !== "").length;
  }, [videos]);

  if (isLoading) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center">
          <LoadingModal isLoading={isLoading} />
          <p className="mt-4 text-sm text-muted-foreground">{t.loadingVideos}</p>
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="text-red-500 mb-4">⚠️</div>
          <h3 className="font-semibold mb-2">Error Loading Videos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load videos"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b">
        <div className="flex items-center gap-2">
          <span className="flex flex-col">
            <h2 className="text-xl font-bold truncate text-foreground">
              {t.location}
            </h2>
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border px-2.5 py-1.5 text-sm hover:bg-accent text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.location}</h1>
            <h2 className="text-lg font-semibold text-muted-foreground">
              {t.searchVideo}
            </h2>
          </div>
        </div>
      </div>

      {/* Search and Language */}
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
            aria-label="Change language"
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
                    onClick={() => handleLanguageChange(value)}
                    className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-accent overflow-hidden transition-colors ${
                      value === currentLanguage ? "bg-accent" : ""
                    }`}
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
        {t.totalVideos(videoCount)}
      </h3>

      {/* Video Tree */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-0.5">
          {filteredTree.length > 0 ? (
            renderVideoTree(filteredTree)
          ) : videos.length === 0 ? (
            <div className="px-3 py-8 text-center text-muted-foreground">
              {t.noVideos}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">
              {t.searchNoResults}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t text-center">
        <button
          onClick={onBackHome}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 w-full flex items-center justify-center gap-2"
        >
          <Home size={16} />
          {t.backToHome}
        </button>
      </div>
    </aside>
  );
}