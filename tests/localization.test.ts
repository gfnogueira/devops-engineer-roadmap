import { spawnSync } from 'node:child_process';
import { symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  competencyCanonicalSource, competencySourceHash, trackCanonicalSource, trackSourceHash,
} from '../scripts/localization-hash.js';
import {
  loadLocalizationOverlays, validateLocalization, validateLocalizationOverlays,
  type LocalizationCatalog, type OverlayFile,
} from '../scripts/validate-localization.js';
import { validateCurriculumRepository } from '../scripts/validate-curriculum-repository.js';
import { competency, json, MODULE, workspace } from './support/workspace.js';

// Everything here is synthetic. No real translation exists in this repository.
const CATALOG: LocalizationCatalog = {
  competencies: [
    { id: 'a', title: 'Synthetic capability', summary: 'Synthetic test record.' },
    { id: 'b', title: 'Synthetic capability', summary: 'Synthetic test record.' },
  ],
  tracks: [{ id: 'foundations', title: 'Synthetic track' }],
};
const COMPETENCY_HASH = 'sha256:2153f5132c27fba5b095aa4454a8fef909f72e856435ee942ddfeab488c65c7c';
const TRACK_HASH = 'sha256:32c795e9af69c09b5e0167dbf6b1c376770b4c1a542a85f32cd77745f88571c1';
const STALE = `sha256:${'0'.repeat(64)}`;

function competencyOverlay(id = 'a', status: 'draft' | 'reviewed' = 'reviewed', sourceHash = COMPETENCY_HASH) {
  return {
    localizationVersion: 1, kind: 'competency', locale: 'pt-BR', id,
    title: 'Capacidade sintética', summary: 'Registro sintético de teste.', status,
    provenance: {
      sourceHash, method: 'human', translatedBy: 'synthetic-translator',
      ...(status === 'reviewed' ? { reviewedBy: 'synthetic-reviewer', reviewedAt: '2026-01-02' } : {}),
    },
  };
}
function trackOverlay(status: 'draft' | 'reviewed' = 'reviewed', sourceHash = TRACK_HASH) {
  const { summary: _summary, ...rest } = competencyOverlay('foundations', status, sourceHash);
  return { ...rest, kind: 'track', title: 'Trilha sintética' };
}
function file(data: unknown, kind: 'competency' | 'track' = 'competency', id = 'a'): OverlayFile {
  const directory = kind === 'competency' ? 'competencies' : 'tracks';
  return {
    file: `curriculum/locales/pt-BR/${directory}/${id}.json`,
    directoryLocale: 'pt-BR', directoryKind: kind, fileId: id, data,
  };
}
const codes = (issues: { code: string }[]) => issues.map(({ code }) => code);
const check = (overlays: OverlayFile[], strictTranslations = false) =>
  validateLocalizationOverlays(overlays, CATALOG, { strictTranslations });

describe('source hash', () => {
  it('uses the fixed property order and NFC text', () => {
    expect(competencyCanonicalSource('T', 'S')).toBe('{"title":"T","summary":"S"}');
    expect(trackCanonicalSource('T')).toBe('{"title":"T"}');
  });

  it('matches the documented test vectors', () => {
    expect(competencySourceHash('Synthetic capability', 'Synthetic test record.')).toBe(COMPETENCY_HASH);
    expect(trackSourceHash('Synthetic track')).toBe(TRACK_HASH);
    expect(competencySourceHash('Café', 'Maçã — é'))
      .toBe('sha256:fd648b69a8d720711d791384631d522caf9f93d3c1efc18bb796a61702837a79');
    expect(trackSourceHash('Foundations'))
      .toBe('sha256:dbba71772c7a701403a4fa8acce084cec8cf3c707e7377485e50730a76100d00');
  });

  it('is deterministic and NFC-insensitive but sensitive to every other change', () => {
    expect(competencySourceHash('Café', 'x')).toBe(competencySourceHash('Café', 'x'));
    expect(competencySourceHash('a', 'b')).toBe(competencySourceHash('a', 'b'));
    expect(competencySourceHash('a', 'b')).not.toBe(competencySourceHash('b', 'a'));
    expect(competencySourceHash('a', 'b')).not.toBe(competencySourceHash('a', 'b '));
    expect(competencySourceHash('a', 'b')).not.toBe(competencySourceHash('A', 'b'));
    expect(trackSourceHash('a')).not.toBe(competencySourceHash('a', ''));
  });
});

