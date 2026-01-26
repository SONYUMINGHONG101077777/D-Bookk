import { useState, useEffect } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBookById, useFirstChapterId } from "./lib/queries";
import { useReaderStore } from "./store/readerStore";
import TOC from "./components/TOC";
import Reader from "./components/Reader";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, 
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookId = params.bookId || searchParams.get("book_id") || "64";
  const chapterId = searchParams.get("chapter_id") || "";
  
  const [isTocOpen, setIsTocOpen] = useState(true);
  const setCurrent = useReaderStore((s) => s.setCurrent);

  const { 
    data: bookData, 
    isLoading: isLoadingBook, 
    error: bookError, 
    refetch: refetchBook 
  } = useBookById(bookId);

  const { 
    data: firstChapterData, 
    isLoading: isLoadingFirstChapter 
  } = useFirstChapterId(bookId);

  useEffect(() => {
    if (bookData?.data) {
      setCurrent(bookData.data.id.toString(), chapterId || null);
    }
  }, [bookData, chapterId, setCurrent]);

  useEffect(() => {
    if (!chapterId && firstChapterData && bookData?.data) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("chapter_id", firstChapterData);
      newParams.delete("page");
      navigate(`?${newParams.toString()}`, { replace: true });
    }
  }, [chapterId, firstChapterData, bookData, searchParams, navigate]);

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
              const newParams = new URLSearchParams(searchParams);
              newParams.set("chapter_id", id);
              // Remove page parameter when changing chapter
              newParams.delete("page");
              navigate(`?${newParams.toString()}`);
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
                const newParams = new URLSearchParams(searchParams);
                newParams.set("chapter_id", id);
                newParams.delete("page");
                navigate(`?${newParams.toString()}`);
                setIsTocOpen(false);
              }}
              onClose={() => setIsTocOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
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

// Main App wrapper with QueryClientProvider
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}