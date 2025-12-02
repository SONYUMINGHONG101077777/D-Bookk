  import { useSearchParams } from "react-router-dom";
  import type { TBook } from "../lib/api";
  import { toKhmerNumber } from "../utils/toKhmerNumber";
  import FontSizeController from "./FontSizeController";
  import ThemeSwitcher from "./ThemeSwitcher";
  import { useReaderStore } from "../store/readerStore";
  import { useState } from "react";
  import { Search, ChevronDown, ChevronUp, Globe } from "lucide-react";

  type Props = {
    book: TBook;
    currentChapterId: string | null;
    onOpenChapter: (chapterId: string) => void;
    onClose?: () => void;
  };

  type Language = "kh" | "eng" | "ch";

  const languageOptions = {
    kh: { name: "ខ្មែរ", flag: "🇰🇭" },
    eng: { name: "English", flag: "🇺🇸" },
    ch: { name: "中文", flag: "🇨🇳" }
  };

  const translations = {
    kh: {
      closeMenu: "បិទម៉ឺនុយ",
      searchPlaceholder: "ស្វែងរកជំពូក...",
      totalChapters: (count: number) => `ទាំងអស់មាន ${toKhmerNumber(count)} ជំពូក`,
      noAdditionalInfo: "គ្មានព័ត៌មានបន្ថែម",
      chapter: (num: number) => `ជំពូក ${toKhmerNumber(num)}`
    },
    eng: {
      closeMenu: "Close menu",
      searchPlaceholder: "Search chapters...",
      totalChapters: (count: number) => `Total ${count} chapters`,
      noAdditionalInfo: "No additional information",
      chapter: (num: number) => `Chapter ${num}`
    },
    ch: {
      closeMenu: "关闭菜单",
      searchPlaceholder: "搜索章节...",
      totalChapters: (count: number) => `共有 ${count} 章`,
      noAdditionalInfo: "无附加信息",
      chapter: (num: number) => `第${num}章`
    }
  };

  export default function TOC({ book, currentChapterId, onOpenChapter, onClose }: Props) {
    const setParams = useSearchParams()[1];
    const setCurrent = useReaderStore((s) => s.setCurrent);

    const [query, setQuery] = useState("");
    const [openChapterId, setOpenChapterId] = useState<string | null>(null);
    const [currentLanguage, setCurrentLanguage] = useState<Language>("kh");
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

    const t = translations[currentLanguage];

    const onBackHome = () => {
      setParams(new URLSearchParams(), { replace: true });
      setCurrent(book?.id.toString(), "");
      window.location.reload();
    };

    const filteredChapters = book?.chapters?.filter(ch =>
      ch.title.toLowerCase().includes(query.toLowerCase())
    );

    const handleLanguageChange = (lang: Language) => {
      setCurrentLanguage(lang);
      setIsLanguageDropdownOpen(false);
    };

    return (
      <aside className="w-full relative md:w-80 md:flex-none border-r border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-6 h-full overflow-hidden flex flex-col">
        
        {/* Mobile Header */}
        <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b border-[rgb(var(--border))]">
          <span className="flex flex-col hover:bg-black/15 px-2 py-2 rounded-md cursor-default" onClick={onBackHome}>
            <h2 className="text-2xl font-bold text-[rgb(var(--text))]">{book?.title}</h2>
            {book?.author && <p className="m-0 text-sm text-[rgb(var(--muted))]">{book?.author}</p>}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1.5 text-sm transition-colors hover:bg-[rgb(var(--border))] text-[rgb(var(--text))]"
            aria-label={t.closeMenu}
          >
            ✕
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block mb-6 cursor-pointer" onClick={onBackHome}>
          <h2 className="m-0 text-xl font-bold text-[rgb(var(--text))] mb-1">{book?.title}</h2>
          {book?.author && <p className="m-0 text-sm text-[rgb(var(--muted))]">{book?.author}</p>}
        </div>

        {/* Search Box and Language Switcher */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--input))] text-[rgb(var(--text))] placeholder-[rgb(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))]"
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]" />
          </div>
          
          {/* Language Switcher Button */}
          <div className="relative">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--input))] text-[rgb(var(--text))] hover:border-[rgb(var(--accent))] hover:bg-[rgb(var(--card-hover))] transition-all duration-200"
              aria-label="Switch language"
            >
              <Globe size={20} />
            </button>

            {/* Language Dropdown Menu */}
            {isLanguageDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-lg z-30 min-w-[140px]">
                <div className="p-2">
                  {Object.entries(languageOptions).map(([code, { name, flag }]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code as Language)}
                      className={`w-full text-left px-3 py-2 rounded-md transition-all duration-200 flex items-center gap-2 my-1 ${
                        currentLanguage === code
                          ? "bg-[rgb(var(--accent))] text-[rgb(var(--bg))]"
                          : "text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]"
                      }`}
                    >
                      <span className="text-base">{flag}</span>
                      <span className="font-medium text-sm">{name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chapter Count */}
        <h3 className="my-2 text-base font-semibold text-[rgb(var(--text))]">
          {t.totalChapters(filteredChapters?.length)}
        </h3>

        {/* Chapter List with clickable chapters */}
        <div className="flex-1 overflow-auto">
          {filteredChapters?.map((ch, idx) => (
            <div key={ch.id} className="mb-2 m-2">
              <button
                onClick={() => {
                  onOpenChapter(ch.id.toString()); 
                  setOpenChapterId(openChapterId === String(ch.id) ? null : String(ch.id));
                }}
                className={`w-full flex justify-between items-center px-3 py-2 rounded-lg border text-left text-[rgb(var(--text))] bg-[rgb(var(--input))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent))] ${
                  currentChapterId === String(ch.id) ? 'bg-[rgb(var(--accent))] text-white' : ''
                }`}
              >
                <span>{t.chapter(idx + 1)}: {ch.title}</span>
                {openChapterId === String(ch.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {openChapterId === String(ch.id) && (
                <div className="pl-4 mt-1 text-sm text-[rgb(var(--muted))]">
                  {ch.subtitle || t.noAdditionalInfo}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-[rgb(var(--border))]">
          <ThemeSwitcher />
          <FontSizeController />
        </div>
      </aside>
    );
  }