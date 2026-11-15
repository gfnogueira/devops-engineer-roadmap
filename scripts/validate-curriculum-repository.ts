import { loadCurriculum, type CurriculumSources, type LoadIssue } from './load-curriculum.js';
import type { ValidationIssue } from './validate-curriculum.js';
import { validateCurriculumSemantics, type SemanticIssue } from './validate-curriculum-semantics.js';
import {
  validateContentReferences, type ContentCatalog, type ContentIssue, type ContentSummary,
} from './validate-content-references.js';
import {
  validateLocalization, type LocalizationCatalog, type LocalizationIssue, type LocalizationOptions, type LocalizationSummary,
} from './validate-localization.js';

/**
 * Tracks of the production curriculum that must contain every prerequisite of their members.
 * This is a production acceptance rule for the listed tracks, not a rule for every catalog.
 */
export const PREREQUISITE_CLOSED_TRACK_IDS: readonly string[] = ['foundations'];

export type AcceptanceErrorCode = 'REQUIRED_TRACK_MISSING' | 'PREREQUISITE_OUTSIDE_TRACK';

export interface AcceptanceIssue {
  code: AcceptanceErrorCode;
  trackId: string;
  /** JSON Pointer into the catalog. */
  path: string;
  message: string;
  competencyId?: string;
  prerequisiteId?: string;
}

export interface RepositorySummary extends ContentSummary {
  curriculumVersion: string;
  competencyIds: string[];
  tracks: { id: string; competencyIds: string[] }[];
}

export interface LocalizationReport {
  warnings: LocalizationIssue[];
  summary: LocalizationSummary;
}

export type RepositoryValidationResult =
  /** `localization` is present only when `curriculum/locales` exists. */
  | { valid: true; summary: RepositorySummary; localization?: LocalizationReport }
  | { valid: false; stage: 'load'; errors: LoadIssue[] }
  | { valid: false; stage: 'structural'; errors: ValidationIssue[]; sources: CurriculumSources }
  | { valid: false; stage: 'semantic'; errors: SemanticIssue[]; sources: CurriculumSources }
  | {
    valid: false; stage: 'content';
    errors: (ContentIssue | AcceptanceIssue)[]; sources: CurriculumSources;
  }
  | {
    valid: false; stage: 'localization';
    errors: LocalizationIssue[]; warnings: LocalizationIssue[]; summary: LocalizationSummary;
  };

// Fields read after the schema and semantic validators have accepted the aggregate.
interface ValidatedCatalog extends ContentCatalog {
  manifest: { curriculumVersion: string };
  competencies: (ContentCatalog['competencies'][number] & { prerequisites: string[] })[];
  tracks: { id: string; competencyIds: string[] }[];
}

/** Report required tracks that are absent or that omit a prerequisite of one of their members. */
export function validatePrerequisiteClosure(
  catalog: Pick<ValidatedCatalog, 'tracks'> & {
    competencies: { id: string; prerequisites: string[] }[];
  },
  trackIds: readonly string[],
): AcceptanceIssue[] {
  const errors: AcceptanceIssue[] = [];
  const competencyIndexes = new Map(catalog.competencies.map(({ id }, index) => [id, index]));
  for (const trackId of trackIds) {
    const track = catalog.tracks.find(({ id }) => id === trackId);
    if (track === undefined) {
      errors.push({
        code: 'REQUIRED_TRACK_MISSING', trackId, path: '/tracks',
        message: `The production curriculum requires track "${trackId}". Add curriculum/tracks/${trackId}.json.`,
      });
      continue;
    }
    const members = new Set(track.competencyIds);
    for (const competencyId of track.competencyIds) {
      const index = competencyIndexes.get(competencyId);
      if (index === undefined) continue;
      catalog.competencies[index]!.prerequisites.forEach((prerequisiteId, referenceIndex) => {
        if (members.has(prerequisiteId)) return;
        errors.push({
          code: 'PREREQUISITE_OUTSIDE_TRACK', trackId, competencyId, prerequisiteId,
          path: `/competencies/${index}/prerequisites/${referenceIndex}`,
          message: `Track "${trackId}" contains "${competencyId}" but not its prerequisite "${prerequisiteId}". Add the prerequisite to the track.`,
        });
      });
    }
  }
  return errors;
}

/**
 * Load the curriculum under `rootDir` and run every producer-side check in order:
 * loading, structure, graph semantics, then content references together with prerequisite
 * closure of `closedTrackIds`, then localization overlays when `curriculum/locales` exists.
 * A failing stage stops later stages. Nothing is written. Without overlays the result is
 * identical to the one produced before localization existed.
 */
export function validateCurriculumRepository(
  rootDir: string, closedTrackIds: readonly string[] = [], localization: LocalizationOptions = {},
): RepositoryValidationResult {
  const loaded = loadCurriculum(rootDir);
  if (!loaded.ok) return { valid: false, stage: 'load', errors: loaded.errors };
  const { sources } = loaded;

  // The semantic entry point runs the structural validator first and reports which stage failed.
  const checked = validateCurriculumSemantics(loaded.catalog);
  if (!checked.valid) {
    return checked.stage === 'structural'
      ? { valid: false, stage: 'structural', errors: checked.errors, sources }
      : { valid: false, stage: 'semantic', errors: checked.errors, sources };
  }

  const catalog = loaded.catalog as unknown as ValidatedCatalog;
  const content = validateContentReferences(catalog, rootDir);
  const errors = [...content.errors, ...validatePrerequisiteClosure(catalog, closedTrackIds)];
  if (!content.valid || errors.length > 0) {
    return { valid: false, stage: 'content', errors, sources };
  }
  const translations = validateLocalization(rootDir, {
    competencies: catalog.competencies as unknown as LocalizationCatalog['competencies'],
    tracks: catalog.tracks as unknown as { id: string; title: string }[],
  }, localization);
  if (translations.errors.length > 0) {
    return {
      valid: false, stage: 'localization',
      errors: translations.errors, warnings: translations.warnings, summary: translations.summary,
    };
  }
  return {
    valid: true,
    ...(translations.present
      ? { localization: { warnings: translations.warnings, summary: translations.summary } }
      : {}),
    summary: {
      curriculumVersion: catalog.manifest.curriculumVersion,
      competencyIds: catalog.competencies.map(({ id }) => id),
      tracks: catalog.tracks.map(({ id, competencyIds }) => ({ id, competencyIds: [...competencyIds] })),
      ...content.summary,
    },
  };
}
