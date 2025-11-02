import LoadingModal from "./shared/LoadingModal";

type ReaderContentProps = {
  content: string[];
  fontSize?: number;
  isRefetching?: boolean;
};

export default function ReaderContent({
  content,
  fontSize = 16,
  isRefetching = false,
}: ReaderContentProps) {
  return (
    <article
      className="mx-auto max-w-3xl text-[1.05rem] sm:text-lg leading-relaxed whitespace-pre-line"
      style={{
        wordBreak: "break-word",
        overflowWrap: "anywhere" as any,
      }}
    >
      {isRefetching && <LoadingModal isLoading={isRefetching} />}

      {content.map((segment, i) => {
        const formatted = segment
          .replace(/\\r\\n/g, "\n")
          .replace(/\r\n/g, "\n")
          .replace(/\\n/g, "\n");

        const lines = formatted.split("\n").filter(Boolean);

        return (
          <div key={i} className="mb-5">
            {lines.map((line, j) => {
              const isTitle =
                /^\d+\.\s|^Security Note|^Role\-Based Permission/i.test(line);
              const isCode =
                /^\s*(const|let|enum|export|function|router\.|req\.|res\.|jwt\.|mongoose|type\s)/.test(
                  line
                );

              if (isTitle) {
                return (
                  <h2
                    key={j}
                    className="font-semibold text-lg text-[rgb(var(--text))] mt-4 mb-2"
                    style={{ fontSize: `${fontSize + 2}px` }}
                  >
                    {line}
                  </h2>
                );
              }

              if (isCode) {
                return (
                  <pre
                    key={j}
                    className="bg-slate-800/10 font-mono text-sm px-3 py-2 rounded mb-2 overflow-x-auto"
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: `${fontSize - 2}px`,
                    }}
                  >
                    {line}
                  </pre>
                );
              }

              return (
                <p
                  key={j}
                  className="text-[rgb(var(--text))] mb-2"
                  style={{
                    fontSize: `${fontSize}px`,
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.75rem",
                  }}
                >
                  {line}
                </p>
              );
            })}
          </div>
        );
      })}
    </article>
  );
}
