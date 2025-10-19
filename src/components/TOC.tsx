import type { Book } from "../mock/books";

type Props = {
  book: Book;
  currentChapterId: string | null;
  onOpenChapter: (chapterId: string) => void;
  onContinue: () => void;
  onReset: () => void;
  onClose?: () => void; 
};

export default function TOC({
  book,
  currentChapterId,
  onOpenChapter,
  onContinue,
  onReset,
  onClose,
}: Props) {
  return (
    <aside className="w-full md:w-80 md:flex-none border-r border-slate-200 bg-white p-4 sm:p-6 h-full overflow-y-auto">
      {/* Mobile header (Close) */}
      <div className="mb-3 flex items-center justify-between md:hidden">
        <h2 className="text-lg font-bold">{book.title}</h2>
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm hover:bg-slate-50"
          aria-label="បិទ​ម៉ឺនុយ"
        >
          ✕
        </button>
      </div>

      <h2 className="m-0 hidden text-lg font-bold sm:text-xl md:block">
        {book.title}
      </h2>
      {book.author && (
        <div className="mb-3 text-slate-500 hidden md:block">{book.author}</div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={onContinue}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 active:scale-[0.99]"
        >
          បន្តអាន (Continue)
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 active:scale-[0.99]"
        >
          សូន្យសល់ (Reset)
        </button>
      </div>

      <ol className="grid list-none gap-2 p-0 m-0">
        {book.chapters.map((ch, idx) => {
          const active = currentChapterId === ch.id;
          return (
            <li key={ch.id}>
              <button
                onClick={() => onOpenChapter(ch.id)}
                className={[
                  "w-full text-left px-3 py-2 rounded-xl border transition-colors flex items-center gap-2",
                  active
                    ? "bg-indigo-50 border-indigo-500"
                    : "bg-white border-slate-200 hover:bg-slate-50",
                ].join(" ")}
                title={`បើក ${ch.title}`}
              >
                <span className="font-semibold whitespace-nowrap">
                  ជំពូក {idx + 1}:
                </span>
                <span className="truncate">{ch.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}