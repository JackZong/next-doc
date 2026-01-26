'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body prose prose-invert prose-zinc max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义组件渲染
          h1: ({ ...props }) => <h1 className="text-4xl font-extrabold mt-12 mb-6 border-b border-zinc-800/50 pb-4 text-foreground tracking-tight" {...props} />,
          h2: ({ ...props }) => <h2 className="text-3xl font-bold mt-10 mb-5 border-b border-zinc-800/30 pb-2 text-foreground/90 tracking-tight" {...props} />,
          h3: ({ ...props }) => <h3 className="text-2xl font-semibold mt-8 mb-4 text-foreground/85" {...props} />,
          h4: ({ ...props }) => <h4 className="text-xl font-semibold mt-6 mb-3 text-foreground/80" {...props} />,
          p: ({ ...props }) => <p className="leading-8 mb-6 text-foreground/90 text-[16px]" {...props} />,
          ul: ({ ...props }) => <ul className="list-disc list-outside mb-6 ml-6 space-y-2 text-foreground/80" {...props} />,
          ol: ({ ...props }) => <ol className="list-decimal list-outside mb-6 ml-6 space-y-2 text-foreground/80" {...props} />,
          li: ({ ...props }) => <li className="pl-1" {...props} />,
          code: ({ className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !className?.includes('language-');
            return !inline ? (
              <div className="relative group my-8 overflow-hidden rounded-xl bg-zinc-950/40 border border-zinc-800/50 shadow-2xl shadow-zinc-900/20">
                <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/50">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{match ? match[1] : 'code'}</span>
                  <button className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">Copy</button>
                </div>
                <pre className="overflow-auto p-5 font-mono text-[13.5px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800/50">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-zinc-800/60 px-1.5 py-0.5 rounded-md text-zinc-200 text-[13px] font-mono border border-zinc-700/50 mx-0.5" {...props}>
                {children}
              </code>
            );
          },
          blockquote: ({ ...props }) => (
            <blockquote className="border-l-4 border-primary/40 pl-5 py-2 my-8 italic text-foreground/70 bg-primary/5 rounded-r-lg" {...props} />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-8 rounded-lg border border-zinc-800">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: ({ ...props }) => <th className="bg-zinc-900/80 px-4 py-3 text-left font-bold text-zinc-200 border-b border-zinc-800" {...props} />,
          td: ({ ...props }) => <td className="px-4 py-3 text-foreground/80 border-b border-zinc-800/50 last:border-b-0" {...props} />,
          a: ({ ...props }) => <a className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all font-medium" {...props} />,
          img: ({ ...props }) => (
            <div className="my-10 flex flex-col items-center">
              <img className="rounded-2xl border border-zinc-800/50 shadow-2xl transition-transform hover:scale-[1.01]" alt={props.alt || ''} {...props} />
              {props.alt && <span className="mt-3 text-xs text-zinc-500 italic">{props.alt}</span>}
            </div>
          ),
          hr: () => <hr className="my-12 border-zinc-800/50" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
