import { describe, expect, it } from 'vitest';
import {
  validateCurriculumRepository, validatePrerequisiteClosure,
} from '../scripts/validate-curriculum-repository.js';
import { competency, json, MODULE, workspace } from './support/workspace.js';

type Definition = [id: string, prerequisites: string[]];

/** A complete synthetic repository: manifest, one record and module per competency, one track. */
function repository(
  definitions: Definition[], members: string[], overrides: Record<string, string> = {},
) {
  const files: Record<string, string> = {
    'curriculum/manifest.json': json({ schemaVersion: 1, curriculumVersion: '1.2.3' }),
    'curriculum/tracks/path.json': json({ id: 'path', title: 'Synthetic path', competencyIds: members }),
  };
  for (const [id, prerequisites] of definitions) {
    files[`curriculum/competencies/${id}.json`] = json(competency(id, prerequisites));
    files[`docs/modules/${id}.md`] = MODULE;
  }
  return workspace({ ...files, ...overrides });
}

describe('repository validation stages', () => {
  it('accepts a complete synthetic repository and summarizes it', () => {
    const root = repository([['b', ['a']], ['a', []]], ['a', 'b'], {
      'docs/index.md': '[a](modules/a.md#learning-objectives) [ext](https://example.invalid)\n',
    });
    const result = validateCurriculumRepository(root, ['path']);
    expect(result).toEqual({
      valid: true,
      summary: {
        curriculumVersion: '1.2.3', competencyIds: ['a', 'b'],
        tracks: [{ id: 'path', competencyIds: ['a', 'b'] }],
        markdownFiles: 3, internalLinks: 1, externalLinks: 1,
      },
    });
    expect(validateCurriculumRepository(root, ['path'])).toEqual(result);
  });

  it('stops at the load stage', () => {
    const root = repository([['a', []]], ['a'], { 'curriculum/manifest.json': '{' });
    expect(validateCurriculumRepository(root)).toEqual({
      valid: false, stage: 'load',
      errors: [expect.objectContaining({ code: 'INVALID_JSON', file: 'curriculum/manifest.json' })],
    });
  });

  it('stops at the structural stage and identifies source files', () => {
    const root = repository([['a', []]], ['a'], {
      'curriculum/manifest.json': json({ schemaVersion: 2, curriculumVersion: '1.2.3' }),
    });
    expect(validateCurriculumRepository(root)).toMatchObject({
      valid: false, stage: 'structural',
      errors: [{ path: '/manifest/schemaVersion', keyword: 'const' }],
      sources: { manifest: 'curriculum/manifest.json', competencies: ['curriculum/competencies/a.json'] },
    });
  });

  it('stops at the semantic stage before reading any Markdown', () => {
    const root = repository([['a', ['missing']]], ['a'], { 'docs/modules/a.md': '[x](absent.md)' });
    expect(validateCurriculumRepository(root)).toMatchObject({
      valid: false, stage: 'semantic', errors: [{ code: 'UNKNOWN_PREREQUISITE' }],
    });
  });

  it('reports content and prerequisite-closure issues together', () => {
    const root = repository([['a', []], ['b', ['a']]], ['b'], { 'docs/modules/a.md': '# No headings\n' });
    const result = validateCurriculumRepository(root, ['path']);
    if (result.valid || result.stage !== 'content') throw new Error('Expected content diagnostics');
    expect(result.errors.map(({ code }) => code)).toEqual([
      'MISSING_ANCHOR', 'MISSING_ANCHOR', 'PREREQUISITE_OUTSIDE_TRACK',
    ]);
  });
});

describe('prerequisite closure of selected tracks', () => {
  const catalog = (definitions: Definition[], tracks: [string, string[]][]) => ({
    competencies: definitions.map(([id, prerequisites]) => ({ id, prerequisites })),
    tracks: tracks.map(([id, competencyIds]) => ({ id, competencyIds })),
  });

  it('accepts a track containing every direct and indirect prerequisite', () => {
    const input = catalog([['a', []], ['b', ['a']], ['c', ['a', 'b']]], [['path', ['c', 'b', 'a']]]);
    expect(validatePrerequisiteClosure(input, ['path'])).toEqual([]);
  });

  it('does not apply the rule to tracks that were not selected', () => {
    const input = catalog([['a', []], ['b', ['a']]], [['open', ['b']], ['closed', ['a', 'b']]]);
    expect(validatePrerequisiteClosure(input, ['closed'])).toEqual([]);
    expect(validatePrerequisiteClosure(input, [])).toEqual([]);
  });

  it('reports each prerequisite missing from a selected track', () => {
    const input = catalog([['a', []], ['b', ['a']], ['c', ['b', 'a']]], [['path', ['c']]]);
    expect(validatePrerequisiteClosure(input, ['path'])).toEqual([
      expect.objectContaining({
        code: 'PREREQUISITE_OUTSIDE_TRACK', trackId: 'path', competencyId: 'c',
        prerequisiteId: 'b', path: '/competencies/2/prerequisites/0',
      }),
      expect.objectContaining({
        code: 'PREREQUISITE_OUTSIDE_TRACK', trackId: 'path', competencyId: 'c',
        prerequisiteId: 'a', path: '/competencies/2/prerequisites/1',
      }),
    ]);
  });

  it('reports a selected track that does not exist', () => {
    expect(validatePrerequisiteClosure(catalog([['a', []]], [['other', ['a']]]), ['path'])).toEqual([
      expect.objectContaining({ code: 'REQUIRED_TRACK_MISSING', trackId: 'path', path: '/tracks' }),
    ]);
  });
});
