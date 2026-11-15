import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv/dist/2020.js';
import { competencySourceHash, trackSourceHash } from './localization-hash.js';

/** Locale directory names under `curriculum/locales/` accepted by localization contract 1. */
export const SUPPORTED_LOCALES: readonly string[] = ['pt-BR'];
export const LOCALES_DIRECTORY = 'curriculum/locales';

export type OverlayKind = 'competency' | 'track';
const KIND_DIRECTORIES: Record<OverlayKind, string> = { competency: 'competencies', track: 'tracks' };

export type LocalizationIssueCode =
  | 'UNEXPECTED_ENTRY'
  | 'UNSUPPORTED_LOCALE'
  | 'INVALID_JSON'
  | 'UNSUPPORTED_LOCALIZATION_VERSION'
  | 'SCHEMA_VIOLATION'
  | 'LOCALE_MISMATCH'
  | 'KIND_MISMATCH'
  | 'FILE_ID_MISMATCH'
  | 'UNKNOWN_ID'
  | 'NOT_NFC'
  | 'DUPLICATE_OVERLAY'
  | 'STALE_TRANSLATION'
  | 'OUTDATED_REVIEWED_TRANSLATION'
  | 'DRAFT_NOT_PUBLISHABLE';

export interface LocalizationIssue {
  code: LocalizationIssueCode;
  severity: 'error' | 'warning';
  /** Repository-relative path, using forward slashes. */
  file: string;
  message: string;
}

/** One overlay file as found on disk, before any validation of its content. */
export interface OverlayFile {
  file: string;
  /** Locale taken from the directory name, kind from `competencies/` or `tracks/`. */
  directoryLocale: string;
  directoryKind: OverlayKind;
  /** File name without `.json`. */
  fileId: string;
  data: unknown;
}

export interface LocalizationOptions {
  /** Release mode: reviewed translations whose source hash is stale are errors. */
  strictTranslations?: boolean;
}

export interface LocalizationSummary {
  mode: 'development' | 'strict';
  locales: {
    locale: string;
    competencies: OverlayCounts & { missing: number };
    tracks: OverlayCounts & { missing: number };
  }[];
}

export interface OverlayCounts {
  total: number;
  /** Reviewed and current: the only translations a consumer may show. */
  publishable: number;
  draft: number;
  /** Source hash differs from the current English metadata (derived, never stored). */
  outdated: number;
}

export interface LocalizationResult {
  errors: LocalizationIssue[];
  warnings: LocalizationIssue[];
  summary: LocalizationSummary;
}

/** The canonical metadata that overlays are checked against. */
export interface LocalizationCatalog {
  competencies: { id: string; title: string; summary: string }[];
  tracks: { id: string; title: string }[];
}

// ---- Schema ------------------------------------------------------------------------------

const schema = JSON.parse(
  readFileSync(new URL('../curriculum/schema/localization.schema.json', import.meta.url), 'utf8'),
);
const ajv = new Ajv2020({
  strict: true, allErrors: true, coerceTypes: false, useDefaults: false,
  removeAdditional: false, ownProperties: true,
});
ajv.addSchema(schema);
const schemaId = schema.$id as string;
const validators: Record<OverlayKind, ValidateFunction> = {
  competency: ajv.getSchema(`${schemaId}#/$defs/competencyOverlay`)!,
  track: ajv.getSchema(`${schemaId}#/$defs/trackOverlay`)!,
};

function schemaMessages(data: unknown): string[] {
  const kind = typeof data === 'object' && data !== null ? (data as { kind?: unknown }).kind : undefined;
  if (kind !== 'competency' && kind !== 'track') {
    return ['"kind" must be "competency" or "track"; no other property was checked'];
  }
  const validate = validators[kind];
  if (validate(data)) return [];
  return (validate.errors ?? []).map((error) => {
    const property: unknown = error.keyword === 'required'
      ? error.params.missingProperty
      : error.keyword === 'additionalProperties' ? error.params.additionalProperty : undefined;
    const suffix = typeof property === 'string' ? `/${property}` : '';
    return `${error.instancePath}${suffix || ''} ${error.message ?? 'is invalid'} [${error.keyword}]`.trim();
  });
}

// ---- Loading -----------------------------------------------------------------------------

const compareText = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function entryKind(path: string): 'file' | 'directory' | 'other' | undefined {
  const stats = lstatSync(path, { throwIfNoEntry: false });
  if (stats === undefined) return undefined;
  return stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other';
}

export interface LoadedOverlays {
  /** False when `curriculum/locales` does not exist: localization is simply absent. */
  present: boolean;
  overlays: OverlayFile[];
  errors: LocalizationIssue[];
}

/**
 * Read every overlay under `curriculum/locales/<locale>/{competencies,tracks}/<id>.json`.
 * Nothing is followed through symbolic links, validated, or written. Unsupported locale
 * directories and stray entries are reported and never read.
 */
