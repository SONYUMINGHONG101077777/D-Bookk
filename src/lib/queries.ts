import { useQuery } from "@tanstack/react-query";
import { fetchBookData, getChapterContentsFromBook, type TBook, type TTopics, type TContents } from "./api";

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

interface ChapterResponse {
  message: string;
  data: {
    id: number | string;
    title?: string;
    title_en?: string;
    title_kh?: string;
    title_ch?: string;
    contents: TContents[];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
}

export const useChapterById = (bookId: string | undefined, chapterId: string | undefined) => {
  return useQuery<ChapterResponse, Error>({
    queryKey: ["chapter", bookId, chapterId],
    enabled: !!bookId && !!chapterId,
    queryFn: async (): Promise<ChapterResponse> => {
      if (!bookId) throw new Error("Book ID is required");
      if (!chapterId) throw new Error("Chapter ID is required");
      
      const bookData = await fetchBookData(bookId);
      const book = bookData.data;
      
      if (!book.topics || book.topics.length === 0) {
        return {
          message: "No topics found",
          data: {
            id: chapterId,
            title: "",
            contents: []
          }
        };
      }
      
      const topic = findTopicInTree(book.topics, chapterId);
      
      if (!topic) {
        return {
          message: "Topic not found",
          data: {
            id: chapterId,
            title: "",
            contents: []
          }
        };
      }
      
      const contents = getChapterContentsFromBook(book, chapterId) ?? [];
      
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

export const useChapterWithContents = (book: TBook | undefined, chapterId: string | undefined) => {
  return useQuery({
    queryKey: ["chapter-contents", book?.id, chapterId],
    enabled: !!book && !!chapterId,
    queryFn: (): ChapterResponse => {
      if (!book) throw new Error("Book is required");
      if (!chapterId) throw new Error("Chapter ID is required");
      
      if (!book.topics || book.topics.length === 0) {
        return {
          message: "Success",
          data: {
            id: chapterId,
            title: "",
            contents: []
          }
        };
      }
      
      const topic = findTopicInTree(book.topics, chapterId);
      
      if (!topic) {
        return {
          message: "Success",
          data: {
            id: chapterId,
            title: "",
            contents: []
          }
        };
      }
      
      const contents = getChapterContentsFromBook(book, chapterId);
      
      return {
        message: "Success",
        data: {
          ...topic,
          contents: contents
        }
      };
    },
    staleTime: 5 * 60000,
    retry: false,
  });
};