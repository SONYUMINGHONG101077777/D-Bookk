import { useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, type JSX } from "react";
import { Search, ChevronRight, ChevronDown, Home, Video as VideoIcon } from "lucide-react";
import { useReaderStore } from "../store/readerStore";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import LoadingModal from "./shared/LoadingModal";

type Props = {
  currentVideoId: string | null;
  onOpenVideo: (videoId: string) => void;
  onClose?: () => void;
};

type Language = "kh" | "eng" | "ch";

// Mock video data structure similar to TTopics
type VideoTopic = {
  id: number;
  parent_id: number | null;
  name_en: string;
  name_kh: string;
  name_ch: string;
  video_url?: string;
  video_thumb?: string;
  children?: VideoTopic[];
};

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

// Mock video data - replace with your actual API call
const mockVideos: VideoTopic[] = [
  {
    id: 1,
    parent_id: null,
    name_en: "Getting Started",
    name_kh: "ចាប់ផ្តើម",
    name_ch: "开始",
  },
  {
    id: 2,
    parent_id: 1,
    name_en: "Introduction to PALM Tech",
    name_kh: "សេចក្តីណែនាំអំពី PALM Tech",
    name_ch: "PALM Tech 介绍",
    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    video_thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
  },
  {
    id: 3,
    parent_id: 1,
    name_en: "Basic Features",
    name_kh: "លក្ខណៈពិសេសមូលដ្ឋាន",
    name_ch: "基本功能",
    video_url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    video_thumb: "https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg",
  },
  {
    id: 4,
    parent_id: null,
    name_en: "Advanced Tutorials",
    name_kh: "ការបង្រៀនកម្រិតខ្ពស់",
    name_ch: "高级教程",
  },
  {
    id: 5,
    parent_id: 4,
    name_en: "Advanced Settings",
    name_kh: "ការកំណត់កម្រិតខ្ពស់",
    name_ch: "高级设置",
    video_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    video_thumb: "https://img.youtube.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
  },
  {
    id: 6,
    parent_id: 4,
    name_en: "Troubleshooting",
    name_kh: "ការដោះស្រាយបញ្ហា",
    name_ch: "故障排除",
    video_url: "https://www.youtube.com/watch?v=2Vv-BfVoq4g",
    video_thumb: "https://img.youtube.com/vi/2Vv-BfVoq4g/maxresdefault.jpg",
  },
];

// Helper to build video hierarchy
const buildVideoTree = (videos: VideoTopic[]): VideoTopic[] => {
  if (!videos || videos.length === 0) return [];

  const map = new Map<number, VideoTopic>();
  const roots: VideoTopic[] = [];

  // Initialize all videos with children array
  videos.forEach((video) => {
    map.set(video.id, { ...video, children: [] });
  });

  // Build the tree based on parent_id relationships
  videos.forEach((video) => {
    const node = map.get(video.id);
    if (!node) return;

    if (video.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(video.parent_id);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
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
    new Set(),
  );
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  const currentLanguage: Language = (language as Language) || "eng";
  const t = translations[currentLanguage];

  // Initialize with expanded sections
  useEffect(() => {
    console.log("Initializing expanded sections for videos");
    
    if (mockVideos.length === 0) return;

    const tree = buildVideoTree(mockVideos);
    const firstRoot = tree[0];
    
    if (firstRoot) {
      console.log("Expanding first root video category:", firstRoot.id);
      setExpandedSections(new Set([firstRoot.id]));
    }
  }, []);

  const onBackHome = () => {
    setParams(new URLSearchParams(), { replace: true });
    setCurrent("", "");
    window.location.href = "/";
  };

  const videoTree = useMemo(() => {
    return buildVideoTree(mockVideos);
  }, []);

  const filteredTree = useMemo(() => {
    console.log("Filtering videos with query:", query);

    if (!query.trim()) {
      return videoTree;
    }

    const searchLower = query.toLowerCase();

    const filtered = mockVideos.filter((video) => {
      const name = getVideoName(video);
      return name.toLowerCase().includes(searchLower);
    });

    return buildVideoTree(filtered);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, videoTree]);

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

  const hasChildren = useCallback((video: VideoTopic): boolean => {
    return Array.isArray(video.children) && video.children.length > 0;
  }, []);

  const isVideoItem = useCallback((video: VideoTopic): boolean => {
    return !!video.video_url && video.video_url.trim() !== "";
  }, []);

  const getVideoName = useCallback((video: VideoTopic): string => {
    switch (currentLanguage) {
      case "kh":
        return video.name_kh || video.name_en || `Video ${video.id}`;
      case "ch":
        return video.name_ch || video.name_en || `Video ${video.id}`;
      default:
        return video.name_en || `Video ${video.id}`;
    }
  }, [currentLanguage]);

  const renderVideoTree = useCallback(
    (videos: VideoTopic[], level = 0): JSX.Element[] => {
      if (!videos || videos.length === 0) {
        return [];
      }

      return videos.map((video) => {
        const children = video.children || [];
        const itemHasChildren = hasChildren(video);
        const isExpanded = expandedSections.has(video.id);
        const isCurrent = String(video.id) === currentVideoId;
        const itemIsVideo = isVideoItem(video);

        const getName = () => {
          return getVideoName(video);
        };

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
                {getName()}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      expandedSections,
      currentVideoId,
      currentLanguage,
      hasChildren,
      isVideoItem,
      toggleSection,
      onOpenVideo,
      getVideoName,
    ],
  );

  const handleLanguageChange = (value: Language) => {
    console.log("Changing language to:", value);
    useReaderStore.getState().setLanguage(value);
    setIsLanguageDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center">
          <LoadingModal isLoading={isLoading} />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
      {/* Mobile header */}
      <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b">
        <div className="flex items-center gap-2">
          {/* <button
            onClick={onBackHome}
            className="p-2 hover:bg-accent rounded-md"
            title={t.backToHome}
          >
            <Home size={20} />
          </button> */}
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
          {/* <button
            onClick={onBackHome}
            className="p-2 hover:bg-accent rounded-md"
            title={t.backToHome}
          >
            <Home size={20} />
          </button> */}
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
              src={
                languageOptions.find((l) => l.value === currentLanguage)?.flag
              }
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
        {t.totalVideos(mockVideos.filter(v => v.video_url).length)}
      </h3>

      {/* Video Tree */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-0.5">
          {filteredTree.length > 0 ? (
            renderVideoTree(filteredTree)
          ) : (
            <div className="px-3 py-8 text-center text-muted-foreground">
              {query.trim() ? t.searchNoResults : t.noVideos}
            </div>
          )}
        </div>
      </div>

      {/* Back to home button */}
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