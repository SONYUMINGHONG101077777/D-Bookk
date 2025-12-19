"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useReaderStore } from "../store/readerStore";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import type { TBook, TTopics, TContents } from "../lib/api";
import { fetchOneChapterById } from "../lib/api"; // Add this import
import cover from "/book-cover.jpg";
import LoadingModal from "./shared/LoadingModal";

type Props = {
  book: TBook;
  chapterId: string;
  onOpenToc?: () => void;
  refetch: () => void;
  isRefetching: boolean;
};

type Lang = "en" | "kh" | "ch";
const lang: Lang = 'en';

const CHARS_PER_PAGE = 3500;

function splitParagraphIntoChunks(para: string, budget: number): string[] {
  if (!para) return [""];

  // DON'T replace whitespace - preserve formatting
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
    // Skip only if completely empty, don't skip if it has spaces
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

  const queryPage = Number(params.get("page")) || 1;

  const [chapterContents, setChapterContents] = useState<TContents[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);

  const chapter: TTopics | undefined = useMemo(() => {
    // book may use a different key for the chapter list depending on API/version,
    // so try common keys and fall back to an empty array.
    type BookFlexible = TBook & { chapters?: TTopics[]; contents?: TTopics[] };
    const flexibleBook = book as BookFlexible;
    const list =
      flexibleBook.chapters ||
      flexibleBook.topics ||
      flexibleBook.contents ||
      [];
    return list.find((c: TTopics) => c?.id?.toString() === chapterId);
  }, [book, chapterId]);

  const initialSavedPage = useMemo(() => {
    if (!chapter) return 0;

    const saved = getLocation(book?.id?.toString(), chapter.id.toString());
    const fromQuery = queryPage > 0 ? queryPage - 1 : null;

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
      const params = new URLSearchParams(location.search);
      params.set("chapter_id", chapterId);
      params.set("page", String(page + 1));
      navigate({ search: params.toString() }, { replace: true });
    },
    [navigate, location.search, chapterId]
  );

  // Fetch contents when chapter changes
  useEffect(() => {
    const fetchContents = async () => {
      if (!chapterId) return;
      
      setIsLoadingContents(true);
      try {
        const response = await fetchOneChapterById(chapterId);
        setChapterContents(response.contents || []);
      } catch (error) {
        console.error("Error fetching chapter contents:", error);
        setChapterContents([]);
      } finally {
        setIsLoadingContents(false);
      }
    };

    fetchContents();
  }, [chapterId]);

  useEffect(() => {
    if (chapter) setCurrent(book?.id.toString(), chapter.id.toString());
  }, [book?.id, chapter, setCurrent]);

  const recomputePages = useCallback(() => {
    if (!chapter || chapterContents.length === 0) {
      setPages([]);
      return;
    }

    // Extract content based on language
    const normalized = chapterContents.flatMap((content: TContents) => {
      let contentText = "";
      
      switch (lang) {
        case 'kh':
          contentText = content.content_kh || "";
          break;
        case 'ch':
          contentText = content.content_ch || "";
          break;
        default:
          contentText = content.content_en || "";
      }

      // Normalize line endings
      const normalizedContent = contentText.replace(/\r\n/g, "\n");
      
      // Split on double newlines for paragraphs
      return normalizedContent.includes("\n\n")
        ? normalizedContent.split(/\n{2,}/).filter((s) => s.length > 0)
        : [normalizedContent];
    });

    const next = paginateByCharBudget(normalized, CHARS_PER_PAGE);
    setPages(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter, chapterContents, lang]);

  useEffect(() => {
    recomputePages();
  }, [recomputePages]);

  useEffect(() => {
    restoredOnce.current = false;
  }, [book?.id, chapterId]);

  useEffect(() => {
    if (!chapter || restoredOnce.current || pages.length === 0) return;
    const saved = getLocation(book?.id.toString(), chapter.id.toString());
    const safe = Math.max(
      0,
      Math.min(saved?.page ?? initialSavedPage, pages.length - 1)
    );
    setPageIdx(safe);
    setPageInput(String(safe + 1));
    restoredOnce.current = true;
    containerRef.current?.scrollTo({ top: 0 });
    updateUrl(safe);
  }, [
    book?.id,
    chapter,
    chapter?.id,
    pages.length,
    getLocation,
    initialSavedPage,
    updateUrl,
  ]);

  useEffect(() => {
    setPageInput(String(pageIdx + 1));
  }, [pageIdx]);

  useEffect(() => {
    if (!chapter) return;
    savePage(book?.id.toString(), chapter.id.toString(), pageIdx);
    updateUrl(pageIdx);
  }, [book?.id, chapter, chapter?.id, pageIdx, savePage, updateUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chapter || !restoredOnce.current) return;

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
    return () => el.removeEventListener("scroll", onScroll);
  }, [book?.id, chapter, saveLocation]);

  const totalPages = Math.max(1, pages.length);
  const pageSafe = Math.min(pageIdx, totalPages - 1);
  const currentPageContent = pages[pageSafe] || [];

  const clampPageNumber = useCallback(
    (n: number) => Math.min(Math.max(1, n || 1), totalPages),
    [totalPages]
  );

  const jumpToPage = (n: number) => {
    const clamped = clampPageNumber(n);
    const idx = clamped - 1;
    setPageIdx(idx);
    setPageInput(String(clamped));
    containerRef.current?.scrollTo({ top: 0 });
    setIsEditing(false);
    updateUrl(idx);
  };

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
                !chapter && "text-lg"
              }`}
            >
              {book
                ? lang === "en"
                  ? book.title_en
                  : lang === "kh"
                  ? book.title_kh
                  : book.title_ch
                : ""}
            </div>

            <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate text">
              {chapter
                ? lang === "en"
                  ? chapter.title_en
                  : lang === "kh"
                  ? chapter.title_kh
                  : chapter.title_ch
                : ""}
            </h1>
          </div>
          <span className="flex gap-2">
            <button onClick={() => refetch()}>
              <RefreshCcw size={17} className="text" />
            </button>
            {chapter && (
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text">
                <span onClick={() => setIsEditing((v) => !v)}>
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
                      className="w-16 rounded-md border border-slate-300  px-2 py-1 text-sm text-slate-900"
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
      {!chapter && (
        <main className="mx-auto no-scrollbar py-4 max-w-3xl overflow-y-auto">
          <img src={cover} />
        </main>
      )}
      {chapter && (
        <>
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-10 no-scrollbar"
          >
            {(isRefetching || isLoadingContents) && (
              <LoadingModal isLoading={isRefetching || isLoadingContents} />
            )}
            
            <article
              className="mx-auto max-w-3xl text-[1.05rem] sm:text-lg leading-relaxed whitespace-break-spaces"
            >
              {currentPageContent.map((segment, i) => (
                <p
                  key={i}
                  className={`mb-5 text-[rgb(var(--text))]`}
                  style={{
                    fontSize: `${fontSize}px`,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textIndent: "2em",
                  }}
                >
                  {segment}
                </p>
              ))}
              <div className="h-[70px]" />
            </article>
            {/* <ReaderContent content={currentPageContent} fontSize={fontSize} isRefetching={isRefetching}/> */}
          </div>
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
        </>
      )}
    </section>
  );
}