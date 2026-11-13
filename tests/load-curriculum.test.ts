import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkSchemaSource, loadCurriculum } from '../scripts/load-curriculum.js';
import { competency, json, workspace } from './support/workspace.js';

const manifest = { schemaVersion: 1, curriculumVersion: '0.1.0' };
const track = { id: 'path', title: 'Synthetic path', competencyIds: ['a'] };

function layout(extra: Record<string, string> = {}) {
  return workspace({
    'curriculum/manifest.json': json(manifest),
    'curriculum/competencies/a.json': json(competency('a')),
    'curriculum/tracks/path.json': json(track),
    ...extra,
  });
}

function loadErrors(root: string) {
  const result = loadCurriculum(root);
  if (result.ok) throw new Error('Expected loading to fail');
  return result.errors;
}

describe('curriculum loading', () => {
  it('aggregates the manifest, competencies, and tracks with their source files', () => {
    expect(loadCurriculum(layout())).toEqual({
      ok: true,
      catalog: { manifest, competencies: [competency('a')], tracks: [track] },
      sources: {
        manifest: 'curriculum/manifest.json',
        competencies: ['curriculum/competencies/a.json'],
        tracks: ['curriculum/tracks/path.json'],
      },
    });
  });

  it('orders records by ID regardless of creation order', () => {
    const ids = ['b', 'a-b', 'a', 'a1', 'c'];
    const forward = layout(Object.fromEntries(
      ids.map((id) => [`curriculum/competencies/${id}.json`, json(competency(id))]),
    ));
    const backward = layout(Object.fromEntries(
      [...ids].reverse().map((id) => [`curriculum/competencies/${id}.json`, json(competency(id))]),
    ));
    const first = loadCurriculum(forward);
    const second = loadCurriculum(backward);
    if (!first.ok || !second.ok) throw new Error('Expected loading to succeed');
    expect(first.catalog.competencies.map((record) => (record as { id: string }).id))
      .toEqual(['a', 'a-b', 'a1', 'b', 'c']);
    expect(second).toEqual(first);
    expect(loadCurriculum(forward)).toEqual(first);
  });

  it('accepts empty record directories and leaves structure to the schema', () => {
    const root = workspace({ 'curriculum/manifest.json': json({ anything: true }) });
    mkdirSync(join(root, 'curriculum/competencies'));
    mkdirSync(join(root, 'curriculum/tracks'));
    expect(loadCurriculum(root)).toMatchObject({
      ok: true, catalog: { manifest: { anything: true }, competencies: [], tracks: [] },
    });
  });

  it('reports a missing curriculum directory once', () => {
    expect(loadErrors(workspace()).map(({ code, file }) => [code, file])).toEqual([
      ['MISSING_PATH', 'curriculum'],
    ]);
  });

  it('rejects a curriculum directory that is a symbolic link out of the repository', () => {
    // A complete, valid curriculum exists outside the repository; only the link is inside.
    const outside = layout();
    const root = workspace();
    symlinkSync(join(outside, 'curriculum'), join(root, 'curriculum'));
    const result = loadCurriculum(root);
    expect(result).toEqual({
      ok: false,
      errors: [expect.objectContaining({ code: 'UNEXPECTED_ENTRY', file: 'curriculum' })],
    });
    expect(loadCurriculum(root)).toEqual(result);
    // The same content loads when it is a real directory, so the link alone causes the rejection.
    expect(loadCurriculum(outside).ok).toBe(true);
  });

  it('rejects a curriculum directory that is a link inside the repository or a regular file', () => {
    const linked = workspace({
      'elsewhere/manifest.json': json(manifest),
      'elsewhere/competencies/a.json': json(competency('a')),
      'elsewhere/tracks/path.json': json(track),
    });
    symlinkSync(join(linked, 'elsewhere'), join(linked, 'curriculum'));
    const file = workspace({ curriculum: 'synthetic' });
    for (const root of [linked, file]) {
      expect(loadErrors(root).map(({ code, file: path }) => [code, path])).toEqual([
        ['UNEXPECTED_ENTRY', 'curriculum'],
      ]);
    }
  });

  it('reports every missing path inside the curriculum directory in one pass', () => {
    const root = workspace();
    mkdirSync(join(root, 'curriculum'));
    expect(loadErrors(root).map(({ code, file }) => [code, file])).toEqual([
      ['MISSING_PATH', 'curriculum/manifest.json'],
      ['MISSING_PATH', 'curriculum/competencies'],
      ['MISSING_PATH', 'curriculum/tracks'],
    ]);
  });

  it('rejects invalid JSON without repeating file content', () => {
    const errors = loadErrors(layout({
      'curriculum/competencies/b.json': '{ "id": "synthetic-private-value", }',
    }));
    expect(errors).toEqual([expect.objectContaining({
      code: 'INVALID_JSON', file: 'curriculum/competencies/b.json',
    })]);
    expect(JSON.stringify(errors)).not.toContain('synthetic-private-value');
  });

  it('rejects a record whose ID differs from its file name', () => {
    const errors = loadErrors(layout({ 'curriculum/tracks/other.json': json(track) }));
    expect(errors).toEqual([expect.objectContaining({
      code: 'FILE_ID_MISMATCH', file: 'curriculum/tracks/other.json',
    })]);
  });

  it('rejects entries that are not regular .json files, in sorted order', () => {
    const root = layout({
      'curriculum/competencies/notes.txt': 'synthetic',
      'curriculum/competencies/nested/c.json': json(competency('c')),
    });
    symlinkSync(join(root, 'curriculum/competencies/a.json'), join(root, 'curriculum/competencies/link.json'));
    expect(loadErrors(root).map(({ code, file }) => [code, file])).toEqual([
      ['UNEXPECTED_ENTRY', 'curriculum/competencies/link.json'],
      ['UNEXPECTED_ENTRY', 'curriculum/competencies/nested'],
      ['UNEXPECTED_ENTRY', 'curriculum/competencies/notes.txt'],
    ]);
  });

  it('still reports problems in regular files beside an unexpected entry', () => {
    const files = {
      'curriculum/manifest.json': '{',
      'curriculum/competencies/notes.txt': 'synthetic',
      'curriculum/competencies/b.json': '[',
      'curriculum/competencies/wrong.json': json(competency('c')),
      'curriculum/tracks/.DS_Store': '',
      'curriculum/tracks/other.json': json(track),
    };
    const expected = [
      ['INVALID_JSON', 'curriculum/manifest.json'],
      ['UNEXPECTED_ENTRY', 'curriculum/competencies/notes.txt'],
      ['INVALID_JSON', 'curriculum/competencies/b.json'],
      ['FILE_ID_MISMATCH', 'curriculum/competencies/wrong.json'],
      ['UNEXPECTED_ENTRY', 'curriculum/tracks/.DS_Store'],
      ['FILE_ID_MISMATCH', 'curriculum/tracks/other.json'],
    ];
    const forward = loadErrors(layout(files));
    expect(forward.map(({ code, file }) => [code, file])).toEqual(expected);
    expect(loadErrors(layout(Object.fromEntries(Object.entries(files).reverse())))).toEqual(forward);
  });

  it('rejects a symbolic link in place of the manifest or a record directory', () => {
    const root = workspace({
      'elsewhere/manifest.json': json(manifest),
      'elsewhere/competencies/a.json': json(competency('a')),
    });
    mkdirSync(join(root, 'curriculum/tracks'), { recursive: true });
    symlinkSync(join(root, 'elsewhere/manifest.json'), join(root, 'curriculum/manifest.json'));
    symlinkSync(join(root, 'elsewhere/competencies'), join(root, 'curriculum/competencies'));
    expect(loadErrors(root).map(({ code, file }) => [code, file])).toEqual([
      ['UNEXPECTED_ENTRY', 'curriculum/manifest.json'],
      ['UNEXPECTED_ENTRY', 'curriculum/competencies'],
    ]);
  });
});

