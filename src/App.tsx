import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useBookById, useFirstChapterId } from "./lib/queries";
import { useReaderStore } from "./store/readerStore";
import TOC from "./components/TOC";
import Reader from "./components/Reader";

export default function App() {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("book_id") || "64"; // Default to your book ID
  const chapterId = searchParams.get("chapter_id") || "";
  
  const [isTocOpen, setIsTocOpen] = useState(true);
  const setCurrent = useReaderStore((s) => s.setCurrent);

  // Fetch book data
  const { 
    data: bookData, 
    isLoading: isLoadingBook, 
    error: bookError, 
    refetch: refetchBook 
  } = useBookById(bookId);

  // Fetch first chapter ID if no chapter is selected
  const { 
    data: firstChapterData, 
    isLoading: isLoadingFirstChapter 
  } = useFirstChapterId(bookId);

  // Set current book in store when loaded
  useEffect(() => {
    if (bookData?.data) {
      setCurrent(bookData.data.id.toString(), chapterId || null);
    }
  }, [bookData, chapterId, setCurrent]);

  // Auto-select first chapter if no chapter is selected
  useEffect(() => {
    if (!chapterId && firstChapterData && bookData?.data) {
      const params = new URLSearchParams(searchParams);
      params.set("chapter_id", firstChapterData);
      window.history.replaceState({}, "", `?${params.toString()}`);
    }
  }, [chapterId, firstChapterData, bookData, searchParams]);

  // Show loading state
  if (isLoadingBook || isLoadingFirstChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading book data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (bookError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-4">
          <h2 className="text-2xl font-bold text-red-600 mb-2">No Book Found</h2>
          <p className="text-muted-foreground mb-4">Unable to load the book data.</p>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-sm">Book ID: {bookId}</p>
            <p className="text-sm mt-2">Error: {bookError.message}</p>
            <p className="text-sm mt-2">
              API URL: {import.meta.env.VITE_BASE_URL}
            </p>
          </div>
          <button 
            onClick={() => refetchBook()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show no data state
  if (!bookData?.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Book Data</h2>
          <p className="text-muted-foreground mb-4">Book data could not be loaded.</p>
          <button 
            onClick={() => refetchBook()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const book = bookData.data;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Table of Contents - Desktop */}
      {isTocOpen && (
        <div className="hidden md:block">
          <TOC
            book={book}
            currentChapterId={chapterId}
            onOpenChapter={(id) => {
              const params = new URLSearchParams(searchParams);
              params.set("chapter_id", id);
              window.history.pushState({}, "", `?${params.toString()}`);
            }}
            onClose={() => setIsTocOpen(false)}
          />
        </div>
      )}

      {/* Table of Contents - Mobile Overlay */}
      {isTocOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsTocOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm">
            <TOC
              book={book}
              currentChapterId={chapterId}
              onOpenChapter={(id) => {
                const params = new URLSearchParams(searchParams);
                params.set("chapter_id", id);
                window.history.pushState({}, "", `?${params.toString()}`);
                setIsTocOpen(false);
              }}
              onClose={() => setIsTocOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Reader */}
      <div className="flex-1">
        <Reader
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