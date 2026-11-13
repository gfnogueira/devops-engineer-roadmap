import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type LoadErrorCode =
  | 'MISSING_PATH'
  | 'UNEXPECTED_ENTRY'
  | 'INVALID_JSON'
  | 'FILE_ID_MISMATCH';

export interface LoadIssue {
  code: LoadErrorCode;
  /** Repository-relative path, using forward slashes. */
  file: string;
  message: string;
}

/** Parsed but unvalidated records. Pass `catalog` to the validators before trusting any field. */
export interface CurriculumAggregate {
  manifest: unknown;
  competencies: unknown[];
  tracks: unknown[];
}

/** Repository-relative source file of each aggregated record, index-aligned with the catalog. */
export interface CurriculumSources {
  manifest: string;
  competencies: string[];
  tracks: string[];
}

export type LoadResult =
  | { ok: true; catalog: CurriculumAggregate; sources: CurriculumSources }
  | { ok: false; errors: LoadIssue[] };

const CURRICULUM = 'curriculum';
const MANIFEST = 'curriculum/manifest.json';
const COMPETENCIES = 'curriculum/competencies';
const TRACKS = 'curriculum/tracks';
const SCHEMA_DIRECTORY = 'curriculum/schema';
const SCHEMA = 'curriculum/schema/curriculum.schema.json';

/** Code-unit comparison: independent of locale and of the order the filesystem lists entries. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Describe the entry without following symbolic links; undefined means it does not exist. */
function entryKind(path: string): 'file' | 'directory' | 'other' | undefined {
  const stats = lstatSync(path, { throwIfNoEntry: false });
  if (stats === undefined) return undefined;
  return stats.isFile() ? 'file' : stats.isDirectory() ? 'directory' : 'other';
}

function readRecord(rootDir: string, file: string, errors: LoadIssue[]): unknown {
  try {
    return JSON.parse(readFileSync(join(rootDir, file), 'utf8'));
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    // The parser message can quote file content, so it is deliberately not repeated here.
    errors.push({
      code: 'INVALID_JSON', file,
      message: `${file} is not valid JSON. Correct its syntax; a JSON-aware editor will locate the error.`,
    });
    return undefined;
  }
}

function readManifest(rootDir: string, errors: LoadIssue[]): unknown {
  const kind = entryKind(join(rootDir, MANIFEST));
  if (kind === undefined) {
    errors.push({
      code: 'MISSING_PATH', file: MANIFEST,
      message: `${MANIFEST} does not exist. Add the curriculum manifest.`,
    });
    return undefined;
  }
  if (kind !== 'file') {
    errors.push({
      code: 'UNEXPECTED_ENTRY', file: MANIFEST,
      message: `${MANIFEST} must be a regular file, not a directory, symbolic link, or special file.`,
    });
    return undefined;
  }
  return readRecord(rootDir, MANIFEST, errors);
}

