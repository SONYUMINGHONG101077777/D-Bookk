

const BASE = import.meta.env.VITE_BASE_URL;

type BaseResponse<T> = {
  message: string;
  data: T;
};

export type TContents = {
    id: number;
    topic_id: number;
    content_en: string;
    content_kh: string;
    content_ch: string;
    created_at: string;
    updated_at : string;
}

export type TTopics ={
    id: number;
    section_id: number;
    parent_id: number | null;
    subtitle: string;
    title_en: string;
    title_kh: string;
    title_ch: string;
    created_at: string
    updated_at : string;
    children: TTopics[];
    contents: TContents[]
}

export type TBook = {
    id: number;
    title_en: string;
    title_kh: string;
    title_ch: string;
    status: number
    company_id: string;
    created_at: string;
    updated_at: string;
    topics: TTopics[];
}

export const fetchAllBooks = async () => {
  const res = await fetch(BASE + "/get-help_center/PALM-01");
  if (!res.ok) throw new Error("Failed to fetch all words");
  return res.json() as Promise<BaseResponse<TContents[]>>;
};
export const fetchOneChapterById = async (id: string) => {
    const res = await fetch(BASE + "/get-help_center/PALM-01" + id)
    return res.json() as Promise<TTopics>
}