"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReaderStore } from "../store/readerStore";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  VideoIcon,
} from "lucide-react";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import type { TBook, TTopics, TContents } from "../lib/api";
import { getChapterContentsFromBook } from "../lib/api";
import cover from "/book-cover.jpg";
import LoadingModal from "./shared/LoadingModal";
import ReaderContent from "./ReaderContent";

type Props = {
  book: TBook;
  chapterId: string;
  onOpenToc?: () => void;
  refetch: () => void;
  isRefetching: boolean;
};

const findTopicInTree = (
  topics: TTopics[],
  topicId: string
): TTopics | undefined => {
  if (!topics || topics.length === 0) return undefined;

  for (const topic of topics) {
    if (topic.id.toString() === topicId) {
      return topic;
    }
    if (topic.children && topic.children.length > 0) {
      const found = findTopicInTree(topic.children, topicId);
      if (found) return found;
    }
  }
  return undefined;
};

const CHARS_PER_PAGE = 3500;

function splitParagraphIntoChunks(para: string, budget: number): string[] {
  if (!para) return [""];

  const text = para;

  if (text.length <= budget) return [text];

  const out: string[] = [];
  let i = 0;

  while (i < text.length) {
    const end = Math.min(i + budget, text.length);
    const windowStart = i + Math.max(20, Math.floor(budget * 0.5));
    const searchFrom = Math.min(end, text.length - 1);
    const cutZoneStart = Math.min(windowStart, searchFrom);
    let cut = -1;

    for (let j = searchFrom; j >= cutZoneStart; j--) {
      const ch = text[j];
      if (
        ch === "\n" ||
        ch === " " ||
        ch === "\t" ||
        /[.!?។៕,、，;:]/.test(ch)
      ) {
        cut = j + 1;
        break;
      }
    }

    if (cut === -1) cut = end;
    out.push(text.slice(i, cut));
    i = cut;
  }

  return out.length ? out : [text];
}

function paginateByCharBudget(
  paragraphs: string[],
  budget: number
): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let used = 0;

  for (const raw of paragraphs) {
    const para = raw ?? "";
    if (para.length === 0) continue;

    const chunks = splitParagraphIntoChunks(para, budget);

    for (const chunk of chunks) {
      if (used + chunk.length > budget && current.length) {
        pages.push(current);
        current = [];
        used = 0;
      }
      current.push(chunk);
      used += chunk.length;
    }
  }

  if (current.length) pages.push(current);
  return pages.length ? pages : [[]];
}

