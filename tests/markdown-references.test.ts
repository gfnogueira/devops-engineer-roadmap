import { describe, expect, it } from 'vitest';
import { headingAnchor, parseMarkdown } from '../scripts/markdown-references.js';

describe('heading anchors', () => {
  it.each([
    ['Learning Objectives', 'learning-objectives'],
    ['COMPLETION Criteria', 'completion-criteria'],
    ['  Padded heading  ', 'padded-heading'],
    ['Tabs\tand  double spaces', 'tabs-and--double-spaces'],
    ['1. Establish an isolated workspace', '1-establish-an-isolated-workspace'],
    ['2026', '2026'],
    ['Build: decide what belongs, and why?', 'build-decide-what-belongs-and-why'],
    ['Copy & verify', 'copy--verify'],
    ['Action 1 — verify', 'action-1--verify'],
    ['Inspect `git status` output', 'inspect-git-status-output'],
    ['Keep snake_case and kebab-case', 'keep-snake_case-and-kebab-case'],
    ['See [the guide](../guide.md#part) first', 'see-the-guide-first'],
    ['Résumé über Ångström', 'résumé-über-ångström'],
    ['!?…', ''],
  ])('derives %j as %j', (text, anchor) => {
    expect(headingAnchor(text)).toBe(anchor);
  });
});

describe('Markdown inspection', () => {
  it('records every ATX heading level with its line, ignoring closing markers', () => {
    const { anchors } = parseMarkdown('# One\n## Two ##\n###### Six\n   ### Indented\n#\n####### Seven\n#NoSpace\n');
    expect([...anchors]).toEqual([['one', [1]], ['two', [2]], ['six', [3]], ['indented', [4]]]);
  });

  it('gives repeated headings the same anchor instead of inventing numeric suffixes', () => {
    const { anchors } = parseMarkdown('## Cleanup\n\ntext\n\n### Cleanup\n\n## cleanup!\n');
    expect([...anchors]).toEqual([['cleanup', [1, 5, 7]]]);
    expect(anchors.has('cleanup-1')).toBe(false);
  });

  it('ignores headings and links inside backtick and tilde fences', () => {
    const { anchors, links } = parseMarkdown([
      '## Before', '```sh', '# a shell comment', '[x](missing.md)', '~~~', '```',
      '~~~~', '## Hidden', '```', '~~~', '[y](other.md)', '~~~~~', '## After',
    ].join('\n'));
    expect([...anchors.keys()]).toEqual(['before', 'after']);
    expect(links).toEqual([]);
  });

  it('reports the opening line of an unclosed fence and skips the text after it', () => {
    const { anchors, links, unclosedFence } = parseMarkdown('## Shown\n```sh\n## Hidden\n[x](hidden.md)\n');
    expect([...anchors.keys()]).toEqual(['shown']);
    expect(links).toEqual([]);
    expect(unclosedFence).toBe(2);
  });

  it('does not treat a backtick line with a backtick in its info string as a fence', () => {
    const source = [
      '``` a`b', '## Shown one', '[one](one.md)',
      '```code```', '## Shown two', '[two](two.md)',
      '```` js `x` ````', '[three](three.md)',
    ].join('\n');
    const { anchors, links, unclosedFence } = parseMarkdown(source);
    expect([...anchors.keys()]).toEqual(['shown-one', 'shown-two']);
    expect(links.map(({ target }) => target)).toEqual(['one.md', 'two.md', 'three.md']);
    expect(unclosedFence).toBeUndefined();
  });

  it('still opens backtick fences with a plain info string and tilde fences with any info string', () => {
    const { anchors, links, unclosedFence } = parseMarkdown([
      '```sh title="x"', '## Hidden', '[a](a.md)', '```',
      '~~~ a`b ~ c', '## Hidden too', '[b](b.md)', '~~~',
      '   ````', '[c](c.md)', '   ````',
      '## Shown',
    ].join('\n'));
    expect([...anchors.keys()]).toEqual(['shown']);
    expect(links).toEqual([]);
    expect(unclosedFence).toBeUndefined();
  });

  it('does not let an invalid opening line close or reopen a real fence', () => {
    const { anchors, unclosedFence } = parseMarkdown('```\n``` a`b\n## Hidden\n```\n## Shown\n');
    expect([...anchors.keys()]).toEqual(['shown']);
    expect(unclosedFence).toBeUndefined();
  });

  it.each([
    ['a document without fences', '## A\n[x](y.md)\n'],
    ['closed backtick and tilde fences', '```\ncode\n```\n~~~\ncode\n~~~\n'],
    ['a longer closing fence', '```\ncode\n`````\n'],
    ['a fence closed on the last line without a newline', '```\ncode\n```'],
    ['fence markers of the other kind inside a block', '~~~\n```\n~~~\n'],
  ])('reports no unclosed fence for %s', (_name, source) => {
    expect(parseMarkdown(source).unclosedFence).toBeUndefined();
  });

  it.each([
    ['a tilde fence closed with backticks', '~~~\ncode\n```\n', 1],
    ['a fence closed with a shorter marker', 'text\n````\ncode\n```\n', 2],
    ['a second fence left open after a closed one', '```\na\n```\ntext\n```\nb\n', 5],
  ])('reports an unclosed fence for %s', (_name, source, line) => {
    expect(parseMarkdown(source).unclosedFence).toBe(line);
  });

  it('does not close a fence with a shorter marker or a marker followed by text', () => {
    const { anchors } = parseMarkdown('````\n```\n## Hidden\n```` not a close\n## Still hidden\n````\n## Shown\n');
    expect([...anchors.keys()]).toEqual(['shown']);
  });

  it('extracts inline links and images with line numbers', () => {
    const { links } = parseMarkdown([
      'See [one](a.md) and [two](b.md#part "Title").',
      '![diagram](assets/d.png) and [angle](<c d.md>)',
      '[text with [brackets]](e.md) [wiki](https://example.invalid/a_(b))',
      '[same file](#section) [empty]()',
    ].join('\r\n'));
    expect(links).toEqual([
      { target: 'a.md', line: 1 }, { target: 'b.md#part', line: 1 },
      { target: 'assets/d.png', line: 2 }, { target: 'c d.md', line: 2 },
      { target: 'e.md', line: 3 }, { target: 'https://example.invalid/a_(b)', line: 3 },
      { target: '#section', line: 4 }, { target: '', line: 4 },
    ]);
  });

  it('ignores example links in inline code but keeps links whose text is code', () => {
    const { links } = parseMarkdown('Write `[text](example.md)` or ``[a](`b`.md)``; see [`cmd`](real.md).\n');
    expect(links).toEqual([{ target: 'real.md', line: 1 }]);
  });

  it('returns equal results for repeated calls on the same text', () => {
    const source = '## A\n[x](y.md)\n## A\n';
    expect(parseMarkdown(source)).toEqual(parseMarkdown(source));
  });
});
