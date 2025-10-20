import type { MouseEventHandler } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Location = {
  bookId: string;
  chapterId: string;
  scrollTop: number;
  page?: number;
  updatedAt: number;
};

type CurrentPosition = {
  bookId: string | null;
  chapterId: string | null;
  page: number;
  scrollTop: number;
  updatedAt: number | null;
};

type ReaderState = {
  currentBookId: string | null;
  currentChapterId: string | null;

  isOpenSideBar: boolean;
  toggleOpenSideBar: MouseEventHandler<HTMLButtonElement>;

  currentPosition: CurrentPosition;

  locations: Record<string, Location>;

  setCurrent: (bookId: string, chapterId: string) => void;

  saveLocation: (bookId: string, chapterId: string, scrollTop: number) => void;

  savePage: (bookId: string, chapterId: string, page: number) => void;

  getLocation: (bookId: string, chapterId: string) => Location | null;

  continueBook: (
    bookId: string,
    fallbackChapterId: string
  ) => {
    chapterId: string;
    page: number;
    scrollTop: number;
  };

  clearProgress: (bookId?: string) => void;

  fontSize: number;
  setFontSize: (size: number) => void;
};

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      currentBookId: null,
      currentChapterId: null,

      isOpenSideBar: true,
      toggleOpenSideBar: () =>
        set((s) => ({ isOpenSideBar: !s.isOpenSideBar })),

      currentPosition: {
        bookId: null,
        chapterId: null,
        page: 0,
        scrollTop: 0,
        updatedAt: null,
      },

      locations: {},

      setCurrent: (bookId, chapterId) =>
        set((s) => {
          const key = `${bookId}:${chapterId}`;
          const existing = s.locations[key];
          return {
            currentBookId: bookId,
            currentChapterId: chapterId,
            currentPosition: {
              bookId,
              chapterId,
              page: existing?.page ?? 0,
              scrollTop: existing?.scrollTop ?? 0,
              updatedAt: Date.now(),
            },
          };
        }),

      saveLocation: (bookId, chapterId, scrollTop) =>
        set((s) => {
          const key = `${bookId}:${chapterId}`;
          const prev = s.locations[key];
          const nextLoc: Location = {
            bookId,
            chapterId,
            scrollTop,
            page: prev?.page ?? 0,
            updatedAt: Date.now(),
          };

          const updateCurrent =
            s.currentPosition.bookId === bookId &&
            s.currentPosition.chapterId === chapterId;

          return {
            locations: { ...s.locations, [key]: nextLoc },
            currentPosition: updateCurrent
              ? {
                  bookId,
                  chapterId,
                  page: nextLoc.page ?? 0,
                  scrollTop,
                  updatedAt: nextLoc.updatedAt,
                }
              : s.currentPosition,
          };
        }),

      savePage: (bookId, chapterId, page) =>
        set((s) => {
          const key = `${bookId}:${chapterId}`;
          const prev = s.locations[key];
          const nextLoc: Location = {
            bookId,
            chapterId,
            page,
            scrollTop: prev?.scrollTop ?? 0,
            updatedAt: Date.now(),
          };

          const updateCurrent =
            s.currentPosition.bookId === bookId &&
            s.currentPosition.chapterId === chapterId;

          return {
            locations: { ...s.locations, [key]: nextLoc },
            currentPosition: updateCurrent
              ? {
                  bookId,
                  chapterId,
                  page,
                  scrollTop: nextLoc.scrollTop,
                  updatedAt: nextLoc.updatedAt,
                }
              : {
                  bookId,
                  chapterId,
                  page,
                  scrollTop: nextLoc.scrollTop,
                  updatedAt: nextLoc.updatedAt,
                },
          };
        }),

      getLocation: (bookId, chapterId) => {
        const key = `${bookId}:${chapterId}`;
        return get().locations[key] ?? null;
      },

      continueBook: (bookId, fallbackChapterId) => {
        const { currentPosition } = get();
        if (currentPosition.bookId === bookId && currentPosition.chapterId) {
          return {
            chapterId: currentPosition.chapterId,
            page: currentPosition.page ?? 0,
            scrollTop: currentPosition.scrollTop ?? 0,
          };
        }

        const entries = Object.values(get().locations).filter(
          (l) => l.bookId === bookId
        );
        if (entries.length === 0)
          return { chapterId: fallbackChapterId, page: 0, scrollTop: 0 };

        const latest = entries.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        return {
          chapterId: latest.chapterId,
          page: latest.page ?? 0,
          scrollTop: latest.scrollTop ?? 0,
        };
      },

      clearProgress: (bookId) =>
        set((s) => {
          if (!bookId) {
            return {
              locations: {},
              currentPosition: {
                bookId: null,
                chapterId: null,
                page: 0,
                scrollTop: 0,
                updatedAt: null,
              },
            };
          }
          const next: Record<string, Location> = {};
          for (const [k, v] of Object.entries(s.locations)) {
            if (v.bookId !== bookId) next[k] = v;
          }

          const resetCurrent =
            s.currentPosition.bookId === bookId
              ? {
                  bookId: null,
                  chapterId: null,
                  page: 0,
                  scrollTop: 0,
                  updatedAt: null,
                }
              : s.currentPosition;

          return { locations: next, currentPosition: resetCurrent };
        }),
      fontSize: 16,
      setFontSize: (n: number) => set({ fontSize: n }),
    }),
    {
      name: "reader-progress",
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const { isOpenSideBar, toggleOpenSideBar, ...rest } = state;
        return rest;
      },
      merge: (persisted, current) => {
        const {
          isOpenSideBar: _ignore1,
          toggleOpenSideBar: _ignore2,
          ...rest
        } = (persisted ?? {}) as Partial<ReaderState>;
        return { ...current, ...rest };
      },
    }
  )
);
