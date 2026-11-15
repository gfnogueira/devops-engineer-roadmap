import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv/dist/2020.js';
import { competencySourceHash, moduleSourceHash, trackSourceHash } from './localization-hash.js';
import { parseMarkdown, type MarkdownDocument } from './markdown-references.js';

/** Locale directory names under `curriculum/locales/` accepted by localization contract 1. */
export const SUPPORTED_LOCALES: readonly string[] = ['pt-BR'];
export const LOCALES_DIRECTORY = 'curriculum/locales';

export const DOCUMENT_LOCALES_DIRECTORY = 'docs/locales';
const MODULE_ROOT = 'docs/modules/';

export type OverlayKind = 'competency' | 'track' | 'module';
const KIND_DIRECTORIES: Record<OverlayKind, string> = {
  competency: 'competencies', track: 'tracks', module: 'modules',
};

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
  | 'DRAFT_NOT_PUBLISHABLE'
  | 'INVALID_MARKDOWN_ENCODING'
  | 'MISSING_TRANSLATED_MARKDOWN'
  | 'ORPHANED_TRANSLATED_MARKDOWN'
  | 'HEADING_STRUCTURE_MISMATCH'
  | 'FENCED_CODE_MISMATCH'
  | 'EXTERNAL_URL_MISMATCH'
  | 'INVALID_INTERNAL_ANCHOR'
  | 'HEADING_MAPPING_INVALID';

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
  /** Locale taken from the directory name, kind from `competencies/`, `tracks/` or `modules/`. */
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
    modules: OverlayCounts & { missing: number };
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
  competencies: {
    id: string; title: string; summary: string;
    /** Canonical module location; used by {@link validateLocalization} to read the English Markdown. */
    content?: { path: string; objectivesAnchor: string; completionCriteriaAnchor: string };
  }[];
  tracks: { id: string; title: string }[];
  /** Canonical English modules, keyed by competency ID. Absent when no module source is available. */
  modules?: CanonicalModule[];
}

export interface CanonicalModule {
  /** Competency ID. */
  id: string;
  /** Repository-relative path of the English Markdown, used only in messages. */
  path: string;
  markdown: string;
  objectivesAnchor: string;
  completionCriteriaAnchor: string;
}

/** One translated Markdown file as found on disk: `docs/locales/<locale>/modules/<id>.md`. */
export interface TranslatedMarkdown {
  file: string;
  locale: string;
  /** File name without `.md`: the competency ID. */
  id: string;
  content: string;
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
  module: ajv.getSchema(`${schemaId}#/$defs/moduleOverlay`)!,
};

