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
  // const parseHTMLContent = (html: string) => {
  //   try {
  //     // Remove script tags for security
  //     const sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
  //     // Create a temporary div to parse HTML
  //     const tempDiv = document.createElement('div');
  //     tempDiv.innerHTML = sanitized;
      
  //     // Get text content while preserving some formatting
  //     const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
  //     // Replace multiple spaces with single space
  //     return textContent.replace(/\s+/g, ' ').trim();
  //   } catch (error) {
  //     console.error("Error parsing HTML content:", error);
  //     // Return raw text if parsing fails
  //     return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  //   }
  // };

  return (

    // No Convet Html to text and Image and There is a starting line
      <article className="mx-auto max-w-4xl prose prose-img:max-w-full prose-img:h-auto max-w-none"style={{
         fontSize: `${fontSize}px`,
         wordBreak: "break-word",
         textIndent: "2rem", // បន្ថែម indentation សម្រាប់ paragraph
         }}
      >

        {content.map((html, index) => (
       <div key={index} 
         dangerouslySetInnerHTML={{
         __html: html.replace(
         /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"" ), }}
       />
      ))}
    </article>

  );
}