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
  console.log("ReaderContent - Content length:", content.length, "Font size:", fontSize);
  
  if (isRefetching) {
    return <LoadingModal isLoading={isRefetching} />;
  }

  if (!content || content.length === 0) {
    return (
      <article className="mx-auto max-w-3xl text-center py-10">
        <div className="text-muted-foreground">
          <p>No content to display.</p>
          <p className="text-sm mt-2">This chapter might be empty.</p>
        </div>
      </article>
    );
  }

  // Parse HTML content safely
  const parseHTMLContent = (html: string) => {
    try {
      // Remove script tags for security
      const sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Create a temporary div to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = sanitized;
      
      // Get text content while preserving some formatting
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Replace multiple spaces with single space
      return textContent.replace(/\s+/g, ' ').trim();
    } catch (error) {
      console.error("Error parsing HTML content:", error);
      // Return raw text if parsing fails
      return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  };

  return (
    <article
      className="mx-auto max-w-3xl text-[1.05rem] sm:text-lg leading-relaxed whitespace-pre-line"
      style={{
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}
    >
      {content.map((segment, i) => {
        console.log(`Segment ${i} length:`, segment.length);
        
        // Parse HTML content to plain text
        const plainText = parseHTMLContent(segment);
        
        // Split into lines
        const lines = plainText.split('\n').filter(Boolean);

        if (lines.length === 0) {
          return (
            <div key={i} className="mb-5">
              <p
                className="text-[rgb(var(--text))] mb-2"
                style={{
                  fontSize: `${fontSize}px`,
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.75rem",
                }}
              >
                &nbsp;
              </p>
            </div>
          );
        }

        return (
          <div key={i} className="mb-5">
            {lines.map((line, j) => {
              const trimmedLine = line.trim();
              if (!trimmedLine) return null;

              const isTitle =
                /^\d+\.\s|^Security Note|^Role-Based Permission/i.test(trimmedLine);
              const isCode =
                /^\s*(const|let|enum|export|function|router\.|req\.|res\.|jwt\.|mongoose|type\s)/.test(
                  trimmedLine
                );

              if (isTitle) {
                return (
                  <h2
                    key={j}
                    className="font-semibold text-lg text-[rgb(var(--text))] mt-4 mb-2"
                    style={{ fontSize: `${fontSize + 2}px` }}
                  >
                    {trimmedLine}
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
                    {trimmedLine}
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
                    textAlign: "justify",
                  }}
                >
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        );
      })}
    </article>
  );
}