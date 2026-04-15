import GithubSlugger from 'github-slugger';
import type { ReactNode } from 'react';
import { isValidElement } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/markdown/CodeBlock';
import { extractTextFromNode, parseEmbedDirective } from '@/lib/markdown';

interface MarkdownArticleProps {
  content: string;
  theme: 'light' | 'dark';
}

function EmbeddedVideo({ type, id }: { type: 'youtube' | 'bilibili'; id: string }) {
  const src =
    type === 'youtube'
      ? `https://www.youtube.com/embed/${id}`
      : `https://player.bilibili.com/player.html?bvid=${id}&page=1`;

  return (
    <div className="overflow-hidden rounded-xl bg-surface-raised shadow-sm">
      <div className="aspect-video w-full">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          src={src}
          title={`${type}-${id}`}
        />
      </div>
    </div>
  );
}

export default function MarkdownArticle({ content, theme }: MarkdownArticleProps) {
  const slugger = new GithubSlugger();

  const renderHeading = (level: 2 | 3 | 4, children: ReactNode, className: string) => {
    const text = extractTextFromNode(children);
    const id = slugger.slug(text);
    const Tag = `h${level}` as const;

    return (
      <Tag className={className} id={id}>
        {children}
      </Tag>
    );
  };

  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) =>
          renderHeading(2, children, 'mt-10 mb-4 text-2xl font-heading font-bold text-foreground'),
        h3: ({ children }) =>
          renderHeading(3, children, 'mt-8 mb-4 text-xl font-heading font-semibold text-foreground'),
        h4: ({ children }) =>
          renderHeading(4, children, 'mt-6 mb-3 text-lg font-semibold text-foreground'),
        p: ({ children }) => {
          const text = extractTextFromNode(children).trim();
          const embed = parseEmbedDirective(text);

          if (embed) {
            return <EmbeddedVideo id={embed.id} type={embed.type} />;
          }

          return <p className="text-base leading-relaxed text-muted">{children}</p>;
        },
        a: ({ children, href }) => (
          <a
            className="font-medium text-primary underline underline-offset-4 hover:text-primary-light"
            href={href}
            rel="noreferrer"
            target={href?.startsWith('http') ? '_blank' : undefined}
          >
            {children}
          </a>
        ),
        ul: ({ children }) => (
          <ul className="list-disc space-y-3 pl-6 text-base leading-relaxed text-muted">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal space-y-3 pl-6 text-base leading-relaxed text-muted">{children}</ol>
        ),
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary bg-primary/5 px-5 py-4 text-base italic text-muted">
            {children}
          </blockquote>
        ),
        hr: () => <hr className="border-t border-border" />,
        table: ({ children }) => (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[560px] text-left text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-surface-sunken text-xs font-medium uppercase tracking-wider text-muted">
            {children}
          </thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => (
          <tr className="even:bg-surface-sunken/50 transition-colors duration-150 hover:bg-surface-sunken">
            {children}
          </tr>
        ),
        th: ({ children }) => <th className="px-4 py-3">{children}</th>,
        td: ({ children }) => <td className="px-4 py-3 text-foreground">{children}</td>,
        img: ({ alt, src }) => (
          <img
            alt={alt || ''}
            className="w-full rounded-xl object-cover shadow-sm"
            referrerPolicy="no-referrer"
            src={src}
          />
        ),
        pre: ({ children }) => {
          const child = Array.isArray(children) ? children[0] : children;

          if (
            isValidElement<{ className?: string; children?: ReactNode }>(child) &&
            typeof child.props.children === 'string'
          ) {
            const matched = child.props.className?.match(/language-([\w-]+)/);
            return (
              <CodeBlock
                code={child.props.children.replace(/\n$/, '')}
                language={matched?.[1]}
                theme={theme}
              />
            );
          }

          return <pre className="overflow-x-auto rounded-xl bg-surface-sunken p-4">{children}</pre>;
        },
        code: ({ children, className }) => {
          if (className?.startsWith('language-')) {
            return <>{children}</>;
          }

          return (
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-sm text-foreground">
              {children}
            </code>
          );
        },
      }}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  );
}
