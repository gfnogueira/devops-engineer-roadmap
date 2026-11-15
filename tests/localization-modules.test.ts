import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { competencySourceHash, moduleCanonicalSource, moduleSourceHash, trackSourceHash } from '../scripts/localization-hash.js';
import {
  compareModuleStructure, loadTranslatedMarkdown, validateLocalization, validateLocalizationOverlays,
  type CanonicalModule, type LocalizationCatalog, type OverlayFile, type TranslatedMarkdown,
} from '../scripts/validate-localization.js';
import { validateCurriculumRepository } from '../scripts/validate-curriculum-repository.js';
import { competency, json, workspace } from './support/workspace.js';

// Everything here is synthetic. No real translated module or production module hash is used.
const ENGLISH = [
  '# Synthetic module', '', '## Learning Objectives', '',
  '- Read the [reference](https://example.com/docs) and run the example.', '',
  '## Steps', '', '```sh', '# keep this comment', 'echo "hello"', '```', '',
  '## Completion Criteria', '', 'Return to the [objectives](#learning-objectives).', '',
].join('\n');
const TRANSLATED = [
  '# Módulo sintético', '', '## Objetivos de Aprendizagem', '',
  '- Leia a [referência](https://example.com/docs) e execute o exemplo.', '',
  '## Passos', '', '```sh', '# keep this comment', 'echo "hello"', '```', '',
  '## Critérios de Conclusão', '', 'Volte aos [objetivos](#objetivos-de-aprendizagem).', '',
].join('\n');

const CANONICAL: CanonicalModule = {
  id: 'a', path: 'docs/modules/a.md', markdown: ENGLISH,
  objectivesAnchor: 'learning-objectives', completionCriteriaAnchor: 'completion-criteria',
};
const CATALOG: LocalizationCatalog = {
  competencies: [{ id: 'a', title: 'Synthetic capability', summary: 'Synthetic test record.' }],
  tracks: [{ id: 'foundations', title: 'Synthetic track' }],
  modules: [CANONICAL],
};
const HASH = moduleSourceHash(ENGLISH);
const STALE = `sha256:${'0'.repeat(64)}`;

function moduleOverlay(status: 'draft' | 'reviewed' = 'draft', sourceHash = HASH, id = 'a') {
  return {
    localizationVersion: 1, kind: 'module', locale: 'pt-BR', id, status,
    provenance: {
      sourceHash, method: 'machine-assisted', translatedBy: 'synthetic-translator',
      ...(status === 'reviewed' ? { reviewedBy: 'synthetic-reviewer', reviewedAt: '2026-01-02' } : {}),
    },
  };
}
const overlayFile = (data: unknown, id = 'a'): OverlayFile => ({
  file: `curriculum/locales/pt-BR/modules/${id}.json`,
  directoryLocale: 'pt-BR', directoryKind: 'module', fileId: id, data,
});
const markdownFile = (content: string, id = 'a', locale = 'pt-BR'): TranslatedMarkdown => ({
  file: `docs/locales/${locale}/modules/${id}.md`, locale, id, content,
});
const codes = (issues: { code: string }[]) => issues.map(({ code }) => code);
const check = (
  overlays: OverlayFile[], markdown: TranslatedMarkdown[], strict = false, catalog: LocalizationCatalog = CATALOG,
) => validateLocalizationOverlays(overlays, catalog, { strictTranslations: strict }, markdown);
const validDraft = () => check([overlayFile(moduleOverlay())], [markdownFile(TRANSLATED)]);

describe('module source hash', () => {
  it('is SHA-256 over the NFC UTF-8 canonical Markdown with no other normalization', () => {
    expect(moduleCanonicalSource('Café\r\n')).toBe('Café\r\n');
    expect(moduleSourceHash('Café')).toBe(moduleSourceHash('Café'));
    expect(moduleSourceHash('a\n')).not.toBe(moduleSourceHash('a\r\n'));
    expect(moduleSourceHash('a')).not.toBe(moduleSourceHash('a '));
    // sha256("a") with the contract prefix.
    expect(moduleSourceHash('a'))
      .toBe('sha256:ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb');
    expect(moduleSourceHash('a')).not.toBe(trackSourceHash('a'));
    expect(moduleSourceHash('a')).not.toBe(competencySourceHash('a', ''));
  });
});

