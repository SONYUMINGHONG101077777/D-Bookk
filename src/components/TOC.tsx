import { useSearchParams } from "react-router-dom";
import type { TBook } from "../lib/api";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import FontSizeController from "./FontSizeController";
import ThemeSwitcher from "./ThemeSwitcher";
import { useReaderStore } from "../store/readerStore";
import { useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
book: TBook;
currentChapterId: string | null;
onOpenChapter: (chapterId: string) => void;
onClose?: () => void;
};

export default function TOC({ book, currentChapterId, onOpenChapter, onClose }: Props) {
const setParams = useSearchParams()[1];
const setCurrent = useReaderStore((s) => s.setCurrent);

const [query, setQuery] = useState("");
const [openChapterId, setOpenChapterId] = useState<string | null>(null);

const onBackHome = () => {
setParams(new URLSearchParams(), { replace: true });
setCurrent(book?.id.toString(), "");
window.location.reload();
};

const filteredChapters = book?.chapters?.filter(ch =>
ch.title.toLowerCase().includes(query.toLowerCase())
);

return ( <aside className="w-full relative md:w-80 md:flex-none border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-6 h-full overflow-hidden flex flex-col">


  {/* Mobile Header */}
  <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b border-[rgb(var(--border))]">
    <span className="flex flex-col hover:bg-black/15 px-2 py-2 rounded-md cursor-default" onClick={onBackHome}>
      <h2 className="text-2xl font-bold text-[rgb(var(--text))]">{book?.title}</h2>
      {book?.author && <p className="m-0 text-sm text-[rgb(var(--muted))]">{book?.author}</p>}
    </span>
    <button
      onClick={onClose}
      className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-sm transition-colors hover:bg-[rgb(var(--border))] text-[rgb(var(--text))]"
      aria-label="Close menu"
    >
      ✕
    </button>
  </div>

  {/* Desktop Header */}
  <div className="hidden md:block mb-6 cursor-pointer" onClick={onBackHome}>
    <h2 className="m-0 text-xl font-bold text-[rgb(var(--text))] mb-1">{book?.title}</h2>
    {book?.author && <p className="m-0 text-sm text-[rgb(var(--muted))]">{book?.author}</p>}
  </div>

  {/* Search Box */}
  <div className="relative w-full mb-3">
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="ស្វែងរកជំពូក..."
      className="w-full pl-10 pr-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--input))] text-[rgb(var(--text))] placeholder-[rgb(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
    />
    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
  </div>

  {/* Chapter Count */}
  <h3 className="my-2 text-base font-semibold text-[rgb(var(--text))]">
    ទាំងអស់មាន {toKhmerNumber(filteredChapters?.length)} ជំពូក
  </h3>

  {/* Chapter List with clickable chapters */}
  <div className="flex-1 overflow-auto">
    {filteredChapters?.map((ch, idx) => (
      <div key={ch.id} className="mb-2 m-2">
        <button
          onClick={() => {
            onOpenChapter(ch.id); 
            setOpenChapterId(openChapterId === String(ch.id) ? null : String(ch.id));
          }}
          className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-left text-[rgb(var(--text))] bg-[rgb(var(--input))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] ${
            currentChapterId === String(ch.id) ? 'bg-[rgb(var(--accent))] text-white' : ''
          }`}
        >
          <span>ជំពូក {toKhmerNumber(idx + 1)}: {ch.title}</span>
          {openChapterId === String(ch.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {openChapterId === String(ch.id) && (
          <div className="pl-4 mt-1 text-sm text-gray-500">
            {ch.subtitle || "គ្មានព័ត៌មានបន្ថែម"}
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Footer ------------------------------------*/}
  <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-[rgb(var(--border))]">
    <ThemeSwitcher />
    <FontSizeController />
  </div>
</aside>


);
}
