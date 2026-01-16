import type { MouseEventHandler } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Location = {
  position: any;
  currentTime: any;
  progress: any;
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
  saveProgress: any;
  currentBookId: string | null;
  currentChapterId: string | null;
  setProgressPercent?: (progress: number) => void;
  progressPercent: number;
  isOpenSideBar: boolean;
  toggleOpenSideBar: MouseEventHandler<HTMLButtonElement>;

  currentPosition: CurrentPosition;

  locations: Record<string, Location>;

  setCurrent: (bookId: string | null, chapterId: string | null) => void;

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

  language: "kh" | "eng" | "ch";
  setLanguage: (lang: "kh" | "eng" | "ch") => void;
};

// Migration function for version 3 to 4
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrateV3toV4 = (persistedState: any) => {
  return {
    ...persistedState,
    language: "eng", // Default language for migrated state
  };
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
      progressPercent: 0,
      onDownloadProgress: (percent: number) =>
        set({ progressPercent: percent }),

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
              : s.currentPosition,
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

      language: "eng",
      setLanguage: (lang: "kh" | "eng" | "ch") => set({ language: lang }),
    }),
    {
      name: "reader-progress",
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // eslint-disable-next-line
        const { isOpenSideBar, toggleOpenSideBar, ...rest } = state;
        return rest;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      migrate: (persistedState: any, version: number) => {
        console.log("Migrating from version", version, "to version 4");

        // If version is 3, migrate to version 4
        if (version === 3) {
          return migrateV3toV4(persistedState);
        }

        // For any other version or fresh state, return as is
        return persistedState || {};
      },
      merge: (persisted, current) => {
        const {
          // eslint-disable-next-line
          isOpenSideBar: _ignore1,
          // eslint-disable-next-line
          toggleOpenSideBar: _ignore2,
          ...rest
        } = (persisted ?? {}) as Partial<ReaderState>;
        return { ...current, ...rest };
      },
    }
  )
);
