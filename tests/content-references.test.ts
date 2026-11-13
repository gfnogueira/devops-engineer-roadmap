import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateContentReferences } from '../scripts/validate-content-references.js';
import { competency, MODULE, workspace } from './support/workspace.js';

const catalog = (...ids: string[]) => ({ competencies: ids.map((id) => competency(id)) });

function contentErrors(input: ReturnType<typeof catalog>, root: string) {
  const result = validateContentReferences(input, root);
  if (result.valid) throw new Error('Expected content diagnostics');
  return result.errors;
}

/** One module `a` plus a page whose body is the links under test. */
function withPage(body: string, extra: Record<string, string> = {}) {
  return workspace({ 'docs/modules/a.md': MODULE, 'docs/page.md': body, ...extra });
}

describe('valid content references', () => {
  it('accepts resolved modules, links, and anchors, and counts what it checked', () => {
    const root = workspace({
      'docs/modules/a.md': `${MODULE}\n[b](nested/b.md#completion-criteria) [top](#synthetic)\n`,
      'docs/modules/nested/b.md': `${MODULE}\n[a](../a.md) [data](../../../curriculum/a.json#ignored)\n`,
      'docs/paths/p.md': '# P\n[a](../modules/a.md#learning-objectives) <!-- none -->\n'
        + '[site](https://example.invalid/x#y) [mail](mailto:nobody@example.invalid) [up](HTTP://example.invalid)\n',
      'curriculum/a.json': '{}',
      'notes.md': '[outside docs is not scanned](missing.md)',
    });
    const input = {
      competencies: [competency('a'), { ...competency('b'), content: {
        ...competency('b').content, path: 'docs/modules/nested/b.md',
      } }],
    };
    const before = structuredClone(input);
    expect(validateContentReferences(input, root)).toEqual({
      valid: true, errors: [],
      summary: { markdownFiles: 3, internalLinks: 5, externalLinks: 3 },
    });
    expect(input).toEqual(before);
  });

  it('accepts an empty catalog in a repository without documents', () => {
    expect(validateContentReferences(catalog(), workspace())).toEqual({
      valid: true, errors: [], summary: { markdownFiles: 0, internalLinks: 0, externalLinks: 0 },
    });
  });

  it('allows repeated headings that nothing refers to', () => {
    const root = workspace({ 'docs/modules/a.md': `${MODULE}\n### Cleanup\n\n### Cleanup\n` });
    expect(validateContentReferences(catalog('a'), root).valid).toBe(true);
  });
});

