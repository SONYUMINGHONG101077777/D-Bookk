import { useSearchParams } from "react-router-dom";
import type { TBook } from "../lib/api";
import { toKhmerNumber } from "../utils/toKhmerNumber";
import FontSizeController from "./FontSizeController";
import ThemeSwitcher from "./ThemeSwitcher";
import { useReaderStore } from "../store/readerStore";
import { useState, useMemo } from "react";
import { Search, Globe } from "lucide-react";
import Select from "react-select";

type Props = {
  book: TBook;
  currentChapterId: string | null;
  onOpenChapter: (chapterId: string) => void;
  onClose?: () => void;
};

type Language = "kh" | "eng" | "ch";

const languageOptions: { value: Language; label: string; flag: string }[] = [
  { value: "kh", label: "ខ្មែរ", flag: "/flags/kh.png" },
  { value: "eng", label: "English", flag: "/flags/gb.png" },
  { value: "ch", label: "中文", flag: "/flags/cn.png" },
];

const translations = {
  kh: {
    closeMenu: "បិទម៉ឺនុយ",
    searchPlaceholder: "ស្វែងរកជំពូក...",
    totalChapters: (count: number) => `ទាំងអស់មាន ${toKhmerNumber(count)} ជំពូក`,
    selectChapter: "ជ្រើសជំពូក",
    noSubtitle: "គ្មានព័ត៌មានបន្ថែម",
  },
  eng: {
    closeMenu: "Close menu",
    searchPlaceholder: "Search chapters...",
    totalChapters: (count: number) => `Total ${count} chapters`,
    selectChapter: "Select chapter",
    noSubtitle: "No additional information",
  },
  ch: {
    closeMenu: "关闭菜单",
    searchPlaceholder: "搜索章节...",
    totalChapters: (count: number) => `共有 ${count} 章`,
    selectChapter: "选择章节",
    noSubtitle: "无附加信息",
  },
};

export default function TOC({ book, currentChapterId, onOpenChapter, onClose }: Props) {
  const setParams = useSearchParams()[1];
  const setCurrent = useReaderStore((s) => s.setCurrent);

  const [query, setQuery] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState<Language>("kh");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState(false);

  const t = translations[currentLanguage];

  const onBackHome = () => {
    setParams(new URLSearchParams(), { replace: true });
    setCurrent(book?.id.toString(), "");
    window.location.reload();
  };

  const filteredChapters = useMemo(
    () =>
      book?.chapters?.filter((ch) =>
        ch.title.toLowerCase().includes(query.toLowerCase())
      ),
    [book, query]
  );

  const selectedChapter = filteredChapters?.find(
    (ch) => String(ch.id) === currentChapterId
  );

  const chapterOptions = filteredChapters?.map((ch, idx) => ({
    value: ch.id,
    label:
      currentLanguage === "kh"
        ? `ជំពូក ${toKhmerNumber(idx + 1)}: ${ch.title}`
        : currentLanguage === "eng"
        ? `Chapter ${idx + 1}: ${ch.title}`
        : `第${idx + 1}章 ${ch.title}`,
  }));

  return (
    <aside className="w-full relative md:w-80 border-r bg-[rgb(var(--card))] p-4 sm:p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between md:hidden pb-4 border-b">
        <span
          className="flex flex-col hover:bg-black/15 px-2 py-2 rounded-md cursor-pointer overflow-hidden"
          onClick={onBackHome}
        >
          <h2 className="text-2xl font-bold truncate">{book?.title}</h2>
          {book?.author && (
            <p className="text-sm text-[rgb(var(--muted))] truncate">{book?.author}</p>
          )}
        </span>
        <button
          onClick={onClose}
          className="rounded-lg border px-2.5 py-1.5 text-sm"
        >
          ✕
        </button>
      </div>

      {/* Search + Language */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-10 pr-3 py-2 rounded-lg border bg-[rgb(var(--input))] truncate"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))]"
            size={20}
          />
        </div>

        {/* Language dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center justify-center w-12 h-10 rounded-lg border gap-1 px-1"
          >
            <img
              src={languageOptions.find((l) => l.value === currentLanguage)?.flag}
              alt={currentLanguage}
              className="w-5 h-4 object-contain"
            />
          </button>

          {isLanguageDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 bg-[rgb(var(--card))] border rounded-lg shadow z-30">
              {languageOptions.map(({ value, label, flag }) => (
                <button
                  key={value}
                  onClick={() => {
                    setCurrentLanguage(value);
                    setIsLanguageDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[rgb(var(--border))] overflow-hidden"
                >
                  <img src={flag} alt={value} className="w-5 h-4 flex-shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Total chapters */}
      <h3 className="my-2 text-base font-semibold truncate">
        {t.totalChapters(filteredChapters?.length || 0)}
      </h3>

      {/* Chapter select */}
      <Select
        options={chapterOptions}
        value={chapterOptions?.find((opt) => opt.value === Number(currentChapterId)) || null}
        onChange={(opt: any) => onOpenChapter(String(opt.value))}
        placeholder={t.selectChapter}
        isSearchable={false}
        menuIsOpen={
          query.length > 0 && chapterOptions && chapterOptions.length > 0
            ? true
            : isChapterDropdownOpen
        }
        onMenuOpen={() => setIsChapterDropdownOpen(true)}
        onMenuClose={() => setIsChapterDropdownOpen(false)}
        className="mt-2"
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: "rgb(var(--input))",
            borderColor: "rgb(var(--border))",
            borderRadius: "0.5rem",
            padding: "0.25rem",
            minHeight: "2.5rem",
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? "rgb(var(--border))" : "rgb(var(--input))",
            color: "rgb(var(--text))",
            cursor: "pointer",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }),
          singleValue: (base) => ({
            ...base,
            color: "rgb(var(--text))",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }),
          placeholder: (base) => ({ ...base, color: "rgb(var(--muted))" }),
        }}
      />

      {/* Subtitle */}
      {currentChapterId && (
        <div className="mt-4 p-3 rounded-lg bg-[rgb(var(--input))] text-sm text-[rgb(var(--muted))] truncate">
          {selectedChapter?.subtitle || t.noSubtitle}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col gap-3 mt-6 pt-4 border-t">
        <ThemeSwitcher />
        <FontSizeController />
      </div>
    </aside>
    
  );
}
