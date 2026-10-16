import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface SpecMarkdownProps {
  content: string;
}

// Each Markdown element drawn with the project's tokens (there is no typography plugin). Only
// `children` and the few props an element needs are passed on: react-markdown also hands every
// component a `node`, which must not reach the DOM.
const components: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 border-b border-surface-border pb-2 text-xl font-semibold text-copy-primary first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-6 mb-2 text-lg font-semibold text-copy-primary first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-5 mb-2 text-[1rem] font-semibold text-copy-primary first:mt-0">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-4 mb-1 text-sm font-semibold text-copy-primary first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-3 text-sm leading-relaxed text-copy-secondary first:mt-0">{children}</p>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children, start }) => (
    <ol start={start} className="my-3 list-decimal space-y-1 pl-5">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed text-copy-secondary marker:text-copy-muted [&>ol]:my-1 [&>ul]:my-1">
      {children}
    </li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-brand underline underline-offset-2 hover:text-copy-primary"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold text-copy-primary">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-surface-border-subtle pl-4 text-copy-muted">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-6 border-surface-border" />,
  // Inline code. A fenced block is a `code` inside a `pre`, and the `pre` resets what it needs.
  code: ({ children, className }) => (
    <code
      className={cn(
        "rounded-md bg-subtle px-1.5 py-0.5 font-mono text-[0.85em] text-copy-primary",
        className
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-2xl border border-surface-border bg-base p-4 font-mono text-xs leading-relaxed text-copy-primary [&_code]:rounded-none [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em]">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-2xl border border-surface-border">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  // Alignment arrives as an inline `style` (from the `:--:` markers); the header row has no
  // border of its own because the first body row's top border is the divider.
  th: ({ children, style }) => (
    <th style={style} className="bg-elevated px-3 py-2 font-medium text-copy-primary">
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td
      style={style}
      className="border-t border-surface-border px-3 py-2 align-top text-copy-secondary"
    >
      {children}
    </td>
  ),
};

// A spec's Markdown as formatted text, with GitHub-flavored extras (tables, task lists, strikethrough).
// react-markdown builds React elements and does not render raw HTML, so the text, which a model
// wrote from user-authored labels and chat, cannot inject markup. Images are dropped as well: one
// would make every collaborator who previews the spec fetch whatever URL the text names.
export function SpecMarkdown({ content }: SpecMarkdownProps) {
  return (
    <div className="min-w-0 wrap-break-word">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={["img"]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
