import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBookById, useFirstChapterId } from "./lib/queries";
import { useReaderStore } from "./store/readerStore";
import TOC from "./components/TOC";
import Reader from "./components/Reader";

export default function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const bookId = searchParams.get("book_id") || "64";
  const chapterId = searchParams.get("chapter_id") || "";

  const [isTocOpen, setIsTocOpen] = useState(true);
  const setCurrent = useReaderStore((s) => s.setCurrent);

  //FETCH BOOK informetion
  const {
    data: bookData,
    isLoading: isLoadingBook,
    error: bookError,
    refetch: refetchBook,
  } = useBookById(bookId);

  const {
    data: firstChapterId,
    isLoading: isLoadingFirstChapter,
  } = useFirstChapterId(bookId);

  // SET CURRENT book in website 
  useEffect(() => {
    if (bookData?.data) {
      setCurrent(bookData.data.id.toString(), chapterId || null);
    }
  }, [bookData, chapterId, setCurrent]);

  //AUTO SELECT FIRST CHAPTER book web
  useEffect(() => {
    if (!chapterId && firstChapterId) {
      navigate(`?book_id=${bookId}&chapter_id=${firstChapterId}`, {
        replace: true,
      });
    }
  }, [chapterId, firstChapterId, bookId, navigate]);

  // LOADING open web
  if (isLoadingBook || isLoadingFirstChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  //  ERROR
  if (bookError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">Book not found</h2>
          <button
            onClick={() => refetchBook()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!bookData?.data) return null;

  const book = bookData.data;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* TOC DESKTOP */}
      {isTocOpen && (
        <div className="hidden md:block">
          <TOC
            book={book}
            currentChapterId={chapterId}
            onOpenChapter={(id) =>
              navigate(`?book_id=${bookId}&chapter_id=${id}`)
            }
            onClose={() => setIsTocOpen(false)}
          />
        </div>
      )}

      {/* TOC MOBILE */}
      {isTocOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsTocOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-background">
            <TOC
              book={book}
              currentChapterId={chapterId}
              onOpenChapter={(id) => {
                navigate(`?book_id=${bookId}&chapter_id=${id}`);
                setIsTocOpen(false);
              }}
              onClose={() => setIsTocOpen(false)}
            />
          </div>
        </div>
      )}

     {/* after select Reader Book  */}
      <div className="flex-1">
        <Reader
          key={chapterId} 
          book={book}
          chapterId={chapterId}
          onOpenToc={() => setIsTocOpen(true)}
          refetch={refetchBook}
          isRefetching={isLoadingBook}
        />
      </div>
    </div>
  );
}
