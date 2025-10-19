// src/components/Reader.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Book, Chapter } from "../mock/books";
import { useReaderStore } from "../store/readerStore";

type Props = {
  book: Book;
  chapterId: string;
  onOpenToc?: () => void; // mobile: open drawer
};

export default function Reader({ book, chapterId, onOpenToc }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const saveLocation = useReaderStore((s) => s.saveLocation);
  const getLocation = useReaderStore((s) => s.getLocation);

  const chapter: Chapter | undefined = useMemo(
    () => book.chapters.find((c) => c.id === chapterId),
    [book.chapters, chapterId]
  );

  const [restored, setRestored] = useState(false);

  // restore saved scrollTop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const saved = getLocation(book.id, chapterId);
    requestAnimationFrame(() => {
      el.scrollTop = saved?.scrollTop ?? 0;
      setRestored(true);
    });
  }, [book.id, chapterId, getLocation]);

  // persist scrollTop while reading
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        saveLocation(book.id, chapterId, el.scrollTop);
        ticking = false;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [book.id, chapterId, saveLocation]);

  if (!chapter) {
    return <div className="p-6">Chapter not found.</div>;
  }

  return (
    <section className="flex h-screen flex-col overflow-hidden">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-3 py-3 sm:px-6 space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenToc}
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            aria-label="បើក​ម៉ឺនុយ​ជំពូក"
          >
            ☰
          </button>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm text-slate-500 truncate">
              {book.title}
            </div>
            <h1 className="mt-0.5 text-base font-semibold sm:text-xl truncate">
              {chapter.title}
            </h1>
          </div>
        </div>
        <ProgressBar containerRef={containerRef} restored={restored} />
      </header>

    <div  
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 md:px-10"
      >

        <article className="mx-auto max-w-3xl text-[1.05rem] sm:text-lg leading-relaxed">
          {chapter.content.map((p, i) => (
            <p key={i} className="mb-5 text-slate-900">
              {p}
            </p>
          ))}
          <div className="h-56 sm:h-72 md:h-96" />
        </article>
      </div>
    </section>
  );
}

function ProgressBar({
  containerRef,
  restored,
}: {
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  restored: boolean;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? (el.scrollTop / max) * 100 : 0;
      setPct(Math.max(0, Math.min(100, p)));
    };
    calc();
    el.addEventListener("scroll", calc, { passive: true });
    window.addEventListener("resize", calc);
    return () => {
      el.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, [containerRef, restored]);

  return (
    <div className="sticky top-0 z-10 bg-transparent">
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <div
          style={{ width: `${pct}%` }}
          className="h-full rounded-full bg-gray-500 transition-[width] duration-150"
          aria-label="Reading progress"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