describe('overlay validation', () => {
  it('accepts valid reviewed and draft overlays of both kinds', () => {
    const result = check([
      file(competencyOverlay('a')), file(competencyOverlay('b', 'draft'), 'competency', 'b'), file(trackOverlay(), 'track', 'foundations'),
    ]);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.summary.locales).toEqual([{
      locale: 'pt-BR',
      competencies: { total: 2, publishable: 1, draft: 1, outdated: 0, missing: 0 },
      tracks: { total: 1, publishable: 1, draft: 0, outdated: 0, missing: 0 },
      modules: { total: 0, publishable: 0, draft: 0, outdated: 0, missing: 0 },
    }]);
  });

  it('allows missing translations in both modes and reports only coverage', () => {
    for (const strict of [false, true]) {
      const result = check([file(competencyOverlay('a'))], strict);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.summary.locales[0]!.competencies.missing).toBe(1);
      expect(result.summary.locales[0]!.tracks.missing).toBe(1);
    }
    expect(check([]).errors).toEqual([]);
  });

  it('derives outdated from the hash: a warning in development, an error for reviewed text in strict mode', () => {
    const reviewed = [file(competencyOverlay('a', 'reviewed', STALE))];
    const development = check(reviewed);
    expect(development.errors).toEqual([]);
    expect(codes(development.warnings)).toEqual(['STALE_TRANSLATION']);
    expect(development.summary.locales[0]!.competencies).toMatchObject({ outdated: 1, publishable: 0 });

    const strict = check(reviewed, true);
    expect(codes(strict.errors)).toEqual(['OUTDATED_REVIEWED_TRANSLATION']);
    expect(strict.warnings).toEqual([]);

    const track = check([file(trackOverlay('reviewed', STALE), 'track', 'foundations')], true);
    expect(codes(track.errors)).toEqual(['OUTDATED_REVIEWED_TRANSLATION']);
  });

  it('treats an outdated draft as a warning in both modes', () => {
    const draft = [file(competencyOverlay('a', 'draft', STALE))];
    expect(check(draft).errors).toEqual([]);
    const strict = check(draft, true);
    expect(strict.errors).toEqual([]);
    expect(codes(strict.warnings)).toEqual(['STALE_TRANSLATION', 'DRAFT_NOT_PUBLISHABLE']);
  });

  it('never treats a draft as publishable and flags it only in strict mode', () => {
    const draft = [file(competencyOverlay('a', 'draft'))];
    expect(check(draft).warnings).toEqual([]);
    const strict = check(draft, true);
    expect(strict.errors).toEqual([]);
    expect(codes(strict.warnings)).toEqual(['DRAFT_NOT_PUBLISHABLE']);
    expect(strict.summary.locales[0]!.competencies).toMatchObject({ draft: 1, publishable: 0 });
  });

  it('rejects an unsupported locale directory and an overlay locale that differs from its directory', () => {
    const root = workspace({ 'curriculum/locales/fr-FR/competencies/a.json': json(competencyOverlay()) });
    const loaded = loadLocalizationOverlays(root);
    expect(codes(loaded.errors)).toEqual(['UNSUPPORTED_LOCALE']);
    expect(loaded.overlays).toEqual([]);

    const mismatch = { ...file(competencyOverlay()), directoryLocale: 'en' };
    expect(codes(check([mismatch]).errors)).toEqual(['LOCALE_MISMATCH']);
    expect(codes(check([file({ ...competencyOverlay(), locale: 'fr-FR' })]).errors)).toEqual(['SCHEMA_VIOLATION']);
  });

  it('rejects unknown IDs for each kind', () => {
    expect(codes(check([file(competencyOverlay('zzz'), 'competency', 'zzz')]).errors)).toEqual(['UNKNOWN_ID']);
    // A track ID is not a competency ID and vice versa.
    const asCompetency = { ...competencyOverlay('foundations') };
    expect(codes(check([file(asCompetency, 'competency', 'foundations')]).errors)).toEqual(['UNKNOWN_ID']);
    expect(codes(check([file({ ...trackOverlay(), id: 'a' }, 'track', 'a')]).errors)).toEqual(['UNKNOWN_ID']);
  });

  it('rejects a file name or directory that disagrees with the overlay', () => {
    expect(codes(check([file(competencyOverlay('a'), 'competency', 'b')]).errors)).toEqual(['FILE_ID_MISMATCH']);
    expect(codes(check([file(trackOverlay(), 'competency', 'foundations')]).errors)).toEqual(['KIND_MISMATCH']);
  });

  it('rejects schema violations, including fields that carry graph or assessment semantics', () => {
    const base = competencyOverlay();
    const invalid: unknown[] = [
      { ...base, prerequisites: ['b'] },
      { ...base, level: 'foundations' },
      { ...base, assessmentRevision: 2 },
      { ...base, progress: { completed: true } },
      { ...base, competencyIds: ['a'] },
      { ...base, summary: undefined },
      { ...base, title: '   ' },
      { ...base, status: 'outdated' },
      { ...base, localizationVersion: undefined },
      { ...base, provenance: { ...base.provenance, sourceHash: 'sha256:ABC' } },
      { ...base, provenance: { ...base.provenance, extra: 1 } },
      { ...base, provenance: { ...base.provenance, reviewedAt: '02/01/2026' } },
      { ...base, status: 'draft' },
      { ...competencyOverlay('a', 'draft'), provenance: { ...competencyOverlay('a', 'draft').provenance, reviewedBy: 'x', reviewedAt: '2026-01-02' } },
      { ...base, provenance: { sourceHash: COMPETENCY_HASH, method: 'human', translatedBy: 'x' } },
      { ...trackOverlay(), summary: 'not translatable for tracks' },
      { ...trackOverlay(), assessmentRevision: 1 },
      { ...base, kind: 'module' },
      'text', null, [],
    ];
    for (const data of invalid) {
      const result = check([file(JSON.parse(JSON.stringify(data ?? null)))]);
      expect(codes(result.errors), JSON.stringify(data)).toContain('SCHEMA_VIOLATION');
    }
  });

  it('rejects an unsupported overlay contract version without interpreting it', () => {
    const result = check([file({ ...competencyOverlay(), localizationVersion: 2, anything: true })]);
    expect(codes(result.errors)).toEqual(['UNSUPPORTED_LOCALIZATION_VERSION']);
  });

  it('requires NFC text', () => {
    const decomposed = { ...competencyOverlay(), title: 'Capacidade sinteticá' };
    expect(codes(check([file(decomposed)]).errors)).toEqual(['NOT_NFC']);
    const composed = { ...competencyOverlay(), title: 'Capacidade sintética' };
    expect(check([file(composed)]).errors).toEqual([]);
  });

  it('reports duplicate overlays for the same locale, kind and ID', () => {
    const second = { ...file(competencyOverlay()), file: 'curriculum/locales/pt-BR/competencies/other-a.json' };
    expect(codes(check([file(competencyOverlay()), second]).errors)).toEqual(['DUPLICATE_OVERLAY']);
  });

  it('reports every independent problem together', () => {
    const result = check([
      file(competencyOverlay('zzz'), 'competency', 'zzz'),
      file(competencyOverlay('b'), 'competency', 'a'),
      file({ ...trackOverlay(), assessmentRevision: 1 }, 'track', 'foundations'),
    ]);
    expect(codes(result.errors)).toEqual(['UNKNOWN_ID', 'FILE_ID_MISMATCH', 'SCHEMA_VIOLATION']);
  });
});

