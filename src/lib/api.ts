const BASE = import.meta.env.VITE_BASE_URL;

// type BaseResponse<T> = {
//   message: string;
//   data: T;
// };

export type TContents = {
  thumbnail: string;
  id: number;
  topic_id: number;
  content_en: string;
  content_kh: string;
  content_ch: string;
  created_at: string;
  updated_at: string;
  video_en?: string;
  video_kh?: string;
  video_ch?: string;
  title_en?: string;
  title_kh?: string;
  title_ch?: string;
};

export type TTopics = {
  id: number;
  section_id: number;
  parent_id: number | null;
  title_en: string;
  title_kh: string;
  title_ch: string;
  created_at: string;
  updated_at: string;
  contents?: TContents[];
  children?: TTopics[];
};

export type TBook = {
  id: number;
  title_en: string;
  title_kh: string;
  title_ch: string;
  status: number;
  company_id: string;
  created_at: string;
  updated_at: string;
  topics?: TTopics[];
};

// Fetch book data - this includes topics AND contents
export const fetchBookData = async (bookId: string) => {
  try {
    console.log("Fetching book data for ID:", bookId);

    // Fetch from the PALM-01 endpoint
    const res = await fetch(`${BASE}/get-help_center/PALM-01`);

    if (!res.ok) {
      throw new Error(`Failed to fetch book data. Status: ${res.status}`);
    }

    const data = await res.json();
    console.log("Book data response:", data);

    // Find the specific book
    let bookData: TBook | null = null;

    if (data.data && Array.isArray(data.data)) {
      bookData =
        data.data.find((b: TBook) => b.id.toString() === bookId) || null;
    } else if (data.data && data.data.id?.toString() === bookId) {
      bookData = data.data;
    }

    if (!bookData) {
      throw new Error(`Book ${bookId} not found`);
    }

    return {
      message: "Success",
      data: bookData,
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to fetch book ${bookId}: ${message}`);
  }
};

// Get chapter contents from the already-loaded book data
export const getChapterContentsFromBook = (
  book: TBook,
  chapterId: string
): TContents[] => {
  console.log("Getting contents for chapter", chapterId, "from book:", book);

  if (!book.topics || book.topics.length === 0) {
    console.log("No topics in book");
    return [];
  }

  // Helper function to recursively search topics
  const findTopicInTree = (
    topics: TTopics[],
    targetId: string
  ): TTopics | undefined => {
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

  const topic = findTopicInTree(book.topics, chapterId);
  console.log("Found topic:", topic);

  if (topic && topic.contents) {
    console.log("Returning contents:", topic.contents);
    return topic.contents;
  }

  console.log("No contents found for chapter", chapterId);
  return [];
};