describe('module overlay validation', () => {
  it('1. accepts a valid draft and a valid reviewed module overlay and counts them', () => {
    const draft = validDraft();
    expect(draft.errors).toEqual([]);
    expect(draft.warnings).toEqual([]);
    expect(draft.summary.locales[0]!.modules).toEqual({ total: 1, publishable: 0, draft: 1, outdated: 0, missing: 0 });

    const reviewed = check([overlayFile(moduleOverlay('reviewed'))], [markdownFile(TRANSLATED)], true);
    expect(reviewed.errors).toEqual([]);
    expect(reviewed.summary.locales[0]!.modules).toMatchObject({ publishable: 1, draft: 0 });
  });

  it('rejects unknown properties, a title, and a mismatched status and provenance', () => {
    const base = moduleOverlay();
    const invalid: unknown[] = [
      { ...base, title: 'Módulo' }, { ...base, path: 'docs/modules/a.md' }, { ...base, assessmentRevision: 1 },
      { ...base, status: 'reviewed' }, { ...moduleOverlay('reviewed'), status: 'draft' },
      { ...base, provenance: { ...base.provenance, extra: 1 } }, { ...base, locale: 'fr-FR' },
    ];
    for (const data of invalid) {
      expect(codes(check([overlayFile(data)], [markdownFile(TRANSLATED)]).errors), JSON.stringify(data))
        .toContain('SCHEMA_VIOLATION');
    }
  });

  it('rejects an overlay for an unknown module and a file name that disagrees with the ID', () => {
    expect(codes(check([overlayFile(moduleOverlay('draft', HASH, 'zzz'), 'zzz')], []).errors)).toEqual(['UNKNOWN_ID']);
    expect(codes(check([overlayFile(moduleOverlay(), 'b')], []).errors)).toEqual(['FILE_ID_MISMATCH']);
  });

  it('2. reports a missing translated Markdown file', () => {
    const result = check([overlayFile(moduleOverlay())], []);
    expect(codes(result.errors)).toEqual(['MISSING_TRANSLATED_MARKDOWN']);
    expect(result.errors[0]!.message).toContain('docs/locales/pt-BR/modules/a.md');
  });

  it('3. reports an orphaned translated Markdown file', () => {
    const result = check([], [markdownFile(TRANSLATED)]);
    expect(codes(result.errors)).toEqual(['ORPHANED_TRANSLATED_MARKDOWN']);
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(TRANSLATED), markdownFile(TRANSLATED, 'other')]).errors))
      .toEqual(['ORPHANED_TRANSLATED_MARKDOWN']);
  });

  it('4. reports an unsupported locale directory for overlays and for Markdown without reading either', () => {
    const root = workspace({
      'curriculum/locales/fr-FR/modules/a.json': json(moduleOverlay()),
      'docs/locales/fr-FR/modules/a.md': TRANSLATED,
    });
    const result = validateLocalization(root, CATALOG);
    expect(result.errors.map(({ code, file }) => `${code} ${file}`)).toEqual([
      'UNSUPPORTED_LOCALE curriculum/locales/fr-FR', 'UNSUPPORTED_LOCALE docs/locales/fr-FR',
    ]);
    expect(loadTranslatedMarkdown(root).files).toEqual([]);
  });

  it('5. treats a stale draft as a warning in both modes and skips structural comparison', () => {
    const stale = [overlayFile(moduleOverlay('draft', STALE))];
    const different = [markdownFile('# Only one heading\n')];
    for (const strict of [false, true]) {
      const result = check(stale, different, strict);
      expect(result.errors).toEqual([]);
      expect(codes(result.warnings)).toEqual(strict ? ['STALE_TRANSLATION', 'DRAFT_NOT_PUBLISHABLE'] : ['STALE_TRANSLATION']);
      expect(result.summary.locales[0]!.modules).toMatchObject({ draft: 1, outdated: 1, publishable: 0 });
    }
  });

  it('6. treats a stale reviewed translation as a warning in development and an error in strict mode', () => {
    const reviewed = [overlayFile(moduleOverlay('reviewed', STALE))];
    const development = check(reviewed, [markdownFile(TRANSLATED)]);
    expect(development.errors).toEqual([]);
    expect(codes(development.warnings)).toEqual(['STALE_TRANSLATION']);
    expect(development.summary.locales[0]!.modules).toMatchObject({ outdated: 1, publishable: 0 });
    const strict = check(reviewed, [markdownFile(TRANSLATED)], true);
    expect(codes(strict.errors)).toEqual(['OUTDATED_REVIEWED_TRANSLATION']);
    expect(strict.warnings).toEqual([]);
  });

  it('becomes stale when the English Markdown changes, independently of the competency hash', () => {
    const edited = { ...CANONICAL, markdown: `${ENGLISH}\nAn added sentence.\n` };
    const result = check([overlayFile(moduleOverlay('reviewed'))], [markdownFile(TRANSLATED)], false, { ...CATALOG, modules: [edited] });
    expect(codes(result.warnings)).toEqual(['STALE_TRANSLATION']);
  });

  it('7. rejects a heading structure mismatch and a document without exactly one H1', () => {
    const reordered = TRANSLATED.replace('## Passos', '### Passos');
    const result = check([overlayFile(moduleOverlay())], [markdownFile(reordered)]);
    expect(codes(result.errors)).toEqual(['HEADING_STRUCTURE_MISMATCH']);
    expect(result.errors[0]!.message).toContain('heading 3');

    const twoH1 = TRANSLATED.replace('## Passos', '# Passos');
    expect(check([overlayFile(moduleOverlay())], [markdownFile(twoH1)]).errors.map(({ message }) => message).join('\n'))
      .toContain('2 level-1 headings');
    const missing = TRANSLATED.replace('## Passos\n\n', '');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(missing)]).errors)).toContain('HEADING_STRUCTURE_MISMATCH');
  });

  it('8. rejects any change to fenced code, including comments, order and count', () => {
    const translatedComment = TRANSLATED.replace('# keep this comment', '# mantenha este comentário');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(translatedComment)]).errors)).toEqual(['FENCED_CODE_MISMATCH']);
    const removed = TRANSLATED.replace(/```sh[\s\S]*?```\n\n/, '');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(removed)]).errors)).toContain('FENCED_CODE_MISMATCH');
    const language = TRANSLATED.replace('```sh', '```bash');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(language)]).errors)).toEqual(['FENCED_CODE_MISMATCH']);
    const unclosed = `${TRANSLATED}\n\`\`\`sh\nnever closed\n`;
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(unclosed)]).errors)).toEqual(['FENCED_CODE_MISMATCH']);
  });

  it('9. rejects a changed, added or removed external URL and an unresolved in-page anchor', () => {
    const changed = TRANSLATED.replace('https://example.com/docs', 'https://example.org/docs');
    const result = check([overlayFile(moduleOverlay())], [markdownFile(changed)]);
    expect(codes(result.errors)).toEqual(['EXTERNAL_URL_MISMATCH']);
    expect(result.errors[0]!.message).toContain('https://example.org/docs');
    const added = `${TRANSLATED}\nSee https://example.net/extra.\n`;
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(added)]).errors)).toEqual(['EXTERNAL_URL_MISMATCH']);
    const bad = TRANSLATED.replace('#objetivos-de-aprendizagem', '#learning-objectives');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(bad)]).errors)).toEqual(['INVALID_INTERNAL_ANCHOR']);
  });

  it('10. maps objectives and completion-criteria headings by position', () => {
    const { problems, mapping } = compareModuleStructure(CANONICAL, markdownFile(TRANSLATED));
    expect(problems).toEqual([]);
    expect(mapping).toEqual({
      objectivesAnchor: 'objetivos-de-aprendizagem', completionCriteriaAnchor: 'critérios-de-conclusão',
    });

    // Ambiguous English anchor: two headings produce it, so no positional mapping exists.
    const duplicated: CanonicalModule = { ...CANONICAL, markdown: `${ENGLISH}\n## Learning Objectives\n` };
    const duplicatedTranslation = `${TRANSLATED}\n## Outro título\n`;
    expect(compareModuleStructure(duplicated, markdownFile(duplicatedTranslation)).problems.map(([code]) => code))
      .toEqual(['HEADING_MAPPING_INVALID']);

    // Missing English anchor.
    const missing = { ...CANONICAL, completionCriteriaAnchor: 'no-such-heading' };
    expect(compareModuleStructure(missing, markdownFile(TRANSLATED)).problems.map(([code]) => code))
      .toEqual(['HEADING_MAPPING_INVALID']);

    // The translated counterpart must produce one unique anchor.
    const clash = TRANSLATED.replace('## Passos', '## Objetivos de Aprendizagem');
    expect(compareModuleStructure(CANONICAL, markdownFile(clash)).problems.map(([code]) => code))
      .toContain('HEADING_MAPPING_INVALID');

    // Both anchors identifying one heading are ambiguous.
    const same = { ...CANONICAL, completionCriteriaAnchor: 'learning-objectives' };
    expect(compareModuleStructure(same, markdownFile(TRANSLATED)).problems.map(([code]) => code))
      .toEqual(['HEADING_MAPPING_INVALID']);
  });

  it('11. normalizes to NFC for hashing and requires NFC translated Markdown', () => {
    const decomposedEnglish = { ...CANONICAL, markdown: ENGLISH.replace('Synthetic', 'Synthetić') };
    const composedEnglish = { ...CANONICAL, markdown: ENGLISH.replace('Synthetic', 'Synthetić') };
    expect(moduleSourceHash(decomposedEnglish.markdown)).toBe(moduleSourceHash(composedEnglish.markdown));
    const overlay = overlayFile(moduleOverlay('draft', moduleSourceHash(composedEnglish.markdown)));
    expect(check([overlay], [markdownFile(TRANSLATED)], false, { ...CATALOG, modules: [decomposedEnglish] }).errors).toEqual([]);

    const decomposed = TRANSLATED.replace('sintético', 'sintetíco');
    expect(codes(check([overlayFile(moduleOverlay())], [markdownFile(decomposed)]).errors)).toEqual(['NOT_NFC']);
  });

  it('12. reports no module problems and only zero coverage when there are no module overlays', () => {
    for (const strict of [false, true]) {
      const result = check([], [], strict);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.summary.locales[0]!.modules).toEqual({ total: 0, publishable: 0, draft: 0, outdated: 0, missing: 1 });
    }
  });

  it('keeps module review status independent of competency and track overlays', () => {
    const competencyDraft = {
      localizationVersion: 1, kind: 'competency', locale: 'pt-BR', id: 'a',
      title: 'Capacidade sintética', summary: 'Registro sintético de teste.', status: 'draft',
      provenance: {
        sourceHash: competencySourceHash('Synthetic capability', 'Synthetic test record.'),
        method: 'human', translatedBy: 'synthetic-translator',
      },
    };
    const trackReviewed = {
      localizationVersion: 1, kind: 'track', locale: 'pt-BR', id: 'foundations', title: 'Trilha sintética',
      status: 'reviewed', provenance: {
        sourceHash: trackSourceHash('Synthetic track'), method: 'human', translatedBy: 'synthetic-translator',
        reviewedBy: 'synthetic-reviewer', reviewedAt: '2026-01-02',
      },
    };
    const result = check([
      { file: 'curriculum/locales/pt-BR/competencies/a.json', directoryLocale: 'pt-BR', directoryKind: 'competency', fileId: 'a', data: competencyDraft },
      { file: 'curriculum/locales/pt-BR/tracks/foundations.json', directoryLocale: 'pt-BR', directoryKind: 'track', fileId: 'foundations', data: trackReviewed },
      overlayFile(moduleOverlay('reviewed')),
    ], [markdownFile(TRANSLATED)], true);
    expect(result.errors).toEqual([]);
    expect(result.summary.locales[0]).toMatchObject({
      competencies: { draft: 1, publishable: 0 }, tracks: { draft: 0, publishable: 1 }, modules: { draft: 0, publishable: 1 },
    });
  });
});