describe('competency content diagnostics', () => {
  it('reports a missing module file', () => {
    expect(contentErrors(catalog('a'), workspace({ 'docs/modules/other.txt': '' }))).toEqual([
      expect.objectContaining({
        code: 'MISSING_FILE', reference: 'docs/modules/a.md', path: '/competencies/0/content/path',
      }),
    ]);
  });

  it('reports a path that differs only in letter case, even on a case-insensitive filesystem', () => {
    const errors = contentErrors(catalog('a'), workspace({ 'docs/modules/A.md': MODULE }));
    expect(errors[0]).toMatchObject({ code: 'MISSING_FILE', path: '/competencies/0/content/path' });
    expect(errors[0]!.message).toContain('letter case');
  });

  it('reports a directory in place of a module', () => {
    const root = workspace({ 'docs/modules/a.md/readme.txt': '' });
    expect(contentErrors(catalog('a'), root)).toEqual([
      expect.objectContaining({ code: 'NOT_A_FILE', path: '/competencies/0/content/path' }),
    ]);
  });

  it('reports a required heading that exists only inside a fenced code block', () => {
    const root = workspace({ 'docs/modules/a.md': '# A\n\n```\n## Learning Objectives\n```\n\n## Completion criteria\n' });
    expect(contentErrors(catalog('a'), root)).toEqual([
      expect.objectContaining({
        code: 'MISSING_ANCHOR', reference: 'docs/modules/a.md#learning-objectives',
        path: '/competencies/0/content/objectivesAnchor',
      }),
    ]);
  });

  it('reports a required anchor produced by more than one heading', () => {
    const root = workspace({ 'docs/modules/a.md': `${MODULE}\n### Completion Criteria\n` });
    const errors = contentErrors(catalog('a'), root);
    expect(errors).toEqual([expect.objectContaining({
      code: 'AMBIGUOUS_ANCHOR', path: '/competencies/0/content/completionCriteriaAnchor',
    })]);
    expect(errors[0]!.message).toContain('lines 5, 7');
  });

  it('reports two competencies that share one module', () => {
    const input = catalog('a', 'b');
    input.competencies[1]!.content.path = 'docs/modules/a.md';
    expect(contentErrors(input, workspace({ 'docs/modules/a.md': MODULE }))).toEqual([
      expect.objectContaining({
        code: 'DUPLICATE_CONTENT_PATH', reference: 'docs/modules/a.md', path: '/competencies/1/content/path',
      }),
    ]);
  });

  it.each([
    '../outside.md', 'docs/modules/../../outside.md', '/etc/passwd.md', 'docs\\modules\\a.md',
    'docs/modules/./a.md', 'docs/a.md', 'docs/modules/a.txt',
  ])('rejects the unsafe content path %j without reading it', (path) => {
    const input = catalog('a');
    input.competencies[0]!.content.path = path;
    const root = workspace({ 'repo/docs/a.md': MODULE, 'repo/docs/modules/a.txt': MODULE, 'outside.md': MODULE });
    expect(contentErrors(input, join(root, 'repo'))).toEqual([
      expect.objectContaining({ code: 'UNSAFE_PATH', reference: path }),
    ]);
  });

  it('rejects a module that is a symbolic link to a file outside the repository', () => {
    const root = workspace({ 'outside.md': MODULE });
    mkdirSync(join(root, 'repo/docs/modules'), { recursive: true });
    symlinkSync(join(root, 'outside.md'), join(root, 'repo/docs/modules/a.md'));
    const errors = contentErrors(catalog('a'), join(root, 'repo'));
    expect(errors.map(({ code, reference }) => [code, reference])).toEqual([
      ['SYMLINK_NOT_ALLOWED', 'docs/modules/a.md'], // competency content path
      ['SYMLINK_NOT_ALLOWED', 'docs/modules/a.md'], // document discovery
    ]);
  });

  it('rejects a module reached through a symbolic-link directory', () => {
    const root = workspace({ 'outside/a.md': MODULE });
    mkdirSync(join(root, 'repo/docs'), { recursive: true });
    symlinkSync(join(root, 'outside'), join(root, 'repo/docs/modules'));
    const errors = contentErrors(catalog('a'), join(root, 'repo'));
    expect(errors.every(({ code }) => code === 'SYMLINK_NOT_ALLOWED')).toBe(true);
    expect(errors[0]).toMatchObject({ reference: 'docs/modules/a.md', path: '/competencies/0/content/path' });
  });

  it('reports a module document that no competency references', () => {
    const root = workspace({ 'docs/modules/a.md': MODULE, 'docs/modules/draft/z.md': MODULE });
    expect(contentErrors(catalog('a'), root)).toEqual([
      expect.objectContaining({ code: 'ORPHANED_MODULE', reference: 'docs/modules/draft/z.md' }),
    ]);
  });
});

