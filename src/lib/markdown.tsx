import type { ReactNode } from "react";

/**
 * Parse a SMALL, SAFE subset of markdown into real React elements.
 *
 * Supported inline: **bold** and _italic_.
 * Supported block:  lines starting with "- " become bullet items,
 *                   blank lines become vertical spacing.
 *
 * Everything is rendered as React children (never as raw HTML / never with
 * dangerouslySetInnerHTML), so the source text is automatically escaped and
 * cannot inject markup or scripts.
 */

/** Tokenize a single line into bold / italic / plain runs. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Match **bold** or _italic_ (non-greedy, no nesting).
  const regex = /(\*\*([^*]+?)\*\*|_([^_]+?)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyPrefix}-b-${i}`}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={`${keyPrefix}-i-${i}`}>{match[3]}</em>);
    }
    lastIndex = regex.lastIndex;
    i += 1;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function renderMarkdown(text: string): ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    if (line.startsWith("- ")) {
      return (
        <div key={i} className="flex gap-2 pl-1">
          <span className="text-brand-500 mt-0.5">•</span>
          <span>{renderInline(line.slice(2), `l${i}`)}</span>
        </div>
      );
    }
    return <p key={i}>{renderInline(line, `l${i}`)}</p>;
  });
}
