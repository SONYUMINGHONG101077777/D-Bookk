import { useQuery } from "@tanstack/react-query";
import { fetchAllBooks, fetchOneChapterById } from "./api";

export const useBook = () => {
  return useQuery({
    queryKey: ["book"],
    queryFn: () => fetchAllBooks(),
    staleTime: 5 * 60_000,
  });
};

export const useFirstChapterId = (book_id: string) => {
  return useQuery({
    queryKey: ["book"],
    queryFn: () => fetchAllBooks(),
    staleTime: 5 * 60_000,
    select: (res) =>
      res.data
        .filter((D) => D.id.toString() === book_id)
        .map((b) => b.chapters[0].id),
  });
};

export const useChapterById = (id: string) => {
  return useQuery({
    queryKey: ["book"],
    enabled: !!id,
    queryFn: () => fetchOneChapterById(id),
    select: (res) => res,
    staleTime: 5 * 60000
  });
};