describe('schema source check', () => {
  const SCHEMA = 'curriculum/schema/curriculum.schema.json';
  const codes = (root: string) => checkSchemaSource(root).map(({ code, file }) => [code, file]);

  it('accepts a regular JSON schema file in real directories without judging its content', () => {
    expect(checkSchemaSource(workspace({ [SCHEMA]: '{ "type": "object" }' }))).toEqual([]);
    expect(checkSchemaSource(workspace({ [SCHEMA]: '{ "type": "not-a-type" }' }))).toEqual([]);
  });

  it('accepts the canonical schema of this repository', () => {
    expect(checkSchemaSource(fileURLToPath(new URL('..', import.meta.url)))).toEqual([]);
  });

  it('reports the first missing level', () => {
    const empty = workspace();
    expect(codes(empty)).toEqual([['MISSING_PATH', 'curriculum']]);
    mkdirSync(join(empty, 'curriculum'));
    expect(codes(empty)).toEqual([['MISSING_PATH', 'curriculum/schema']]);
    mkdirSync(join(empty, 'curriculum/schema'));
    expect(codes(empty)).toEqual([['MISSING_PATH', SCHEMA]]);
  });

  it('reports a schema that is not JSON without repeating its content', () => {
    const issues = checkSchemaSource(workspace({ [SCHEMA]: '{ "synthetic-private-value": ' }));
    expect(issues).toEqual([expect.objectContaining({ code: 'INVALID_JSON', file: SCHEMA })]);
    expect(JSON.stringify(issues)).not.toContain('synthetic-private-value');
  });

  it('rejects a symbolic link at each level without reading through it', () => {
    // The link targets hold invalid JSON: reading through any link would report INVALID_JSON.
    const target = workspace({ [SCHEMA]: '{' });
    const atCurriculum = workspace();
    symlinkSync(join(target, 'curriculum'), join(atCurriculum, 'curriculum'));
    expect(codes(atCurriculum)).toEqual([['UNEXPECTED_ENTRY', 'curriculum']]);

    const atDirectory = workspace();
    mkdirSync(join(atDirectory, 'curriculum'));
    symlinkSync(join(target, 'curriculum/schema'), join(atDirectory, 'curriculum/schema'));
    expect(codes(atDirectory)).toEqual([['UNEXPECTED_ENTRY', 'curriculum/schema']]);

    const atFile = workspace();
    mkdirSync(join(atFile, 'curriculum/schema'), { recursive: true });
    symlinkSync(join(target, SCHEMA), join(atFile, SCHEMA));
    expect(codes(atFile)).toEqual([['UNEXPECTED_ENTRY', SCHEMA]]);
  });
});
