import { Check, Copy } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { BundledLanguage, BundledTheme } from 'shiki';
import Button from '@/components/ui/Button';

interface CodeBlockProps {
  code: string;
  language?: string;
  theme: 'light' | 'dark';
}

const FALLBACK_LANGUAGE = 'text' as BundledLanguage;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export default function CodeBlock({ code, language, theme }: CodeBlockProps) {
  const [html, setHtml] = useState('');
  const [copied, setCopied] = useState(false);

  const normalizedLanguage = useMemo(() => {
    if (!language) {
      return FALLBACK_LANGUAGE;
    }

    return language.toLowerCase().trim() as BundledLanguage;
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    const activeTheme: BundledTheme = theme === 'dark' ? 'vitesse-dark' : 'vitesse-light';

    setHtml('');

    import('shiki')
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: normalizedLanguage,
          theme: activeTheme,
        }),
      )
      .then((value) => {
        if (!cancelled) {
          setHtml(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHtml(
            `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`,
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, normalizedLanguage, theme]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="overflow-hidden rounded-xl bg-surface-sunken shadow-sm">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-2 text-xs text-subtle">
        <span>{language || 'text'}</span>
        <Button
          className="size-auto gap-1 rounded-full px-3 py-1 text-xs"
          onClick={handleCopy}
          variant="ghost"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? '已复制' : '复制代码'}
        </Button>
      </div>

      <div
        className="shiki-code text-sm font-mono leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