function schemaMessages(data: unknown): string[] {
  const kind = typeof data === 'object' && data !== null ? (data as { kind?: unknown }).kind : undefined;
  if (kind !== 'competency' && kind !== 'track' && kind !== 'module') {
    return ['"kind" must be "competency", "track" or "module"; no other property was checked'];
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
 * Read every overlay under `curriculum/locales/<locale>/{competencies,modules,tracks}/<id>.json`.
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
        unexpected(directory, `${localeDirectory} may contain only the directories "competencies", "modules" and "tracks".`);
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

export interface LoadedTranslatedMarkdown {
  /** False when `docs/locales` does not exist. */
  present: boolean;
  files: TranslatedMarkdown[];
  errors: LocalizationIssue[];
}

/**
 * Read every translated module under `docs/locales/<locale>/modules/<id>.md`. Nothing is followed
 * through symbolic links. Unsupported locale directories and stray entries are reported and never read.
 */
export function loadTranslatedMarkdown(rootDir: string): LoadedTranslatedMarkdown {
  const errors: LocalizationIssue[] = [];
  const files: TranslatedMarkdown[] = [];
  const unexpected = (file: string, expectation: string): void => {
    errors.push({
      code: 'UNEXPECTED_ENTRY', severity: 'error', file,
      message: `${file} is not allowed here. ${expectation}`,
    });
  };
  const rootKind = entryKind(join(rootDir, DOCUMENT_LOCALES_DIRECTORY));
  if (rootKind === undefined) return { present: false, files, errors };
  if (rootKind !== 'directory') {
    unexpected(DOCUMENT_LOCALES_DIRECTORY, `${DOCUMENT_LOCALES_DIRECTORY} must be a real directory, not a file or symbolic link. Nothing was read through it.`);
    return { present: true, files, errors };
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (const locale of readdirSync(join(rootDir, DOCUMENT_LOCALES_DIRECTORY)).sort(compareText)) {
    const localeDirectory = `${DOCUMENT_LOCALES_DIRECTORY}/${locale}`;
    if (entryKind(join(rootDir, localeDirectory)) !== 'directory') {
      unexpected(localeDirectory, `${DOCUMENT_LOCALES_DIRECTORY} may contain only locale directories.`);
      continue;
    }
    if (!SUPPORTED_LOCALES.includes(locale)) {
      errors.push({
        code: 'UNSUPPORTED_LOCALE', severity: 'error', file: localeDirectory,
        message: `"${locale}" is not a supported locale. Supported locales: ${SUPPORTED_LOCALES.join(', ')}.`,
      });
      continue;
    }
    for (const container of readdirSync(join(rootDir, localeDirectory)).sort(compareText)) {
      const directory = `${localeDirectory}/${container}`;
      if (container !== 'modules' || entryKind(join(rootDir, directory)) !== 'directory') {
        unexpected(directory, `${localeDirectory} may contain only the directory "modules".`);
        continue;
      }
      for (const name of readdirSync(join(rootDir, directory)).sort(compareText)) {
        const file = `${directory}/${name}`;
        if (!name.endsWith('.md') || entryKind(join(rootDir, file)) !== 'file') {
          unexpected(file, `${directory} may contain only regular <id>.md files.`);
          continue;
        }
        let content: string;
        try {
          content = decoder.decode(readFileSync(join(rootDir, file)));
        } catch (error) {
          if (!(error instanceof TypeError)) throw error;
          errors.push({
            code: 'INVALID_MARKDOWN_ENCODING', severity: 'error', file,
            message: `${file} is not valid UTF-8. Re-save it as UTF-8 text.`,
          });
          continue;
        }
        files.push({ file, locale, id: name.slice(0, -'.md'.length), content });
      }
    }
  }
  return { present: true, files, errors };
}

/** Read the English Markdown of every competency whose content path is a safe regular file. */
function canonicalModules(rootDir: string, competencies: LocalizationCatalog['competencies']): CanonicalModule[] {
  const modules: CanonicalModule[] = [];
  for (const { id, content } of competencies) {
    if (content === undefined) continue;
    const { path } = content;
    const segments = path.split('/');
    if (!path.startsWith(MODULE_ROOT) || !path.endsWith('.md') || segments.some((part) => part === '' || part === '.' || part === '..' || part.includes('\\'))) continue;
    let current = '';
    let regular = true;
    for (const [index, segment] of segments.entries()) {
      current = current === '' ? segment : `${current}/${segment}`;
      const kind = entryKind(join(rootDir, current));
      if (kind !== (index === segments.length - 1 ? 'file' : 'directory')) { regular = false; break; }
    }
    if (!regular) continue;
    modules.push({
      id, path, markdown: readFileSync(join(rootDir, path), 'utf8'),
      objectivesAnchor: content.objectivesAnchor, completionCriteriaAnchor: content.completionCriteriaAnchor,
    });
  }
  return modules;
}

// ---- Module structure --------------------------------------------------------------------

export interface HeadingMapping {
  /** Anchor of the translated heading that occupies the position of the English objectives heading. */
  objectivesAnchor: string;
  /** Anchor of the translated heading that occupies the position of the English completion-criteria heading. */
  completionCriteriaAnchor: string;
}

/**
 * Parity problems between canonical English Markdown and its translation, as `[code, message]`.
 * The mapping of the learning-objectives and completion-criteria headings is positional: the
 * English heading is located by its canonical anchor (it must be unique) and the translated
 * heading at the same position in the ordered heading list is its counterpart. The anchors of
 * the translation come from the same `headingAnchor` algorithm used everywhere else.
 */
export function compareModuleStructure(
  canonical: CanonicalModule, translated: TranslatedMarkdown,
): { problems: [LocalizationIssueCode, string][]; mapping?: HeadingMapping } {
  const problems: [LocalizationIssueCode, string][] = [];
  const english = parseMarkdown(canonical.markdown);
  const local = parseMarkdown(translated.content);
  const file = translated.file;

  for (const [label, document, name] of [['English', english, canonical.path], ['translated', local, file]] as const) {
    if (document.unclosedFence !== undefined) {
      problems.push(['FENCED_CODE_MISMATCH', `${file}: the ${label} document ${name} opens a fenced code block on line ${document.unclosedFence} that is never closed, so it cannot be compared.`]);
    }
  }
  if (problems.length > 0) return { problems };

  const h1 = local.headings.filter(({ level }) => level === 1).length;
  if (h1 !== 1) {
    problems.push(['HEADING_STRUCTURE_MISMATCH', `${file} has ${h1} level-1 headings; a module needs exactly one.`]);
  }
  const levels = (document: MarkdownDocument): string => document.headings.map(({ level }) => level).join(',');
  let structureMatches = true;
  if (levels(english) !== levels(local)) {
    structureMatches = false;
    const index = english.headings.findIndex(({ level }, position) => local.headings[position]?.level !== level);
    const position = index === -1 ? Math.min(english.headings.length, local.headings.length) : index;
    const expected = english.headings[position];
    const actual = local.headings[position];
    problems.push(['HEADING_STRUCTURE_MISMATCH',
      `${file} must have the same ordered heading levels as ${canonical.path} (${english.headings.length} headings, found ${local.headings.length}). `
      + `First difference at heading ${position + 1}: expected ${expected === undefined ? 'no heading' : `level ${expected.level} (English line ${expected.line})`}, `
      + `found ${actual === undefined ? 'no heading' : `level ${actual.level} on line ${actual.line}`}.`]);
  }

  const sameFences = english.fences.length === local.fences.length
    && english.fences.every((fence, index) => fence.info === local.fences[index]!.info && fence.body === local.fences[index]!.body);
  if (!sameFences) {
    const index = english.fences.findIndex((fence, position) =>
      fence.info !== local.fences[position]?.info || fence.body !== local.fences[position]?.body);
    const position = index === -1 ? Math.min(english.fences.length, local.fences.length) : index;
    problems.push(['FENCED_CODE_MISMATCH',
      `${file} must contain the same ordered fenced code blocks as ${canonical.path}, unchanged, including comments `
      + `(${english.fences.length} blocks, found ${local.fences.length}). First difference at block ${position + 1}.`]);
  }

  const missing = english.externalUrls.filter((url) => !local.externalUrls.includes(url));
  const extra = local.externalUrls.filter((url) => !english.externalUrls.includes(url));
  if (missing.length > 0 || extra.length > 0) {
    const list = (urls: string[]): string => (urls.length === 0 ? 'none' : urls.join(', '));
    problems.push(['EXTERNAL_URL_MISMATCH',
      `${file} must reference the same set of external URLs as ${canonical.path}. Missing: ${list(missing)}. Unexpected: ${list(extra)}.`]);
  }

  for (const { target, line } of local.links) {
    if (!target.startsWith('#')) continue;
    const lines = local.anchors.get(target.slice(1)) ?? [];
    if (lines.length !== 1) {
      problems.push(['INVALID_INTERNAL_ANCHOR',
        `${file}:${line} links to "${target}", which ${lines.length === 0 ? 'matches no heading' : `matches ${lines.length} headings (lines ${lines.join(', ')})`} in the translation.`]);
    }
  }

  if (!structureMatches) return { problems };
  const positions: number[] = [];
  const anchors: string[] = [];
  for (const [label, anchor] of [['objectivesAnchor', canonical.objectivesAnchor], ['completionCriteriaAnchor', canonical.completionCriteriaAnchor]] as const) {
    const lines = english.anchors.get(anchor) ?? [];
    const position = lines.length === 1 ? english.headings.findIndex(({ line }) => line === lines[0]) : -1;
    if (position === -1) {
      problems.push(['HEADING_MAPPING_INVALID',
        `${canonical.path} ${label} "${anchor}" must identify exactly one English heading to be mapped by position; it identifies ${lines.length}.`]);
      continue;
    }
    const counterpart = local.headings[position]!;
    if (counterpart.anchor === '' || (local.anchors.get(counterpart.anchor) ?? []).length !== 1) {
      problems.push(['HEADING_MAPPING_INVALID',
        `${file}:${counterpart.line} is the translation of the ${label} heading (heading ${position + 1}) but its text does not produce a unique anchor. Give it distinct, non-empty text.`]);
      continue;
    }
    positions.push(position);
    anchors.push(counterpart.anchor);
  }
  if (positions.length === 2 && positions[0] === positions[1]) {
    problems.push(['HEADING_MAPPING_INVALID',
      `${canonical.path} objectivesAnchor and completionCriteriaAnchor identify the same heading, so the positional mapping is ambiguous.`]);
    return { problems };
  }
  return positions.length === 2 && problems.length === 0
    ? { problems, mapping: { objectivesAnchor: anchors[0]!, completionCriteriaAnchor: anchors[1]! } }
    : { problems };
}

// ---- Validation --------------------------------------------------------------------------

interface ParsedOverlay {
  kind: OverlayKind;
  locale: string;
  id: string;
  title?: string;
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
  translatedMarkdown: readonly TranslatedMarkdown[] = [],
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
  const modules = new Map((catalog.modules ?? []).map((record) => [record.id, record]));
  const translations = new Map(translatedMarkdown.map((record) => [`${record.locale}/${record.id}`, record]));
  const seen = new Map<string, string>();
  const counts = new Map<string, { competency: OverlayCounts; track: OverlayCounts; module: OverlayCounts }>();
  const countsFor = (locale: string) => {
    let entry = counts.get(locale);
    if (entry === undefined) counts.set(locale, entry = { competency: emptyCounts(), track: emptyCounts(), module: emptyCounts() });
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
    const moduleSource = parsed.kind === 'module' ? modules.get(parsed.id) : undefined;
    if (competencySource === undefined && trackSource === undefined && moduleSource === undefined) {
      error('UNKNOWN_ID', file, `${file} translates ${parsed.kind} "${parsed.id}", which does not exist in the curriculum${parsed.kind === 'module' ? ' (or whose canonical module could not be read)' : ''}. Overlays cannot create entities.`);
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
      : moduleSource !== undefined
        ? moduleSourceHash(moduleSource.markdown)
        : trackSourceHash(trackSource!.title);
    const outdated = parsed.provenance.sourceHash !== expected;
    const tally = countsFor(parsed.locale)[parsed.kind];
    tally.total += 1;
    if (parsed.status === 'draft') tally.draft += 1;
    if (outdated) tally.outdated += 1;
    if (parsed.status === 'reviewed' && !outdated) tally.publishable += 1;

    if (outdated) {
      const detail = `${file}: provenance.sourceHash does not match the current English ${parsed.kind === 'module' ? 'Markdown' : 'metadata'} of ${parsed.kind} "${parsed.id}" (expected ${expected}).`;
      if (strict && parsed.status === 'reviewed') {
        error('OUTDATED_REVIEWED_TRANSLATION', file, `${detail} A reviewed translation must be current for release. Re-translate and re-review it, or return it to draft.`);
      } else {
        warning('STALE_TRANSLATION', file, `${detail} It is outdated and falls back to English.`);
      }
    }
    if (strict && parsed.status === 'draft') {
      warning('DRAFT_NOT_PUBLISHABLE', file, `${file} is a draft and is not publishable; consumers must show English.`);
    }

    if (moduleSource !== undefined) {
      const translated = translations.get(`${parsed.locale}/${parsed.id}`);
      const expectedFile = `${DOCUMENT_LOCALES_DIRECTORY}/${parsed.locale}/modules/${parsed.id}.md`;
      if (translated === undefined) {
        error('MISSING_TRANSLATED_MARKDOWN', file, `${file} has no translated Markdown. Add ${expectedFile} or remove the overlay.`);
      } else if (translated.content !== translated.content.normalize('NFC')) {
        error('NOT_NFC', translated.file, `${translated.file} is not Unicode NFC normalized. Re-save the text in NFC form.`);
      } else if (!outdated) {
        // Parity is meaningful only against the English text the translation was made from.
        for (const [code, message] of compareModuleStructure(moduleSource, translated).problems) error(code, translated.file, message);
      }
    }
  }

  const overlaidModules = new Set(overlays.filter(({ directoryKind }) => directoryKind === 'module')
    .map(({ directoryLocale, fileId }) => `${directoryLocale}/${fileId}`));
  for (const record of translatedMarkdown) {
    if (!overlaidModules.has(`${record.locale}/${record.id}`)) {
      error('ORPHANED_TRANSLATED_MARKDOWN', record.file,
        `${record.file} has no overlay. Add curriculum/locales/${record.locale}/modules/${record.id}.json or remove the file.`);
    }
  }

  const summary: LocalizationSummary = {
    mode: strict ? 'strict' : 'development',
    locales: [...counts.entries()].sort(([a], [b]) => compareText(a, b)).map(([locale, entry]) => ({
      locale,
      competencies: { ...entry.competency, missing: catalog.competencies.length - entry.competency.total },
      tracks: { ...entry.track, missing: catalog.tracks.length - entry.track.total },
      modules: { ...entry.module, missing: modules.size - entry.module.total },
    })),
  };
  return { errors, warnings, summary };
}

/** Load and validate every overlay under `rootDir`. `present` is false when there are none to check. */
export function validateLocalization(
  rootDir: string, catalog: LocalizationCatalog, options: LocalizationOptions = {},
): LocalizationResult & { present: boolean } {
  const loaded = loadLocalizationOverlays(rootDir);
  const markdown = loadTranslatedMarkdown(rootDir);
  const withModules: LocalizationCatalog = {
    ...catalog, modules: catalog.modules ?? canonicalModules(rootDir, catalog.competencies),
  };
  const result = validateLocalizationOverlays(loaded.overlays, withModules, options, markdown.files);
  return {
    ...result, errors: [...loaded.errors, ...markdown.errors, ...result.errors],
    present: loaded.present || markdown.present,
  };
}
