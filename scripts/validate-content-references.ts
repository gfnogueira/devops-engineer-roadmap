import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { parseMarkdown, type MarkdownDocument } from './markdown-references.js';

export type ContentErrorCode =
  | 'UNSAFE_PATH'
  | 'SYMLINK_NOT_ALLOWED'
  | 'MISSING_FILE'
  | 'NOT_A_FILE'
  | 'MISSING_ANCHOR'
  | 'AMBIGUOUS_ANCHOR'
  | 'UNCLOSED_FENCE'
  | 'DUPLICATE_CONTENT_PATH'
  | 'ORPHANED_MODULE';

export interface ContentIssue {
  code: ContentErrorCode;
  /** The repository-relative path, link target, or anchor that failed. */
  reference: string;
  message: string;
  /** JSON Pointer into the catalog, when the issue originates in competency metadata. */
  path?: string;
  /** Repository-relative Markdown file, when the issue originates in a document. */
  file?: string;
  /** 1-based line within `file`: the link, or the opening line of an unclosed fence. */
  line?: number;
}

export interface ContentSummary {
  markdownFiles: number;
  internalLinks: number;
  /** Counted, never fetched. */
  externalLinks: number;
}

export type ContentValidationResult =
  | { valid: true; errors: []; summary: ContentSummary }
  | { valid: false; errors: ContentIssue[] };

// A projection of the fields read here. Callers must run structural validation first;
// the schema, not this interface, is the contract.
export interface ContentCatalog {
  competencies: {
    id: string;
    content: { path: string; objectivesAnchor: string; completionCriteriaAnchor: string };
  }[];
}

const DOCUMENT_ROOT = 'docs';
const MODULE_ROOT = 'docs/modules/';
const EXTERNAL_LINK = /^(?:https?|mailto):/i;
const OTHER_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

type Failure = Pick<ContentIssue, 'code' | 'message'>;

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Filesystem access for one validation run. Nothing is cached between runs. */
class Repository {
  readonly #rootDir: string;
  readonly #listings = new Map<string, string[]>();
  readonly #documents = new Map<string, MarkdownDocument>();

  constructor(rootDir: string) {
    this.#rootDir = rootDir;
  }