describe('module loading and repository integration', () => {
  const cli = fileURLToPath(new URL('../scripts/validate-curriculum-cli.ts', import.meta.url));
  const aHash = competencySourceHash('Synthetic capability', 'Synthetic test record.');
  const competencyOverlay = {
    localizationVersion: 1, kind: 'competency', locale: 'pt-BR', id: 'a',
    title: 'Capacidade sintética', summary: 'Registro sintético de teste.', status: 'reviewed',
    provenance: {
      sourceHash: aHash, method: 'human', translatedBy: 'synthetic-translator',
      reviewedBy: 'synthetic-reviewer', reviewedAt: '2026-01-02',
    },
  };

  function repository(extra: Record<string, string> = {}) {
    return workspace({
      'curriculum/manifest.json': json({ schemaVersion: 1, curriculumVersion: '9.8.7' }),
      'curriculum/competencies/a.json': json(competency('a')),
      'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'Synthetic track', competencyIds: ['a'] }),
      'docs/modules/a.md': ENGLISH,
      ...extra,
    });
  }
  const run = (root: string, ...flags: string[]) => {
    const { status, stdout, stderr } = spawnSync(process.execPath, [cli, root, ...flags], { encoding: 'utf8' });
    return { status, stdout, stderr };
  };

  it('loads translated Markdown in a stable order and rejects stray entries and invalid UTF-8', () => {
    const root = workspace({
      'docs/locales/pt-BR/modules/b.md': 'B', 'docs/locales/pt-BR/modules/a.md': 'A',
      'docs/locales/pt-BR/modules/notes.txt': 'x', 'docs/locales/pt-BR/other/x.md': 'x',
      'docs/locales/README.md': 'x',
    });
    const loaded = loadTranslatedMarkdown(root);
    expect(loaded.files.map(({ file }) => file)).toEqual(['docs/locales/pt-BR/modules/a.md', 'docs/locales/pt-BR/modules/b.md']);
    expect(loaded.errors.map(({ code, file }) => `${code} ${file}`)).toEqual([
      'UNEXPECTED_ENTRY docs/locales/README.md', 'UNEXPECTED_ENTRY docs/locales/pt-BR/modules/notes.txt',
      'UNEXPECTED_ENTRY docs/locales/pt-BR/other',
    ]);
    expect(loadTranslatedMarkdown(workspace({ 'x': '' }))).toEqual({ present: false, files: [], errors: [] });
  });

  it('is unchanged without module overlays: only the modules coverage line is new', () => {
    const root = repository({ 'curriculum/locales/pt-BR/competencies/a.json': json(competencyOverlay) });
    const output = run(root, '--strict-translations');
    expect(output.status).toBe(0);
    expect(output.stdout).toContain('competencies 1 publishable, 0 draft, 0 outdated, 0 missing');
    expect(output.stdout).toContain('modules 0 publishable, 0 draft, 0 outdated, 1 missing');
    expect(validateCurriculumRepository(repository(), [])).not.toHaveProperty('localization');
  });

  it('validates a draft module end to end, including link checks of the translated file by the content stage', () => {
    const root = repository({
      'curriculum/locales/pt-BR/modules/a.json': json(moduleOverlay()),
      'docs/locales/pt-BR/modules/a.md': TRANSLATED,
    });
    const development = run(root);
    expect(development.status).toBe(0);
    expect(development.stdout).toContain('modules 0 publishable, 1 draft, 0 outdated, 0 missing');
    expect(run(root, '--strict-translations').stderr).toContain('[DRAFT_NOT_PUBLISHABLE] curriculum/locales/pt-BR/modules/a.json');

    const broken = repository({
      'curriculum/locales/pt-BR/modules/a.json': json(moduleOverlay()),
      'docs/locales/pt-BR/modules/a.md': `${TRANSLATED}\n[bad](../missing.md)\n`,
    });
    const result = run(broken);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('content stage');
  });

  it('fails a module with a missing file or a structural mismatch at the localization stage', () => {
    const missing = run(repository({ 'curriculum/locales/pt-BR/modules/a.json': json(moduleOverlay()) }));
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('[MISSING_TRANSLATED_MARKDOWN]');

    const mismatch = run(repository({
      'curriculum/locales/pt-BR/modules/a.json': json(moduleOverlay()),
      'docs/locales/pt-BR/modules/a.md': TRANSLATED.replace('echo "hello"', 'echo "olá"'),
    }));
    expect(mismatch.status).toBe(1);
    expect(mismatch.stderr).toContain('[FENCED_CODE_MISMATCH] docs/locales/pt-BR/modules/a.md');
  });
});
