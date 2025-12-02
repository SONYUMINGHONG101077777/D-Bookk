

const BASE = import.meta.env.VITE_BASE_URL;

type BaseResponse<T> = {
  message: string;
  data: T;
};

export type TParagraphs = {
    id: number
    chapter_id: string;
    content: string;
    created_at: string
    updated_at: string;
}

export type TChapter ={
    subtitle: string;
    id: number;
    book_id: string;
    title: string;
    created_at: string
    updated_at : string;
    paragraphs: TParagraphs[]
}

export type TBook = {
    id: number
    title: string
    author: string 
    created_at: string
    updated_at : string;
    chapters: TChapter[]
}

export const fetchAllBooks = async () => {
  const res = await fetch(BASE + "/beydok");
  if (!res.ok) throw new Error("Failed to fetch all words");
  return res.json() as Promise<BaseResponse<TBook[]>>;
};
export const fetchOneChapterById = async (id: string) => {
    const res = await fetch(BASE + "/beydok/chapter/" + id)
    return res.json() as Promise<TChapter>
}