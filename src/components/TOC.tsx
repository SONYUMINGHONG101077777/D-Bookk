import type { TBook } from "../lib/api";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import FontSizeController from "./FontSizeController";
import ThemeSwitcher from "./ThemeSwitcher";

type Props = {
  book: TBook;
  currentChapterId: string | null;
  onOpenChapter: (chapterId: string) => void;
  onClose?: () => void;
};

export default function TOC({
  book,
  currentChapterId,
  onOpenChapter,
  onClose,
}: Props) {
  return (
    <aside className={`w-full relative md:w-80 md:flex-none border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-6 h-full overflow-hidden flex flex-col`}>
      <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b border-[rgb(var(--border))]">
        <h2 className="text-2xl font-bold text-[rgb(var(--text))]">{book.title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-sm transition-colors hover:bg-[rgb(var(--border))] text-[rgb(var(--text))]"
          aria-label="បិទម៉ឺនុយ"
        >
          ✕
        </button>
      </div>

      <div className="hidden md:block mb-6">
        <h2 className="m-0 text-xl font-bold text-[rgb(var(--text))] mb-1">
          {book.title}
        </h2>
        {book.author && (
          <p className="m-0 text-sm text-[rgb(var(--muted))]">{book.author}</p>
        )}
      </div>

      <h3 className="my-4 text-base font-semibold text-[rgb(var(--text))]">
        ទាំងអស់មាន{toKhmerNumber(book.chapters?.length)}ជំពូក
      </h3>

      <ol className="flex-1 list-none gap-2 p-0 m-0 overflow-y-auto flex flex-col pr-2 no-scrollbar">
        {book.chapters?.map((ch, idx) => {
          const active = currentChapterId === ch.id.toString();
          return (
            <li key={ch.id}>
              <button
                onClick={() => onOpenChapter(ch.id.toString())}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  active
                    ? "bg-[rgb(var(--accent))] border-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                    : "border-[rgb(var(--border))] text-[rgb(var(--text))] hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--card))]"
                }`}
                title={`បើក ${ch.title}`}
              >
                <span className="font-semibold whitespace-nowrap flex-shrink-0">
                  ជំពូក {toKhmerNumber(idx + 1)}:
                </span>
                <span className="truncate text-sm">{ch.title}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-[rgb(var(--border))]">
        <ThemeSwitcher />
        <FontSizeController />
      </div>
    </aside>
  );
}