export function loadLocalizationOverlays(rootDir: string): LoadedOverlays {
  const errors: LocalizationIssue[] = [];
  const overlays: OverlayFile[] = [];
  const unexpected = (file: string, expectation: string): void => {
    errors.push({
      code: 'UNEXPECTED_ENTRY', severity: 'error', file,
      message: `${file} is not allowed here. ${expectation}`,
    });
  };

  const rootKind = entryKind(join(rootDir, LOCALES_DIRECTORY));
  if (rootKind === undefined) return { present: false, overlays, errors };
  if (rootKind !== 'directory') {
    unexpected(LOCALES_DIRECTORY, `${LOCALES_DIRECTORY} must be a real directory, not a file or symbolic link. Nothing was read through it.`);
    return { present: true, overlays, errors };
  }

  for (const locale of readdirSync(join(rootDir, LOCALES_DIRECTORY)).sort(compareText)) {
    const localeDirectory = `${LOCALES_DIRECTORY}/${locale}`;
    if (entryKind(join(rootDir, localeDirectory)) !== 'directory') {
      unexpected(localeDirectory, `${LOCALES_DIRECTORY} may contain only locale directories.`);
      continue;
    }
    if (!SUPPORTED_LOCALES.includes(locale)) {
      errors.push({
        code: 'UNSUPPORTED_LOCALE', severity: 'error', file: localeDirectory,
        message: `"${locale}" is not a supported locale. Supported locales: ${SUPPORTED_LOCALES.join(', ')}.`,
      });
      continue;
    }
    const containers = readdirSync(join(rootDir, localeDirectory)).sort(compareText);
    for (const container of containers) {
      const directory = `${localeDirectory}/${container}`;
      const kind = (Object.keys(KIND_DIRECTORIES) as OverlayKind[])
        .find((candidate) => KIND_DIRECTORIES[candidate] === container);
      if (kind === undefined || entryKind(join(rootDir, directory)) !== 'directory') {
        unexpected(directory, `${localeDirectory} may contain only the directories "competencies" and "tracks".`);
        continue;
      }
      for (const name of readdirSync(join(rootDir, directory)).sort(compareText)) {
        const file = `${directory}/${name}`;
        if (!name.endsWith('.json') || entryKind(join(rootDir, file)) !== 'file') {
          unexpected(file, `${directory} may contain only regular <id>.json files.`);
          continue;
        }
        let data: unknown;
        try {
          data = JSON.parse(readFileSync(join(rootDir, file), 'utf8'));
        } catch (error) {
          if (!(error instanceof SyntaxError)) throw error;
          // The parser message can quote file content, so it is deliberately not repeated.
          errors.push({
            code: 'INVALID_JSON', severity: 'error', file,
            message: `${file} is not valid JSON. Correct its syntax; a JSON-aware editor will locate the error.`,
          });
          continue;
        }
        overlays.push({
          file, directoryLocale: locale, directoryKind: kind,
          fileId: name.slice(0, -'.json'.length), data,
        });
      }
    }
  }
  return { present: true, overlays, errors };
}

// ---- Validation --------------------------------------------------------------------------

interface ParsedOverlay {
  kind: OverlayKind;
  locale: string;
  id: string;
  title: string;
  summary?: string;
  status: 'draft' | 'reviewed';
  provenance: { sourceHash: string };
}

function nonNfcStrings(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return value === value.normalize('NFC') ? [] : [path || '/'];
  if (Array.isArray(value)) return value.flatMap((item, index) => nonNfcStrings(item, `${path}/${index}`));
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).flatMap(([key, item]) => nonNfcStrings(item, `${path}/${key}`));
  }
  return [];
}

const emptyCounts = (): OverlayCounts => ({ total: 0, publishable: 0, draft: 0, outdated: 0 });

/**
 * Validate loaded overlays against the canonical catalog. Pure: it reads nothing. Missing
 * translations are never reported as problems; they only appear in the coverage summary.
 */
