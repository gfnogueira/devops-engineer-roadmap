import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { loadCurriculum } from '../scripts/load-curriculum.js';
import { parseMarkdown } from '../scripts/markdown-references.js';
import { validateCurriculum } from '../scripts/validate-curriculum.js';
import { validateCurriculumSemantics } from '../scripts/validate-curriculum-semantics.js';
import { validateContentReferences, type ContentCatalog } from '../scripts/validate-content-references.js';
import {
  PREREQUISITE_CLOSED_TRACK_IDS, validateCurriculumRepository, validatePrerequisiteClosure,
} from '../scripts/validate-curriculum-repository.js';

// Acceptance tests for the real curriculum in this repository. The expected values below are
// deliberate: adding, removing, or reordering production content requires editing this file.
const root = fileURLToPath(new URL('..', import.meta.url));

const APPROVED_COMPETENCIES = {
  'git-change-management': { prerequisites: ['terminal-file-operations'], assessmentRevision: 1 },
  'local-access-and-secrets': { prerequisites: ['terminal-file-operations'], assessmentRevision: 1 },
  'terminal-file-operations': { prerequisites: [], assessmentRevision: 2 },
};
const FOUNDATIONS_ORDER = ['terminal-file-operations', 'local-access-and-secrets', 'git-change-management'];

interface ProductionCatalog extends ContentCatalog {
  manifest: unknown;
  competencies: (ContentCatalog['competencies'][number] & {
    level: string; prerequisites: string[]; assessmentRevision: number;
  })[];
  tracks: { id: string; title: string; competencyIds: string[] }[];
}

function production() {
  const loaded = loadCurriculum(root);
  if (!loaded.ok) throw new Error(`Production curriculum failed to load: ${JSON.stringify(loaded.errors)}`);
  return { ...loaded, catalog: loaded.catalog as unknown as ProductionCatalog };
}

describe('production curriculum', () => {
  it('declares schema version 1 and curriculum version 0.1.0', () => {
    expect(production().catalog.manifest).toEqual({ schemaVersion: 1, curriculumVersion: '0.1.0' });
  });

  it('contains exactly the three approved Foundations competencies', () => {
    const { catalog, sources } = production();
    expect(Object.fromEntries(catalog.competencies.map(
      ({ id, prerequisites, assessmentRevision }) => [id, { prerequisites, assessmentRevision }],
    ))).toEqual(APPROVED_COMPETENCIES);
    expect(catalog.competencies.map(({ id }) => id)).toEqual(Object.keys(APPROVED_COMPETENCIES));
    expect(catalog.competencies.every(({ level }) => level === 'foundations')).toBe(true);
    expect(sources.competencies).toEqual(
      Object.keys(APPROVED_COMPETENCIES).map((id) => `curriculum/competencies/${id}.json`),
    );
    expect(catalog.competencies.map(({ content }) => content.path)).toEqual(
      Object.keys(APPROVED_COMPETENCIES).map((id) => `docs/modules/${id}.md`),
    );
  });

  it('contains exactly one track: Foundations, in the suggested learning order', () => {
    expect(production().catalog.tracks).toEqual([
      { id: 'foundations', title: 'Foundations', competencyIds: FOUNDATIONS_ORDER },
    ]);
  });

  it('passes structural and semantic validation', () => {
    const { catalog } = production();
    expect(validateCurriculum(catalog)).toEqual({ valid: true, errors: [] });
    expect(validateCurriculumSemantics(catalog)).toEqual({ valid: true, errors: [] });
  });

  it('resolves every content path, required anchor, and internal link', () => {
    const result = validateContentReferences(production().catalog, root);
    expect(result).toMatchObject({ valid: true, errors: [] });
    if (!result.valid) return;
    // Guard against a check that passes because it inspected nothing.
    expect(result.summary.markdownFiles).toBeGreaterThanOrEqual(6);
    expect(result.summary.internalLinks).toBeGreaterThan(0);
  });

  it('keeps every Foundations prerequisite inside the Foundations track', () => {
    expect(PREREQUISITE_CLOSED_TRACK_IDS).toEqual(['foundations']);
    expect(validatePrerequisiteClosure(production().catalog, PREREQUISITE_CLOSED_TRACK_IDS)).toEqual([]);
  });

  it('aggregates deterministically and writes no generated catalog', () => {
    const first = production();
    expect(production()).toEqual(first);
    expect(JSON.stringify(production().catalog)).toBe(JSON.stringify(first.catalog));
    expect(existsSync(new URL('../curriculum/catalog.json', import.meta.url))).toBe(false);
  });

  it('passes the complete repository validation used by npm run validate:curriculum', () => {
    expect(validateCurriculumRepository(root, PREREQUISITE_CLOSED_TRACK_IDS)).toMatchObject({
      valid: true,
      summary: {
        curriculumVersion: '0.1.0',
        competencyIds: Object.keys(APPROVED_COMPETENCIES),
        tracks: [{ id: 'foundations', competencyIds: FOUNDATIONS_ORDER }],
      },
    });
  });

  it('runs the validation command with Node alone and exits successfully', () => {
    const output = execFileSync(process.execPath, ['scripts/validate-curriculum-cli.ts'], {
      cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    });
    expect(output).toContain('Curriculum 0.1.0 is valid.');
    expect(output).toContain(`Track "foundations" (3): ${FOUNDATIONS_ORDER.join(', ')}`);
  });
});

describe('Foundations learning-path navigation', () => {
  const page = 'docs/learning-paths/foundations.md';
  const targets = () => parseMarkdown(readFileSync(new URL(`../${page}`, import.meta.url), 'utf8'))
    .links.map(({ target }) => target);

  it('links to each module, its objectives, and its completion criteria in the suggested order', () => {
    const moduleLinks = targets().filter((target) => /^\.\.\/modules\/[a-z-]+\.md$/.test(target));
    expect([...new Set(moduleLinks)]).toEqual(FOUNDATIONS_ORDER.map((id) => `../modules/${id}.md`));
    for (const id of FOUNDATIONS_ORDER) {
      expect(targets()).toContain(`../modules/${id}.md#learning-objectives`);
      expect(targets()).toContain(`../modules/${id}.md#completion-criteria`);
    }
  });

  it('is reachable from every module', () => {
    for (const id of FOUNDATIONS_ORDER) {
      const links = parseMarkdown(readFileSync(new URL(`../docs/modules/${id}.md`, import.meta.url), 'utf8')).links;
      expect(links.map(({ target }) => target)).toContain('../learning-paths/foundations.md');
    }
  });
});
