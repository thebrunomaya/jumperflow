/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * LogViewer - Renders Markdown content as formatted HTML
 * Used in Step 2 (Log da Otimização) to display structured optimization log
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface LogViewerProps {
  content: string;
}

export function LogViewer({ content }: LogViewerProps) {
  if (!content || content.trim().length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum log disponível ainda
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold mb-3 mt-6 text-foreground" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-semibold mb-2 mt-5 text-foreground" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-semibold mb-2 mt-4 text-foreground" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-sm font-semibold mb-1 mt-3 text-foreground" {...props} />
          ),

          // Paragraphs
          p: ({ node, ...props }) => (
            <p className="mb-3 text-foreground leading-relaxed" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-foreground" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-foreground" {...props} />
          ),

          // Em/Italic
          em: ({ node, ...props }) => (
            <em className="italic text-foreground" {...props} />
          ),

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-primary hover:text-primary/80 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Code blocks
          code: ({ node, inline, ...props }: any) => {
            return inline ? (
              <code
                className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono"
                {...props}
              />
            ) : (
              <code
                className="block p-3 bg-muted rounded-md text-sm font-mono overflow-x-auto"
                {...props}
              />
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-primary pl-4 py-2 my-3 italic text-muted-foreground"
              {...props}
            />
          ),

          // Horizontal rules
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