describe('overlay loading', () => {
  it('reports absence of curriculum/locales as not present', () => {
    expect(loadLocalizationOverlays(workspace({ 'curriculum/x.txt': '' })))
      .toEqual({ present: false, overlays: [], errors: [] });
  });

  it('loads overlays in a stable order and reports stray entries and bad JSON without reading them', () => {
    const root = workspace({
      'curriculum/locales/pt-BR/competencies/b.json': json(competencyOverlay('b')),
      'curriculum/locales/pt-BR/competencies/a.json': json(competencyOverlay('a')),
      'curriculum/locales/pt-BR/tracks/foundations.json': json(trackOverlay()),
      'curriculum/locales/pt-BR/competencies/c.json': '{ "secret": synthetic-private-value, }',
      'curriculum/locales/pt-BR/competencies/notes.txt': 'x',
      'curriculum/locales/pt-BR/glossary/a.json': '{}',
      'curriculum/locales/README.md': 'x',
    });
    const loaded = loadLocalizationOverlays(root);
    expect(loaded.overlays.map(({ file: path }) => path)).toEqual([
      'curriculum/locales/pt-BR/competencies/a.json',
      'curriculum/locales/pt-BR/competencies/b.json',
      'curriculum/locales/pt-BR/tracks/foundations.json',
    ]);
    expect(loaded.errors.map(({ code, file: path }) => `${code} ${path}`)).toEqual([
      'UNEXPECTED_ENTRY curriculum/locales/README.md',
      'INVALID_JSON curriculum/locales/pt-BR/competencies/c.json',
      'UNEXPECTED_ENTRY curriculum/locales/pt-BR/competencies/notes.txt',
      'UNEXPECTED_ENTRY curriculum/locales/pt-BR/glossary',
    ]);
    expect(JSON.stringify(loaded.errors)).not.toContain('synthetic-private-value');
  });

  it('does not follow a symbolic link at curriculum/locales or inside it', () => {
    const outside = workspace({ 'locales/pt-BR/competencies/a.json': json(competencyOverlay()) });
    const root = workspace({ 'curriculum/keep': '' });
    symlinkSync(join(outside, 'locales'), join(root, 'curriculum/locales'));
    const loaded = loadLocalizationOverlays(root);
    expect(loaded.overlays).toEqual([]);
    expect(codes(loaded.errors)).toEqual(['UNEXPECTED_ENTRY']);

    const inner = workspace({ 'curriculum/locales/keep': '' });
    symlinkSync(join(outside, 'locales/pt-BR'), join(inner, 'curriculum/locales/pt-BR'));
    expect(loadLocalizationOverlays(inner).overlays).toEqual([]);
    expect(codes(loadLocalizationOverlays(inner).errors)).toEqual(['UNEXPECTED_ENTRY', 'UNEXPECTED_ENTRY']);
  });

  it('validates files from disk end to end', () => {
    const root = workspace({
      'curriculum/locales/pt-BR/competencies/a.json': json(competencyOverlay('a', 'reviewed', STALE)),
    });
    const result = validateLocalization(root, CATALOG);
    expect(result.present).toBe(true);
    expect(codes(result.warnings)).toEqual(['STALE_TRANSLATION']);
    expect(result.errors).toEqual([]);
  });
});