export function validateLocalizationOverlays(
  overlays: readonly OverlayFile[], catalog: LocalizationCatalog, options: LocalizationOptions = {},
): LocalizationResult {
  const strict = options.strictTranslations === true;
  const errors: LocalizationIssue[] = [];
  const warnings: LocalizationIssue[] = [];
  const error = (code: LocalizationIssueCode, file: string, message: string): void => {
    errors.push({ code, severity: 'error', file, message });
  };
  const warning = (code: LocalizationIssueCode, file: string, message: string): void => {
    warnings.push({ code, severity: 'warning', file, message });
  };

  const competencies = new Map(catalog.competencies.map((record) => [record.id, record]));
  const tracks = new Map(catalog.tracks.map((record) => [record.id, record]));
  const seen = new Map<string, string>();
  const counts = new Map<string, { competency: OverlayCounts; track: OverlayCounts }>();
  const countsFor = (locale: string) => {
    let entry = counts.get(locale);
    if (entry === undefined) counts.set(locale, entry = { competency: emptyCounts(), track: emptyCounts() });
    return entry;
  };
  for (const locale of SUPPORTED_LOCALES) countsFor(locale);

  for (const overlay of overlays) {
    const { file, data } = overlay;
    const version = typeof data === 'object' && data !== null
      ? (data as { localizationVersion?: unknown }).localizationVersion : undefined;
    if (version !== undefined && version !== 1) {
      error('UNSUPPORTED_LOCALIZATION_VERSION', file,
        `${file} declares an unsupported localizationVersion; only version 1 is understood. It was not interpreted further.`);
      continue;
    }
    const problems = schemaMessages(data);
    if (problems.length > 0) {
      for (const problem of problems) {
        error('SCHEMA_VIOLATION', file, `${file}: ${problem}. Remove forbidden fields and satisfy curriculum/schema/localization.schema.json.`);
      }
      continue;
    }
    const parsed = data as ParsedOverlay;
    let consistent = true;

    if (parsed.locale !== overlay.directoryLocale) {
      consistent = false;
      error('LOCALE_MISMATCH', file, `${file} declares locale "${parsed.locale}" but is stored under "${overlay.directoryLocale}". Make them agree.`);
    }
    if (parsed.kind !== overlay.directoryKind) {
      consistent = false;
      error('KIND_MISMATCH', file, `${file} declares kind "${parsed.kind}" but is stored in the "${KIND_DIRECTORIES[overlay.directoryKind]}" directory. Move it to "${KIND_DIRECTORIES[parsed.kind]}".`);
    }
    if (parsed.id !== overlay.fileId) {
      consistent = false;
      error('FILE_ID_MISMATCH', file, `${file} declares id "${parsed.id}" that differs from its file name. A record for "${parsed.id}" belongs in a file named ${parsed.id}.json.`);
    }
    for (const path of nonNfcStrings(data)) {
      consistent = false;
      error('NOT_NFC', file, `${file}: the value at ${path} is not Unicode NFC normalized. Re-save the text in NFC form.`);
    }

    const competencySource = parsed.kind === 'competency' ? competencies.get(parsed.id) : undefined;
    const trackSource = parsed.kind === 'track' ? tracks.get(parsed.id) : undefined;
    if (competencySource === undefined && trackSource === undefined) {
      error('UNKNOWN_ID', file, `${file} translates ${parsed.kind} "${parsed.id}", which does not exist in the curriculum. Overlays cannot create entities.`);
      continue;
    }

    const key = `${parsed.locale}/${parsed.kind}/${parsed.id}`;
    const previous = seen.get(key);
    if (previous !== undefined) {
      error('DUPLICATE_OVERLAY', file, `${file} duplicates the overlay in ${previous} for ${parsed.kind} "${parsed.id}" in ${parsed.locale}. Keep exactly one.`);
      continue;
    }
    seen.set(key, file);
    if (!consistent) continue;

    const expected = competencySource !== undefined
      ? competencySourceHash(competencySource.title, competencySource.summary)
      : trackSourceHash(trackSource!.title);
    const outdated = parsed.provenance.sourceHash !== expected;
    const tally = countsFor(parsed.locale)[parsed.kind];
    tally.total += 1;
    if (parsed.status === 'draft') tally.draft += 1;
    if (outdated) tally.outdated += 1;
    if (parsed.status === 'reviewed' && !outdated) tally.publishable += 1;

    if (outdated) {
      const detail = `${file}: provenance.sourceHash does not match the current English metadata of ${parsed.kind} "${parsed.id}" (expected ${expected}).`;
      if (strict && parsed.status === 'reviewed') {
        error('OUTDATED_REVIEWED_TRANSLATION', file, `${detail} A reviewed translation must be current for release. Re-translate and re-review it, or return it to draft.`);
      } else {
        warning('STALE_TRANSLATION', file, `${detail} It is outdated and falls back to English.`);
      }
    }
    if (strict && parsed.status === 'draft') {
      warning('DRAFT_NOT_PUBLISHABLE', file, `${file} is a draft and is not publishable; consumers must show English.`);
    }
  }

  const summary: LocalizationSummary = {
    mode: strict ? 'strict' : 'development',
    locales: [...counts.entries()].sort(([a], [b]) => compareText(a, b)).map(([locale, entry]) => ({
      locale,
      competencies: { ...entry.competency, missing: catalog.competencies.length - entry.competency.total },
      tracks: { ...entry.track, missing: catalog.tracks.length - entry.track.total },
    })),
  };
  return { errors, warnings, summary };
}

/** Load and validate every overlay under `rootDir`. `present` is false when there are none to check. */
export function validateLocalization(
  rootDir: string, catalog: LocalizationCatalog, options: LocalizationOptions = {},
): LocalizationResult & { present: boolean } {
  const loaded = loadLocalizationOverlays(rootDir);
  const result = validateLocalizationOverlays(loaded.overlays, catalog, options);
  return { ...result, errors: [...loaded.errors, ...result.errors], present: loaded.present };
}