/** Read every `<id>.json` record directly inside one directory, ordered by ID. */
function readRecords(rootDir: string, directory: string, errors: LoadIssue[]) {
  const records: unknown[] = [];
  const files: string[] = [];
  const kind = entryKind(join(rootDir, directory));
  if (kind === undefined) {
    errors.push({
      code: 'MISSING_PATH', file: directory,
      message: `${directory} does not exist. Create the directory and add its JSON records.`,
    });
    return { records, files };
  }
  if (kind !== 'directory') {
    errors.push({
      code: 'UNEXPECTED_ENTRY', file: directory,
      message: `${directory} must be a real directory, not a file or symbolic link.`,
    });
    return { records, files };
  }

  const names = readdirSync(join(rootDir, directory)).sort(compareText);
  const unexpected = names.filter(
    (name) => !name.endsWith('.json') || entryKind(join(rootDir, directory, name)) !== 'file',
  );
  for (const name of unexpected) {
    const file = `${directory}/${name}`;
    errors.push({
      code: 'UNEXPECTED_ENTRY', file,
      message: `${file} is not a regular .json file. ${directory} may contain only one <id>.json file per record; remove or relocate this entry.`,
    });
  }

  // Unexpected entries are never read, but the remaining regular files are still checked so
  // that independent problems are reported together.
  // Sort by ID rather than by file name: "." and "-" would otherwise order "a-b" before "a".
  const ids = names
    .filter((name) => !unexpected.includes(name))
    .map((name) => name.slice(0, -'.json'.length))
    .sort(compareText);
  for (const expectedId of ids) {
    const file = `${directory}/${expectedId}.json`;
    const before = errors.length;
    const record = readRecord(rootDir, file, errors);
    if (errors.length > before) continue;
    // Shape is the schema's responsibility. Only a readable, conflicting ID is reported here.
    const id: unknown = typeof record === 'object' && record !== null
      ? (record as { id?: unknown }).id
      : undefined;
    if (typeof id === 'string' && id !== expectedId) {
      errors.push({
        code: 'FILE_ID_MISMATCH', file,
        message: `${file} declares an "id" that differs from its file name. Make the "id" and the file name agree: a record with ID "${expectedId}" belongs in ${file}.`,
      });
      continue;
    }
    records.push(record);
    files.push(file);
  }
  return { records, files };
}

/**
 * Check the container first: nothing below it is listed or read unless it is a real
 * directory, so a symbolic link cannot redirect loading outside the repository.
 */
function curriculumDirectoryIssue(rootDir: string): LoadIssue | undefined {
  const kind = entryKind(join(rootDir, CURRICULUM));
  if (kind === 'directory') return undefined;
  return kind === undefined
    ? {
      code: 'MISSING_PATH', file: CURRICULUM,
      message: `${CURRICULUM} does not exist. Create the directory with its manifest and record directories.`,
    }
    : {
      code: 'UNEXPECTED_ENTRY', file: CURRICULUM,
      message: `${CURRICULUM} must be a real directory, not a file or symbolic link. Nothing was read through it.`,
    };
}

/**
 * Check that the canonical schema under `rootDir` can be read safely: `curriculum/` and
 * `curriculum/schema/` are real directories and the schema is a regular file holding JSON.
 * Each level is checked without following symbolic links before the next is touched. This
 * does not decide whether the JSON is a usable schema; compiling it does.
 */
export function checkSchemaSource(rootDir: string): LoadIssue[] {
  const container = curriculumDirectoryIssue(rootDir);
  if (container !== undefined) return [container];
  for (const [path, expected] of [[SCHEMA_DIRECTORY, 'directory'], [SCHEMA, 'file']] as const) {
    const kind = entryKind(join(rootDir, path));
    if (kind === undefined) {
      return [{ code: 'MISSING_PATH', file: path, message: `${path} does not exist. Restore the canonical curriculum schema.` }];
    }
    if (kind !== expected) {
      return [{
        code: 'UNEXPECTED_ENTRY', file: path,
        message: `${path} must be a real ${expected === 'file' ? 'regular file' : 'directory'}, not a symbolic link or another kind of entry. Nothing was read through it.`,
      }];
    }
  }
  const errors: LoadIssue[] = [];
  readRecord(rootDir, SCHEMA, errors);
  return errors;
}

/**
 * Build the curriculum aggregate in memory from the authoring layout under `rootDir`.
 * Nothing is written, validated against the schema, defaulted, or fetched.
 */
export function loadCurriculum(rootDir: string): LoadResult {
  const container = curriculumDirectoryIssue(rootDir);
  if (container !== undefined) return { ok: false, errors: [container] };

  const errors: LoadIssue[] = [];
  const manifest = readManifest(rootDir, errors);
  const competencies = readRecords(rootDir, COMPETENCIES, errors);
  const tracks = readRecords(rootDir, TRACKS, errors);
  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    catalog: { manifest, competencies: competencies.records, tracks: tracks.records },
    sources: { manifest: MANIFEST, competencies: competencies.files, tracks: tracks.files },
  };
}