describe('repository integration and command', () => {
  const cli = fileURLToPath(new URL('../scripts/validate-curriculum-cli.ts', import.meta.url));
  const aHash = competencySourceHash('Synthetic capability', 'Synthetic test record.');

  function repository(overlays: Record<string, unknown> = {}) {
    return workspace({
      'curriculum/manifest.json': json({ schemaVersion: 1, curriculumVersion: '9.8.7' }),
      'curriculum/competencies/a.json': json(competency('a')),
      'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'Synthetic track', competencyIds: ['a'] }),
      'docs/modules/a.md': MODULE,
      ...Object.fromEntries(Object.entries(overlays).map(([path, value]) => [`curriculum/locales/pt-BR/${path}`, json(value)])),
    });
  }
  function run(root: string, ...flags: string[]) {
    const { status, stdout, stderr } = spawnSync(process.execPath, [cli, root, ...flags], { encoding: 'utf8' });
    return { status, stdout, stderr, lines: stderr.split('\n').filter((line) => line.startsWith('- [')) };
  }

  it('is unchanged when no overlays exist', () => {
    const result = validateCurriculumRepository(repository(), []);
    expect(result.valid).toBe(true);
    expect(result).not.toHaveProperty('localization');
    const output = run(repository(), '--strict-translations');
    expect(output.status).toBe(0);
    expect(output.stdout).not.toContain('Localization');
  });

  it('warns about a stale reviewed translation in development mode and exits 0', () => {
    const root = repository({ 'competencies/a.json': competencyOverlay('a', 'reviewed', STALE) });
    const output = run(root);
    expect(output.status).toBe(0);
    expect(output.stdout).toContain('Localization (development mode):');
    expect(output.lines).toEqual([expect.stringMatching(/^- \[STALE_TRANSLATION\] curriculum\/locales\/pt-BR\/competencies\/a\.json: /)]);
  });

  it('fails a stale reviewed translation with --strict-translations', () => {
    const root = repository({ 'competencies/a.json': competencyOverlay('a', 'reviewed', STALE) });
    const output = run(root, '--strict-translations');
    expect(output.status).toBe(1);
    expect(output.stdout).toBe('');
    expect(output.stderr).toContain('Curriculum validation failed at the localization stage:');
    expect(output.lines).toEqual([expect.stringMatching(/^- \[OUTDATED_REVIEWED_TRANSLATION\] /)]);
  });

  it('passes strict mode for current reviewed translations, drafts and missing translations', () => {
    const root = repository({
      'competencies/a.json': competencyOverlay('a', 'reviewed', aHash),
      'tracks/foundations.json': trackOverlay('draft'),
    });
    const output = run(root, '--strict-translations');
    expect(output.status).toBe(0);
    expect(output.stdout).toContain('Localization (strict mode):');
    expect(output.stdout).toContain('competencies 1 publishable, 0 draft, 0 outdated, 0 missing');
    expect(output.stdout).toContain('tracks 0 publishable, 1 draft, 0 outdated, 0 missing');
    expect(output.lines).toEqual([expect.stringMatching(/^- \[DRAFT_NOT_PUBLISHABLE\] /)]);
  });

  it('fails in development mode on structural and reference errors', () => {
    const root = repository({
      'competencies/a.json': { ...competencyOverlay('a'), assessmentRevision: 1 },
      'competencies/ghost.json': competencyOverlay('ghost'),
    });
    const output = run(root);
    expect(output.status).toBe(1);
    expect(output.lines.map((line) => /^- \[(\w+)\]/.exec(line)![1])).toEqual(['SCHEMA_VIOLATION', 'UNKNOWN_ID']);
  });

  it('does not run the localization stage when the canonical curriculum is invalid', () => {
    const root = workspace({
      'curriculum/manifest.json': json({ schemaVersion: 2, curriculumVersion: '1.0.0' }),
      'curriculum/competencies/a.json': json(competency('a')),
      'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'T', competencyIds: ['a'] }),
      'curriculum/locales/fr/competencies/a.json': '{}',
    });
    const output = run(root);
    expect(output.status).toBe(1);
    expect(output.stderr).toContain('structural stage');
    expect(output.stderr).not.toContain('UNSUPPORTED_LOCALE');
  });

  it('rejects an unknown option', () => {
    const output = run(repository(), '--strict');
    expect(output.status).toBe(1);
    expect(output.stderr).toContain('Unknown option --strict');
  });
});
