// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import TOC from "./components/TOC";
import { useReaderStore } from "./store/readerStore";
import Reader from "./components/Reader";
import { useBook } from "./lib/queries";
import type { TBook } from "./lib/api";
import LoadingModal from "./components/shared/LoadingModal";

const App = () => {
  const currentBookId = useReaderStore((s) => s.currentBookId);
  const currentChapterId = useReaderStore((s) => s.currentChapterId);
  const setCurrent = useReaderStore((s) => s.setCurrent);
  const continueBook = useReaderStore((s) => s.continueBook);

  const [tocOpen, setTocOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useBook()
  const book = data?.data[0]
  console.table(book?.chapters)
  useEffect(() => {
    if (!currentBookId || !currentChapterId) {
      const first = book?.chapters[0].id;
      const { chapterId } = continueBook(book?.id.toString() || "", first?.toString() || "");
      setCurrent(book?.id.toString() || "", chapterId);
    }
  }, []);

  const shownChapterId = useMemo(
    () => currentChapterId ?? book?.chapters[0].id,
    [book?.chapters, currentChapterId]
  );

  const openChapter = (chapterId: string) => {
    setCurrent(book?.id.toString() || "", chapterId);
    setTocOpen(false);
  };
  if (!isLoading)
    return (
      <div className="relative flex h-[100dvh] bg-white text-slate-900">
        <div className={"hidden md:block"}>
          <TOC
            book={book as TBook}
            currentChapterId={shownChapterId?.toString() || ""}
            onOpenChapter={openChapter}
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
            book={book as TBook}
            currentChapterId={shownChapterId?.toString() || ""}
            onOpenChapter={openChapter}
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

        <div className="flex-1 min-w-0">
          <Reader isRefetching={isRefetching} book={book as TBook} refetch={refetch} chapterId={shownChapterId?.toString() || ""} onOpenToc={() => setTocOpen(true)} />
        </div>
      </div>
    )
  return <LoadingModal isLoading={isLoading}/>
}
  ;
export default App;