export default function Reader({
  book,
  chapterId,
  onOpenToc,
  refetch,
  isRefetching,
}: Props) {
  console.log("Reader Component - Book:", book);
  console.log("Reader Component - Chapter ID:", chapterId);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const savePage = useReaderStore((s) => s.savePage);
  const saveLocation = useReaderStore((s) => s.saveLocation);
  const getLocation = useReaderStore((s) => s.getLocation);
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const fontSize = useReaderStore((s) => s.fontSize);
  const language = useReaderStore((s) => s.language);

  const queryPage = Number(params.get("page")) || 1;

  const [chapterContents, setChapterContents] = useState<TContents[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [fetchedChapter, setFetchedChapter] = useState<TTopics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chapter: TTopics | undefined = useMemo(() => {
    console.log("Finding chapter in book topics:", book?.topics, chapterId);
    if (!book?.topics) {
      console.warn("No book topics available");
      return undefined;
    }

    const found = findTopicInTree(book.topics, chapterId);
    console.log("Found chapter:", found);
    return found;
  }, [book, chapterId]);

  const initialSavedPage = useMemo(() => {
    if (!chapter) {
      console.log("No chapter found, returning initial page 0");
      return 0;
    }

    const saved = getLocation(book?.id?.toString(), chapter.id.toString());
    const fromQuery = queryPage > 0 ? queryPage - 1 : null;

    console.log("Initial saved page calculation:", {
      saved,
      fromQuery,
      result: fromQuery ?? Math.max(0, saved?.page ?? 0),
    });

    return fromQuery ?? Math.max(0, saved?.page ?? 0);
  }, [book?.id, chapter, getLocation, queryPage]);

  const [isEditing, setIsEditing] = useState(false);
  const [pages, setPages] = useState<string[][]>([]);
  const [pageIdx, setPageIdx] = useState<number>(initialSavedPage);
  const [pageInput, setPageInput] = useState<string>(
    String(initialSavedPage + 1)
  );
  const restoredOnce = useRef(false);

  const updateUrl = useCallback(
  (page: number) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set("chapter_id", chapterId);
    newParams.set("page", String(page + 1));
    
    navigate({ search: newParams.toString() }, { replace: true });
  },
  [navigate, location.search, chapterId]
);

  const handleVideoClick = useCallback(() => {
    console.log("Navigating to video page");
    navigate("/video");
  }, [navigate]);

  useEffect(() => {
    const fetchContents = () => {
      if (!chapterId) {
        console.log("No chapter ID, clearing contents");
        setChapterContents([]);
        setFetchedChapter(null);
        setError(null);
        return;
      }

      console.log(`Getting contents for chapter ${chapterId}`);
      setIsLoadingContents(true);
      setError(null);

      try {
        if (book?.topics) {
          console.log("Getting contents from book data");

          const chapter = findTopicInTree(book.topics, chapterId);

          if (chapter) {
            setFetchedChapter(chapter);

            const contents = getChapterContentsFromBook(book, chapterId);
            console.log(`Found ${contents.length} contents`);

            setChapterContents(contents);
          } else {
            setError("Chapter not found");
            setChapterContents([]);
            setFetchedChapter(null);
          }
        } else {
          setError("Book data not available");
          setChapterContents([]);
          setFetchedChapter(null);
        }
      } catch (err) {
        console.error("Error getting chapter contents:", err);
        setError("Failed to load chapter content");
        setChapterContents([]);
        setFetchedChapter(null);
      } finally {
        setIsLoadingContents(false);
      }
    };

    fetchContents();
  }, [chapterId, book]);

  useEffect(() => {
    if (chapter) {
      console.log("Setting current chapter:", chapter.id);
      setCurrent(book?.id.toString(), chapter.id.toString());
    }
  }, [book?.id, chapter, setCurrent]);

  const recomputePages = useCallback(() => {
    console.log(
      "Recomputing pages with contents:",
      chapterContents.length,
      "language:",
      language
    );

    if (chapterContents.length === 0) {
      console.warn("No chapter contents to paginate");
      setPages([]);
      return;
    }

    const normalized = chapterContents.flatMap((content: TContents) => {
      let contentText = "";

      switch (language) {
        case "kh":
          contentText = content.content_kh || content.content_en || "";
          break;
        case "ch":
          contentText = content.content_ch || content.content_en || "";
          break;
        case "eng":
        default:
          contentText = content.content_en || "";
      }

      console.log(
        `Content ${content.id}: length=${
          contentText.length
        }, preview=${contentText.substring(0, 50)}...`
      );

      const normalizedContent = contentText.replace(/\r\n/g, "\n");

      return normalizedContent.includes("\n\n")
        ? normalizedContent.split(/\n{2,}/).filter((s) => s.length > 0)
        : [normalizedContent];
    });

    console.log("Normalized paragraphs:", normalized.length);

    const next = paginateByCharBudget(normalized, CHARS_PER_PAGE);
    console.log(`Created ${next.length} pages`);
    setPages(next);
  }, [chapterContents, language]);

  useEffect(() => {
    recomputePages();
  }, [recomputePages]);

  useEffect(() => {
    console.log("Resetting restored flag for book/chapter change");
    restoredOnce.current = false;
  }, [book?.id, chapterId]);

  useEffect(() => {
    if (!chapter || restoredOnce.current || pages.length === 0) {
      console.log("Skipping page restoration:", {
        hasChapter: !!chapter,
        restoredOnce: restoredOnce.current,
        pagesLength: pages.length,
      });
      return;
    }

    console.log("Restoring saved page position");
    const saved = getLocation(book?.id.toString(), chapter.id.toString());
    const safe = Math.max(
      0,
      Math.min(saved?.page ?? initialSavedPage, pages.length - 1)
    );

    console.log("Page restoration:", {
      saved,
      initialSavedPage,
      safe,
      totalPages: pages.length,
    });

    setPageIdx(safe);
    setPageInput(String(safe + 1));
    restoredOnce.current = true;
    containerRef.current?.scrollTo({ top: 0 });
    updateUrl(safe);
  }, [
    book?.id,
    chapter,
    pages.length,
    getLocation,
    initialSavedPage,
    updateUrl,
  ]);

  useEffect(() => {
    setPageInput(String(pageIdx + 1));
  }, [pageIdx]);

  useEffect(() => {
    if (!chapter) {
      console.log("No chapter to save page for");
      return;
    }
    console.log("Saving page:", pageIdx, "for chapter:", chapter.id);
    savePage(book?.id.toString(), chapter.id.toString(), pageIdx);
    updateUrl(pageIdx);
  }, [book?.id, chapter, pageIdx, savePage, updateUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chapter || !restoredOnce.current) {
      console.log("Skipping scroll listener setup:", {
        hasEl: !!el,
        hasChapter: !!chapter,
        restoredOnce: restoredOnce.current,
      });
      return;
    }

    console.log("Setting up scroll listener");
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveLocation(book?.id.toString(), chapter.id.toString(), el.scrollTop);
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      console.log("Removing scroll listener");
      el.removeEventListener("scroll", onScroll);
    };
  }, [book?.id, chapter, saveLocation]);

  const totalPages = Math.max(1, pages.length);
  const pageSafe = Math.min(pageIdx, totalPages - 1);
  const currentPageContent = pages[pageSafe] || [];

  const displayChapter = fetchedChapter || chapter;

  console.log("Reader state:", {
    totalPages,
    pageSafe,
    currentPageContentLength: currentPageContent.length,
    hasContents: chapterContents.length > 0,
    chapterContents: chapterContents.length,
    displayChapter: !!displayChapter,
  });

  const clampPageNumber = useCallback(
    (n: number) => Math.min(Math.max(1, n || 1), totalPages),
    [totalPages]
  );

  const jumpToPage = (n: number) => {
    const clamped = clampPageNumber(n);
    const idx = clamped - 1;
    console.log("Jumping to page:", n, "->", clamped, "index:", idx);
    setPageIdx(idx);
    setPageInput(String(clamped));
    containerRef.current?.scrollTo({ top: 0 });
    setIsEditing(false);
    updateUrl(idx);
  };

  const getBookTitle = () => {
    if (!book) {
      console.warn("No book data for title");
      return "Loading Book...";
    }

    let title = "";
    switch (language) {
      case "kh":
        title = book.title_kh || book.title_en || `Book ${book.id}`;
        break;
      case "ch":
        title = book.title_ch || book.title_en || `Book ${book.id}`;
        break;
      case "eng":
      default:
        title = book.title_en || `Book ${book.id}`;
    }

    console.log("Book title for language", language, ":", title);
    return title;
  };

  const getChapterTitle = () => {
    if (!displayChapter) {
      console.warn("No chapter data for title");
      return "Select a Chapter";
    }

    let title = "";
    switch (language) {
      case "kh":
        title =
          displayChapter.title_kh ||
          displayChapter.title_en ||
          `Chapter ${displayChapter.id}`;
        break;
      case "ch":
        title =
          displayChapter.title_ch ||
          displayChapter.title_en ||
          `Chapter ${displayChapter.id}`;
        break;
      case "eng":
      default:
        title = displayChapter.title_en || `Chapter ${displayChapter.id}`;
    }

    console.log("Chapter title for language", language, ":", title);
    return title;
  };

  if (error && !isLoadingContents && !isRefetching) {
    return (
      <section className="flex h-screen flex-col overflow-hidden bg-[rgb(var(--card))] relative">
        <header className="sticky top-0 z-20 backdrop-blur border-b border-slate-200 px-3 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenToc}
              className="md:hidden text inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              aria-label="menu"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1">
              <div
                className={`text-xs sm:text-sm text-gray-400 truncate ${
                  !displayChapter && "text-lg"
                }`}
              >
                {getBookTitle()}
              </div>
              <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate text">
                Error Loading Chapter
              </h1>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <div className="text-red-500 mb-4">
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Content
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
            onClick={onOpenToc}
            className="md:hidden text inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            aria-label="menu"
          >
            ☰
          </button>
          <div className="min-w-0 flex-1">
            <div
              className={`text-xs sm:text-sm text-gray-400 truncate ${
                !displayChapter && "text-lg"
              }`}
            >
              {getBookTitle()}
            </div>

            <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate text">
              {getChapterTitle()}
            </h1>
          </div>
          <span className="flex gap-2">
            {/* Video Button */}
            <button
              onClick={handleVideoClick}
              className="p-1 hover:bg-accent rounded"
              title="Watch Video"
              aria-label="Go to Video page"
            >
              <VideoIcon size={17} className="text" />
            </button>
            
            <button
              onClick={() => {
                console.log("Refreshing...");
                refetch();
              }}
              className="p-1 hover:bg-accent rounded"
            >
              <RefreshCcw size={17} className="text" />
            </button>
            {displayChapter && totalPages > 0 && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text">
                <span
                  onClick={() => setIsEditing((v) => !v)}
                  className="cursor-pointer hover:text-primary"
                >
                  ទំព័រ {toKhmerNumber(pageSafe + 1)}/
                  {toKhmerNumber(totalPages)}
                </span>
                {isEditing && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const n = parseInt(pageInput || "1", 10);
                      jumpToPage(isNaN(n) ? 1 : n);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => {
                        const v = (e.target.value ?? "").replace(/[^\d]/g, "");
                        setPageInput(v);
                      }}
                      onBlur={(e) => {
                        const n = parseInt(e.currentTarget.value || "1", 10);
                        const clamped = clampPageNumber(isNaN(n) ? 1 : n);
                        setPageInput(String(clamped));
                      }}
                      onFocus={(e) => e.currentTarget.select()}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-900"
                      aria-label="Go to page"
                      title={`Enter a page number (1–${totalPages})`}
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-slate-300 bg-slate-100 px-3 py-1.5 text-sm hover:bg-slate-200"
                    >
                      ទៅ
                    </button>
                  </form>
                )}
              </div>
            )}
          </span>
        </div>
      </header>
      {!displayChapter && !chapterId && (
        <main className="mx-auto no-scrollbar py-4 max-w-3xl overflow-y-auto">
          <img
            src={cover}
            alt="Book Cover"
            className="w-full h-auto rounded-lg"
          />
          <div className="text-center mt-4 text-muted-foreground">
            Select a chapter from the table of contents to begin reading
          </div>
        </main>
      )}
      {displayChapter && (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-10 no-scrollbar"
          >
            {(isRefetching || isLoadingContents) && (
              <LoadingModal isLoading={isRefetching || isLoadingContents} />
            )}

            {chapterContents.length === 0 &&
            !isLoadingContents &&
            !isRefetching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p>No content available for this chapter.</p>
                  <p className="text-sm mt-2">Please select another chapter.</p>
                </div>
              </div>
            ) : (
              <ReaderContent
                content={currentPageContent}
                fontSize={fontSize}
                isRefetching={isRefetching || isLoadingContents}
              />
            )}
          </div>
          {totalPages > 0 && (
            <footer className="border-t px-4 py-4 sm:px-6 md:absolute fixed bottom-0 left-0 right-0 bg-[rgb(var(--card))]">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => {
                    setPageIdx((p) => {
                      const next = Math.max(0, p - 1);
                      updateUrl(next);
                      return next;
                    });
                    containerRef.current?.scrollTo({ top: 0 });
                    setIsEditing(false);
                  }}
                  disabled={pageSafe === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={18} />
                  <span className="text-sm font-medium">ថយ</span>
                </button>

                <div className="text-sm text-slate-600">
                  {toKhmerNumber(pageSafe + 1)} / {toKhmerNumber(totalPages)}
                </div>

                <button
                  onClick={() => {
                    setPageIdx((p) => {
                      const next = Math.min(totalPages - 1, p + 1);
                      updateUrl(next);
                      return next;
                    });
                    containerRef.current?.scrollTo({ top: 0 });
                    setIsEditing(false);
                  }}
                  disabled={pageSafe >= totalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span className="text-sm font-medium">បន្ទាប់</span>
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