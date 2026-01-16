import { useSearchParams } from "react-router-dom";
import type { TBook, TTopics } from "../lib/api";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import FontSizeController from "./FontSizeController";
import ThemeSwitcher from "./ThemeSwitcher";
import { useReaderStore } from "../store/readerStore";
import { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, ChevronDown } from "lucide-react";

type Props = {
  book: TBook;
  currentChapterId: string | null;
  onOpenChapter: (chapterId: string) => void;
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
    location: "PALM Tech Help Center",
    searchDocument: "ស្វែងរកឯកសារ",
    closeMenu: "បិទម៉ឺនុយ",
    searchPlaceholder: "ស្វែងរក...",
    totalChapters: (count: number) =>
      `ទាំងអស់មាន ${toKhmerNumber(count)} ជំពូក`,
  },
  eng: {
    location: "PALM Tech Help Center",
    searchDocument: "Search Document",
    closeMenu: "Close menu",
    searchPlaceholder: "Search...",
    totalChapters: (count: number) => `Total ${count} chapters`,
  },
  ch: {
    location: "PALM Tech Help Center",
    searchDocument: "搜索文档",
    closeMenu: "关闭菜单",
    searchPlaceholder: "搜索...",
    totalChapters: (count: number) => `共有 ${count} 章`,
  },
};

// Helper to build topic hierarchy
const buildTopicTree = (topics: TTopics[]) => {
  console.log("Building topic tree from:", topics);
  
  if (!topics || topics.length === 0) {
    console.warn("No topics provided to buildTopicTree");
    return [];
  }

  const map = new Map<number, TTopics & { children: TTopics[] }>();
  const roots: (TTopics & { children: TTopics[] })[] = [];

  // Initialize all topics with children array
  topics.forEach((topic) => {
    map.set(topic.id, { 
      ...topic, 
      children: []
    });
  });

  // Build the tree based on parent_id relationships
  topics.forEach((topic) => {
    const node = map.get(topic.id);
    if (!node) {
      console.warn(`Topic ${topic.id} not found in map`);
      return;
    }
    
    if (topic.parent_id === null) {
      roots.push(node);
    } else {
      const parent = map.get(topic.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        console.warn(`Parent ${topic.parent_id} not found for topic ${topic.id}, treating as root`);
        roots.push(node);
      }
    }
  });

  console.log("Built topic tree roots:", roots);
  return roots;
};

