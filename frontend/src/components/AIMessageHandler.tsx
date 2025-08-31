import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type MarkdownRendererProps = {
  rawMarkdown: string;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ rawMarkdown }) => {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-semibold mt-2 mb-1" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 space-y-1" {...props} />
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline ? (
              <SyntaxHighlighter
                style={oneDark}
                language={match ? match[1] : "plaintext"}
                PreTag="div"
                className="rounded-lg p-3 my-2"
                {...(props as any)}
              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-200 px-1 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {rawMarkdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