describe('internal link diagnostics', () => {
  it.each([
    ['a missing file', '[x](modules/missing.md)', 'MISSING_FILE'],
    ['a case mismatch', '[x](modules/A.md)', 'MISSING_FILE'],
    ['an empty target', '[x]()', 'MISSING_FILE'],
    ['a directory', '[x](modules/)', 'NOT_A_FILE'],
    ['a missing anchor in another file', '[x](modules/a.md#absent)', 'MISSING_ANCHOR'],
    ['a missing anchor in the same file', '# Page\n[x](#absent)', 'MISSING_ANCHOR'],
    ['an anchor with different case', '[x](modules/a.md#Learning-Objectives)', 'MISSING_ANCHOR'],
    ['an invented numeric suffix', '## Twice\n## Twice\n[x](#twice-1)', 'MISSING_ANCHOR'],
    ['an ambiguous anchor', '## Twice\n## Twice\n[x](#twice)', 'AMBIGUOUS_ANCHOR'],
    ['a parent traversal outside the repository', '[x](../../outside.md)', 'UNSAFE_PATH'],
    ['an absolute path', '[x](/docs/modules/a.md)', 'UNSAFE_PATH'],
    ['a backslash path', '[x](modules\\a.md)', 'UNSAFE_PATH'],
    ['a file URL', '[x](file:///etc/hosts)', 'UNSAFE_PATH'],
    ['a script URL', '[x](javascript:alert)', 'UNSAFE_PATH'],
    ['a protocol-relative URL', '[x](//example.invalid/a.md)', 'UNSAFE_PATH'],
    ['a percent-encoded path', '[x](modules/%61.md)', 'MISSING_FILE'],
  ])('reports %s', (_name, body, code) => {
    const errors = contentErrors(catalog('a'), withPage(body));
    expect(errors).toEqual([expect.objectContaining({ code, file: 'docs/page.md' })]);
    expect(errors[0]!.line).toBe(body.split('\n').length);
  });

  it('rejects a link whose target is a symbolic link', () => {
    const root = withPage('[x](linked.md)');
    symlinkSync(join(root, 'docs/modules/a.md'), join(root, 'docs/linked.md'));
    expect(contentErrors(catalog('a'), root).map(({ code, reference }) => [code, reference])).toEqual([
      ['SYMLINK_NOT_ALLOWED', 'docs/linked.md'], // document discovery
      ['SYMLINK_NOT_ALLOWED', 'linked.md'], // the link itself
    ]);
  });

  it('ignores links inside fenced code blocks and inline code', () => {
    const root = withPage('```md\n[x](missing.md)\n```\n\nUse `[x](missing.md)`.\n');
    expect(validateContentReferences(catalog('a'), root).valid).toBe(true);
  });

  it('rejects a document with an unclosed fence instead of silently skipping its remainder', () => {
    const root = withPage('# Page\n\n[ok](modules/a.md)\n\n```sh\necho synthetic\n\n[hidden](missing.md)\n');
    expect(contentErrors(catalog('a'), root)).toEqual([{
      code: 'UNCLOSED_FENCE', reference: 'docs/page.md', file: 'docs/page.md', line: 5,
      message: expect.stringContaining('docs/page.md:5'),
    }]);
  });

  it('rejects an unclosed fence in a module even when its required anchors appear earlier', () => {
    const root = workspace({ 'docs/modules/a.md': `${MODULE}\n~~~\nunfinished\n` });
    expect(contentErrors(catalog('a'), root)).toEqual([
      expect.objectContaining({ code: 'UNCLOSED_FENCE', file: 'docs/modules/a.md', line: 7 }),
    ]);
  });

  it('checks links that follow a backtick line that is not a valid opening fence', () => {
    const root = withPage('``` a`b\n\n[x](missing.md)\n\n## Real\n[y](#real)\n');
    expect(contentErrors(catalog('a'), root)).toEqual([
      expect.objectContaining({ code: 'MISSING_FILE', file: 'docs/page.md', line: 3 }),
    ]);
  });

  it('accepts closed fences and keeps checking the links after them', () => {
    const closed = withPage('```sh\n[x](missing.md)\n```\n\n[ok](modules/a.md)\n');
    expect(validateContentReferences(catalog('a'), closed)).toMatchObject({
      valid: true, summary: { internalLinks: 1 },
    });
    const broken = withPage('```sh\ncode\n```\n\n[x](missing.md)\n');
    expect(contentErrors(catalog('a'), broken)).toEqual([
      expect.objectContaining({ code: 'MISSING_FILE', file: 'docs/page.md', line: 5 }),
    ]);
  });

  it('reports the same diagnostics in the same order on every run', () => {
    const files: Record<string, string> = {
      'docs/z.md': '[1](no-1.md)\n[2](no-2.md)\n',
      'docs/b/c.md': '[3](no-3.md)\n',
      'docs/a.md': '[4](no-4.md)\n',
      'docs/modules/orphan.md': MODULE,
    };
    const forward = workspace(files);
    const backward = workspace(Object.fromEntries(Object.entries(files).reverse()));
    const first = contentErrors(catalog('a'), forward);
    expect(first.map(({ code, file, line }) => [code, file, line])).toEqual([
      ['MISSING_FILE', undefined, undefined],
      ['MISSING_FILE', 'docs/a.md', 1],
      ['MISSING_FILE', 'docs/b/c.md', 1],
      ['MISSING_FILE', 'docs/z.md', 1],
      ['MISSING_FILE', 'docs/z.md', 2],
      ['ORPHANED_MODULE', 'docs/modules/orphan.md', undefined],
    ]);
    expect(contentErrors(catalog('a'), backward)).toEqual(first);
    expect(contentErrors(catalog('a'), forward)).toEqual(first);
  });
});
