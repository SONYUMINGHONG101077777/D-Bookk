// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { BOOKS } from "./mock/books";
import TOC from "./components/TOC";
import Reader from "./components/Reader";
import { useReaderStore } from "./store/readerStore";

const App = () => {
  const book = BOOKS[0]; // single book for now
  const currentBookId = useReaderStore((s) => s.currentBookId);
  const currentChapterId = useReaderStore((s) => s.currentChapterId);
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const continueBook = useReaderStore((s) => s.continueBook);
  const clearProgress = useReaderStore((s) => s.clearProgress);

  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    if (!currentBookId || !currentChapterId) {
      const first = book.chapters[0].id;
      const { chapterId } = continueBook(book.id, first);
      setCurrent(book.id, chapterId);
    }
  }, []);

  const shownChapterId = useMemo(
    () => currentChapterId ?? book.chapters[0].id,
    [book.chapters, currentChapterId]
  );

  const openChapter = (chapterId: string) => {
    setCurrent(book.id, chapterId);
    setTocOpen(false);
  };
  const onContinue = () => {
    const first = book.chapters[0].id;
    const { chapterId } = continueBook(book.id, first);
    setCurrent(book.id, chapterId);
    setTocOpen(false);
  };
  const onReset = () => {
    clearProgress(book.id);
    setCurrent(book.id, book.chapters[0].id);
    setTocOpen(false);
  };

  return (
    <div className="relative flex h-screen bg-white text-slate-900">
      <div className="hidden md:block">
        <TOC
          book={book}
          currentChapterId={shownChapterId}
          onOpenChapter={openChapter}
          onContinue={onContinue}
          onReset={onReset}
        />
      </div>

      <div
        className={[
          "fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-200 md:hidden",
          tocOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <TOC
          book={book}
          currentChapterId={shownChapterId}
          onOpenChapter={openChapter}
          onContinue={onContinue}
          onReset={onReset}
          onClose={() => setTocOpen(false)}
        />
      </div>
      {tocOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px] md:hidden"
          onClick={() => setTocOpen(false)}
          aria-label="បិទ​ម៉ឺនុយ"
        />
      )}

      {/* Reader */}
      <div className="flex-1 min-w-0">
        <Reader
          book={book}
          chapterId={shownChapterId}
          onOpenToc={() => setTocOpen(true)}
        />
      </div>
    </div>
  );
};
export default App;
