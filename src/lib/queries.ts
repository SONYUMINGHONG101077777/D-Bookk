import { useQuery } from "@tanstack/react-query";
import { fetchAllBooks } from "./api";

export const useBook = () => {
  return useQuery({
    queryKey: ["book"],
    queryFn: () => fetchAllBooks(),
    staleTime: 5 * 60_000,
  });
};
