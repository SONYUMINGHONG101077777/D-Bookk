import { useQuery } from "@tanstack/react-query";
import { fetchBookData, getChapterContentsFromBook, type TBook, type TTopics } from "./api";

// Directly fetch the book from the PALM-01 endpoint
export const useBook = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: () => {
      if (!bookId) throw new Error("Book ID is required");
      return fetchBookData(bookId);
    },
    enabled: !!bookId,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    retryDelay: 1000,
  });
};

export const useBookById = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID is required");
      return fetchBookData(bookId);
    },
    enabled: !!bookId,
    staleTime: 5 * 60_000,
    retry: 2,
    retryDelay: 1000,
  });
};

export const useFirstChapterId = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ["first-chapter", bookId],
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID is required");
      
      const bookData = await fetchBookData(bookId);
      const book = bookData.data;
      
      if (book && book.topics && book.topics.length > 0) {
        // Find first topic
        const firstTopic = book.topics[0];
        return firstTopic.id.toString();
      }
      
      throw new Error(`No topics found for book ${bookId}`);
    },
    enabled: !!bookId,
    staleTime: 5 * 60_000,
  });
};

// Helper function to find topic in tree
const findTopicInTree = (topics: TTopics[], targetId: string): TTopics | undefined => {
  if (!topics || topics.length === 0) return undefined;

  for (const topic of topics) {
    if (topic.id.toString() === targetId) {
      return topic;
    }
    if (topic.children && topic.children.length > 0) {
      const found = findTopicInTree(topic.children, targetId);
      if (found) return found;
    }
  }
  return undefined;
};

export const useChapterById = (bookId: string | undefined, chapterId: string | undefined) => {
  return useQuery({
    queryKey: ["chapter", bookId, chapterId],
    enabled: !!bookId && !!chapterId,
    queryFn: async () => {
      if (!bookId) throw new Error("Book ID is required");
      if (!chapterId) throw new Error("Chapter ID is required");
      
      // First fetch the book data
      const bookData = await fetchBookData(bookId);
      const book = bookData.data;
      
      // Find the topic in the book's topics tree
      if (!book.topics || book.topics.length === 0) {
        throw new Error(`No topics found for book ${bookId}`);
      }
      
      const topic = findTopicInTree(book.topics, chapterId);
      
      if (!topic) {
        throw new Error(`Chapter ${chapterId} not found in book ${bookId}`);
      }
      
      // Get contents for this topic
      const contents = getChapterContentsFromBook(book, chapterId);
      
      // Return a TTopics object with contents
      return {
        message: "Success",
        data: {
          ...topic,
          contents: contents
        }
      };
    },
    staleTime: 5 * 60000,
    retry: 2,
    retryDelay: 1000,
  });
};

// Alternative: Get chapter with contents directly from book
export const useChapterWithContents = (book: TBook | undefined, chapterId: string | undefined) => {
  return useQuery({
    queryKey: ["chapter-contents", book?.id, chapterId],
    enabled: !!book && !!chapterId,
    queryFn: () => {
      if (!book) throw new Error("Book is required");
      if (!chapterId) throw new Error("Chapter ID is required");
      
      // Find the topic in the book's topics tree
      if (!book.topics || book.topics.length === 0) {
        throw new Error(`No topics found for book ${book.id}`);
      }
      
      const topic = findTopicInTree(book.topics, chapterId);
      
      if (!topic) {
        throw new Error(`Chapter ${chapterId} not found in book ${book.id}`);
      }
      
      // Get contents for this topic
      const contents = getChapterContentsFromBook(book, chapterId);
      
      // Return a TTopics object with contents
      return {
        ...topic,
        contents: contents
      };
    },
    staleTime: 5 * 60000,
    retry: false, // No retry needed since we're using local data
  });
};