  /** Sorted entry names of a repository-relative directory ('' is the root). */
  list(directory: string): string[] {
    let names = this.#listings.get(directory);
    if (names === undefined) {
      names = readdirSync(join(this.#rootDir, directory)).sort(compareText);
      this.#listings.set(directory, names);
    }
    return names;
  }

  kind(path: string): 'file' | 'directory' | 'symlink' | 'other' {
    const stats = lstatSync(join(this.#rootDir, path));
    return stats.isSymbolicLink() ? 'symlink'
      : stats.isFile() ? 'file'
        : stats.isDirectory() ? 'directory' : 'other';
  }

  /**
   * Check that a normalized repository-relative path names a regular file. Every segment
   * must match a directory entry exactly, including case, and none may be a symbolic link,
   * so the result is the same on case-insensitive filesystems and cannot leave the root.
   */
  checkFile(path: string): Failure | undefined {
    const segments = path.split('/');
    let current = '';
    for (const [index, segment] of segments.entries()) {
      const names = this.list(current);
      if (!names.includes(segment)) {
        const similar = names.find((name) => name.toLowerCase() === segment.toLowerCase());
        return {
          code: 'MISSING_FILE',
          message: similar === undefined
            ? `"${path}" does not exist.`
            : `"${path}" does not exist; "${similar}" differs only in letter case. Paths are case-sensitive.`,
        };
      }
      current = current === '' ? segment : `${current}/${segment}`;
      const kind = this.kind(current);
      if (kind === 'symlink') {
        return {
          code: 'SYMLINK_NOT_ALLOWED',
          message: `"${current}" is a symbolic link. Curriculum content must be stored as regular files and directories inside the repository.`,
        };
      }
      const last = index === segments.length - 1;
      if (last ? kind !== 'file' : kind !== 'directory') {
        return last
          ? { code: 'NOT_A_FILE', message: `"${path}" is not a regular file.` }
          : { code: 'MISSING_FILE', message: `"${path}" does not exist; "${current}" is not a directory.` };
      }
    }
    return undefined;
  }

  /** Parse a Markdown file that `checkFile` or `markdownFiles` has already accepted. */
  document(path: string): MarkdownDocument {
    let document = this.#documents.get(path);
    if (document === undefined) {
      document = parseMarkdown(readFileSync(join(this.#rootDir, path), 'utf8'));
      this.#documents.set(path, document);
    }
    return document;
  }

  /** Regular `.md` files under a directory, sorted; symbolic links are reported, not followed. */
  markdownFiles(directory: string, errors: ContentIssue[]): string[] {
    const files: string[] = [];
    const pending = [directory];
    while (pending.length > 0) {
      const current = pending.pop()!;
      for (const name of this.list(current)) {
        const path = `${current}/${name}`;
        const kind = this.kind(path);
        if (kind === 'symlink') {
          errors.push({
            code: 'SYMLINK_NOT_ALLOWED', reference: path, file: path,
            message: `"${path}" is a symbolic link. Curriculum content must be stored as regular files and directories inside the repository.`,
          });
        } else if (kind === 'directory') {
          pending.push(path);
        } else if (kind === 'file' && name.endsWith('.md')) {
          files.push(path);
        }
      }
    }
    return files.sort(compareText);
  }
}

function anchorFailure(document: MarkdownDocument, file: string, anchor: string): Failure | undefined {
  const lines = document.anchors.get(anchor) ?? [];
  if (lines.length === 1) return undefined;
  return lines.length === 0
    ? { code: 'MISSING_ANCHOR', message: `No heading in "${file}" produces the anchor "${anchor}".` }
    : {
      code: 'AMBIGUOUS_ANCHOR',
      message: `Headings on lines ${lines.join(', ')} of "${file}" all produce the anchor "${anchor}". Give the referenced heading unique text.`,
    };
}

function checkCompetencyContent(
  catalog: ContentCatalog, repository: Repository, errors: ContentIssue[],
): Set<string> {
  const referenced = new Map<string, string>();
  catalog.competencies.forEach(({ id, content }, index) => {
    const pointer = `/competencies/${index}/content`;
    const { path } = content;
    const first = referenced.get(path);
    if (first !== undefined) {
      errors.push({
        code: 'DUPLICATE_CONTENT_PATH', reference: path, path: `${pointer}/path`,
        message: `Competency "${id}" uses the same content path as ${first}. Each competency needs its own canonical module.`,
      });
      return;
    }
    referenced.set(path, `${pointer}/path`);

    // The schema already restricts this value; it is rechecked because it reaches the filesystem.
    const failure: Failure | undefined =
      path.includes('\\') || posix.isAbsolute(path) || posix.normalize(path) !== path
        || !path.startsWith(MODULE_ROOT) || !path.endsWith('.md')
        ? { code: 'UNSAFE_PATH', message: `"${path}" is not a normalized relative Markdown path under ${MODULE_ROOT}.` }
        : repository.checkFile(path);
    if (failure !== undefined) {
      errors.push({
        ...failure, reference: path, path: `${pointer}/path`,
        message: `Competency "${id}" content path cannot be used: ${failure.message}`,
      });
      return;
    }

    const document = repository.document(path);
    for (const field of ['objectivesAnchor', 'completionCriteriaAnchor'] as const) {
      const anchorIssue = anchorFailure(document, path, content[field]);
      if (anchorIssue !== undefined) {
        errors.push({
          ...anchorIssue, reference: `${path}#${content[field]}`, path: `${pointer}/${field}`,
          message: `Competency "${id}" ${field} cannot be resolved: ${anchorIssue.message}`,
        });
      }
    }
  });
  return new Set(referenced.keys());
}

/** Check one link. Returns whether it was internal, so external links can be counted. */
function checkLink(
  file: string, target: string, repository: Repository,
): { internal: boolean; failure?: Failure } {
  if (EXTERNAL_LINK.test(target)) return { internal: false };
  if (target === '') {
    return { internal: true, failure: { code: 'MISSING_FILE', message: 'The link has an empty target.' } };
  }
  const separator = target.indexOf('#');
  const linkPath = separator === -1 ? target : target.slice(0, separator);
  const fragment = separator === -1 ? '' : target.slice(separator + 1);

  if (OTHER_SCHEME.test(target) || linkPath.includes('\\') || posix.isAbsolute(linkPath)) {
    return {
      internal: true,
      failure: {
        code: 'UNSAFE_PATH',
        message: 'Internal links must be relative paths with forward slashes; only http, https, and mailto URLs are treated as external.',
      },
    };
  }

  // Targets are compared literally: percent-encoding and query strings are not interpreted.
  const resolved = linkPath === '' ? file : posix.normalize(posix.join(posix.dirname(file), linkPath));
  if (resolved === '..' || resolved.startsWith('../')) {
    return {
      internal: true,
      failure: { code: 'UNSAFE_PATH', message: 'The link resolves outside the repository.' },
    };
  }
  const failure = linkPath === '' ? undefined : repository.checkFile(resolved.replace(/\/$/, ''));
  if (failure !== undefined) return { internal: true, failure };
  if (fragment === '' || !resolved.endsWith('.md')) return { internal: true };
  const anchorIssue = anchorFailure(repository.document(resolved), resolved, fragment);
  return anchorIssue === undefined ? { internal: true } : { internal: true, failure: anchorIssue };
}

/**
 * Check that competency metadata and the Markdown under `docs/` refer only to regular files
 * and unambiguous heading anchors inside `rootDir`. External URLs are counted, never fetched.
 * `catalog` must already have passed structural validation.
 */
export function validateContentReferences(
  catalog: ContentCatalog, rootDir: string,
): ContentValidationResult {
  const repository = new Repository(rootDir);
  const errors: ContentIssue[] = [];
  const summary: ContentSummary = { markdownFiles: 0, internalLinks: 0, externalLinks: 0 };

  const referenced = checkCompetencyContent(catalog, repository, errors);

  let documents: string[] = [];
  if (repository.list('').includes(DOCUMENT_ROOT)) {
    const kind = repository.kind(DOCUMENT_ROOT);
    if (kind === 'directory') {
      documents = repository.markdownFiles(DOCUMENT_ROOT, errors);
    } else {
      errors.push({
        code: kind === 'symlink' ? 'SYMLINK_NOT_ALLOWED' : 'MISSING_FILE', reference: DOCUMENT_ROOT,
        file: DOCUMENT_ROOT, message: `"${DOCUMENT_ROOT}" must be a real directory inside the repository.`,
      });
    }
  }
  summary.markdownFiles = documents.length;
  for (const file of documents) {
    const { links, unclosedFence } = repository.document(file);
    if (unclosedFence !== undefined) {
      // Text after the opening line was not inspected, so the file cannot be reported as checked.
      errors.push({
        code: 'UNCLOSED_FENCE', reference: file, file, line: unclosedFence,
        message: `${file}:${unclosedFence} opens a fenced code block that is never closed, so the rest of the file was not checked. Add the closing fence.`,
      });
    }
    for (const { target, line } of links) {
      const { internal, failure } = checkLink(file, target, repository);
      if (internal) summary.internalLinks += 1;
      else summary.externalLinks += 1;
      if (failure !== undefined) {
        errors.push({
          ...failure, reference: target, file, line,
          message: `${file}:${line} links to "${target}": ${failure.message}`,
        });
      }
    }
  }

  for (const file of documents) {
    if (file.startsWith(MODULE_ROOT) && !referenced.has(file)) {
      errors.push({
        code: 'ORPHANED_MODULE', reference: file, file,
        message: `"${file}" is not the content path of any competency. Add its competency record or move the document out of ${MODULE_ROOT}.`,
      });
    }
  }

  return errors.length === 0 ? { valid: true, errors: [], summary } : { valid: false, errors };
}
