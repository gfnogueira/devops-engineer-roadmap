/**
 * Minimal, line-based Markdown inspection for the curriculum's own documents.
 *
 * It recognizes ATX headings (`#` to `######`), inline links and images, fenced code blocks,
 * and inline code spans. It is not a CommonMark parser and does not claim to reproduce the
 * anchors of GitHub or any other renderer. Setext headings, reference-style links, raw HTML,
 * and links that wrap across lines are not recognized. docs/curriculum-contract.md lists the
 * known limitations and which of them can hide or invent a problem.
 */

export interface MarkdownLink {
  /** Link destination exactly as written, without surrounding angle brackets or a title. */
  target: string;
  /** 1-based line number. */
  line: number;
}

export interface MarkdownDocument {
  /** Anchor to the 1-based lines of every heading that produces it, in document order. */
  anchors: Map<string, number[]>;
  links: MarkdownLink[];
  /**
   * 1-based line of a fenced code block that is opened but never closed. Everything after
   * that line was skipped, so callers should treat the document as incompletely inspected.
   */
  unclosedFence: number | undefined;
}

// A backtick fence may not have a backtick in its info string; such a line is ordinary text.
const FENCE = /^ {0,3}(`{3,}(?!.*`)|~{3,})/;
const HEADING = /^ {0,3}#{1,6}(?:[ \t]+(.*))?$/;
const INLINE_CODE = /(?<!`)(`+)(?!`).*?(?<!`)\1(?!`)/g;
const INLINE_LINK =
  /\[(?:[^\[\]]|\[[^\[\]]*\])*\]\(\s*(<[^<>]*>|[^\s()]*(?:\([^\s()]*\)[^\s()]*)*)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;

/**
 * Derive the anchor for a heading's text: lowercase; drop everything except letters, marks,
 * digits, `_`, `-`, and spaces; then turn each space or tab into `-`. Runs are not collapsed,
 * so `A & B` becomes `a--b`. Repeated headings receive the same anchor and no numeric suffix.
 */
export function headingAnchor(text: string): string {
  return text
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_\- \t]/gu, '')
    .replace(/[ \t]/g, '-');
}

export function parseMarkdown(source: string): MarkdownDocument {
  const anchors = new Map<string, number[]>();
  const links: MarkdownLink[] = [];
  let fence: string | undefined;
  let fenceLine: number | undefined;

  source.split(/\r?\n/).forEach((text, index) => {
    const line = index + 1;
    const marker = FENCE.exec(text)?.[1];
    if (fence !== undefined) {
      // A closing fence uses the same character, is at least as long, and carries no info text.
      const closes = marker !== undefined && marker[0] === fence[0]
        && marker.length >= fence.length
        && text.trim() === marker;
      if (closes) fence = undefined;
      return;
    }
    if (marker !== undefined) {
      fence = marker;
      fenceLine = line;
      return;
    }

    const heading = HEADING.exec(text);
    if (heading !== null) {
      const anchor = headingAnchor((heading[1] ?? '').replace(/(?:^|[ \t]+)#+[ \t]*$/, ''));
      if (anchor !== '') anchors.set(anchor, [...(anchors.get(anchor) ?? []), line]);
    }

    // Blank out code spans, keeping columns, so example links inside them are not checked.
    const prose = text.replace(INLINE_CODE, (span) => ' '.repeat(span.length));
    for (const match of prose.matchAll(INLINE_LINK)) {
      const raw = match[1] ?? '';
      links.push({ target: raw.startsWith('<') ? raw.slice(1, -1) : raw, line });
    }
  });
  return { anchors, links, unclosedFence: fence === undefined ? undefined : fenceLine };
}
