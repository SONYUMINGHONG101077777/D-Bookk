import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Location = {
  bookId: string;
  chapterId: string;
  scrollTop: number;
  updatedAt: number;
};

type ReaderState = {
  currentBookId: string | null;
  currentChapterId: string | null;
  locations: Record<string, Location>;

  setCurrent: (bookId: string, chapterId: string) => void;
  saveLocation: (bookId: string, chapterId: string, scrollTop: number) => void;
  getLocation: (bookId: string, chapterId: string) => Location | null;

  continueBook: (
    bookId: string,
    fallbackChapterId: string
  ) => { chapterId: string; scrollTop: number };
  clearProgress: (bookId?: string) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      currentBookId: null,
      currentChapterId: null,
      locations: {},

      setCurrent: (bookId, chapterId) =>
        set({ currentBookId: bookId, currentChapterId: chapterId }),

      saveLocation: (bookId, chapterId, scrollTop) =>
        set((s) => {
          const key = `${bookId}:${chapterId}`;
          return {
            locations: {
              ...s.locations,
              [key]: { bookId, chapterId, scrollTop, updatedAt: Date.now() },
            },
          };
        }),

      getLocation: (bookId, chapterId) => {
        const key = `${bookId}:${chapterId}`;
        return get().locations[key] ?? null;
      },

      continueBook: (bookId, fallbackChapterId) => {
        const entries = Object.values(get().locations).filter(
          (l) => l.bookId === bookId
        );
        if (entries.length === 0)
          return { chapterId: fallbackChapterId, scrollTop: 0 };
        const latest = entries.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        return { chapterId: latest.chapterId, scrollTop: latest.scrollTop };
      },

      clearProgress: (bookId) =>
        set((s) => {
          if (!bookId) return { locations: {} };
          const next: Record<string, Location> = {};
          for (const [k, v] of Object.entries(s.locations)) {
            if (v.bookId !== bookId) next[k] = v;
          }
          return { locations: next };
        }),
    }),
    {
      name: "reader-progress",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