export default function TOC({
  book,
  currentChapterId,
  onOpenChapter,
  onClose,
}: Props) {
  console.log("TOC Component - Book:", book);
  console.log("TOC Component - Current Chapter ID:", currentChapterId);
  
  const setParams = useSearchParams()[1];
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const language = useReaderStore((s) => s.language);

  const [query, setQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Use language from store instead of local state
  const currentLanguage: Language = (language as Language) || "eng";
  const t = translations[currentLanguage];

  // Initialize with expanded sections based on the screenshot structure
  useEffect(() => {
    console.log("Initializing expanded sections for book:", book);
    
    if (!book || !book.topics || book.topics.length === 0) {
      console.warn("No topics to initialize");
      return;
    }

    // Expand first root topic by default
    const tree = buildTopicTree(book.topics);
    const firstRoot = tree[0];
    
    if (firstRoot) {
      console.log("Expanding first root topic:", firstRoot.id);
      setExpandedSections(new Set([firstRoot.id]));
      
      // Also expand its first child if exists
      if (firstRoot.children && firstRoot.children.length > 0) {
        setExpandedSections(prev => {
          const newSet = new Set(prev);
          newSet.add(firstRoot.children[0].id);
          return newSet;
        });
      }
    }
  }, [book]);

  const onBackHome = () => {
    setParams(new URLSearchParams(), { replace: true });
    setCurrent(book?.id.toString(), "");
    window.location.reload();
  };

  // Filter topics based on search query
  const filteredTopics = useMemo(() => {
    console.log("Filtering topics with query:", query);
    console.log("Book topics:", book?.topics);
    
    if (!book?.topics || book.topics.length === 0) {
      console.warn("No topics to filter");
      return [];
    }

    if (!query.trim()) {
      const tree = buildTopicTree(book.topics);
      console.log("No query, returning full tree:", tree);
      return tree;
    }

    const searchLower = query.toLowerCase();
    console.log("Searching for:", searchLower);
    
    const filtered = book.topics.filter(
      (topic) =>
        (topic.title_en?.toLowerCase().includes(searchLower)) ||
        (topic.title_kh?.toLowerCase().includes(searchLower)) ||
        (topic.title_ch?.toLowerCase().includes(searchLower))
    );
    
    console.log("Filtered topics:", filtered);
    const tree = buildTopicTree(filtered);
    console.log("Built tree from filtered:", tree);
    return tree;
  }, [book, query]);

  const toggleSection = (topicId: number) => {
    console.log("Toggling section:", topicId);
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedSections(newExpanded);
  };

  // Recursive rendering of topic tree
  const renderTopicTree = (
    topics: (TTopics & { children: TTopics[] })[],
    level = 0
  ) => {
    console.log("Rendering topic tree level", level, "with topics:", topics);
    
    if (!topics || topics.length === 0) {
      console.warn("No topics to render at level", level);
      return null;
    }

    return topics.map((topic) => {
      const children = topic.children || [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedSections.has(topic.id);
      const isCurrent = String(topic.id) === currentChapterId;

      console.log(`Topic ${topic.id}:`, {
        title_en: topic.title_en,
        hasChildren,
        isExpanded,
        isCurrent
      });

      const getTitle = () => {
        switch (currentLanguage) {
          case "kh":
            return topic.title_kh || topic.title_en || `Topic ${topic.id}`;
          case "ch":
            return topic.title_ch || topic.title_en || `Topic ${topic.id}`;
          default:
            return topic.title_en || `Topic ${topic.id}`;
        }
      };

      return (
        <div key={topic.id} className="w-full">
          {/* Topic Item */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              isCurrent
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => {
              console.log(`Clicked topic ${topic.id}`, { hasChildren });
              if (hasChildren) {
                toggleSection(topic.id);
              } else {
                console.log(`Opening chapter ${topic.id}`);
                onOpenChapter(String(topic.id));
              }
            }}
          >
            {(hasChildren) && (
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={14} className="text-muted-foreground" />
                )}
              </span>
            )}
            {!hasChildren && <span className="w-4"></span>}

            <span className="flex-1 truncate text-sm font-medium">
              {getTitle()}
            </span>
          </div>

          {/* Render children if expanded */}
          {isExpanded && hasChildren && children.length > 0 && (
            <div className="ml-4">
              {renderTopicTree(children.map(child => ({
                ...child,
                children: child.children || []
              })), level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getBookTitle = () => {
    if (!book) {
      console.warn("No book data for title");
      return "Loading...";
    }
    
    console.log("Getting book title for language:", currentLanguage);
    let title = "";
    
    switch (currentLanguage) {
      case "kh":
        title = book.title_kh || book.title_en || `Book ${book.id}`;
        break;
      case "ch":
        title = book.title_ch || book.title_en || `Book ${book.id}`;
        break;
      default:
        title = book.title_en || `Book ${book.id}`;
    }
    
    console.log("Book title:", title);
    return title;
  };

  if (!book) {
    return (
      <aside className="w-full md:w-80 border-r bg-card p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-muted-foreground">Loading table of contents...</div>
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
            {getBookTitle()}
          </h2>
          {book?.company_id && (
            <p className="text-sm text-muted-foreground truncate">
              {book?.company_id}
            </p>
          )}
        </span>
        <button
          onClick={onClose}
          className="rounded-lg border px-2.5 py-1.5 text-sm hover:bg-accent text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Header matching the screenshot */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {t.location}
        </h1>
        <h2 className="text-lg font-semibold text-muted-foreground">
          {t.searchDocument}
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
                    onClick={() => {
                      console.log("Changing language to:", value);
                      // Update language in store
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

      {/* Total topics/chapters */}
      <h3 className="my-2 text-base font-semibold text-foreground truncate">
        {t.totalChapters(book?.topics?.length || 0)}
      </h3>

      {/* Topics Tree */}
      <div className="flex-1 overflow-y-auto mt-2">
        <div className="space-y-0.5">
          {filteredTopics.length > 0 ? (
            renderTopicTree(filteredTopics)
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {query.trim() ? "No topics found matching your search" : "No topics available"}
            </div>
          )}
        </div>
      </div>

      {/* Footer with controls */}
      <div className="flex flex-col gap-3 mt-6 pt-4 border-t">
        <ThemeSwitcher />
        <FontSizeController />
      </div>
    </aside>
  );
}