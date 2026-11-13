import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach } from 'vitest';

const created: string[] = [];

afterEach(() => {
  for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true });
});

/**
 * Create a disposable synthetic repository in the system temporary directory from a map of
 * repository-relative paths to file contents. It is removed after the current test.
 */
export function workspace(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'curriculum-test-'));
  created.push(root);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

/** A structurally valid synthetic competency record for `docs/modules/<id>.md`. */
export function competency(id: string, prerequisites: string[] = []) {
  return {
    id, title: 'Synthetic capability', summary: 'Synthetic test record.',
    level: 'foundations', assessmentRevision: 1, prerequisites,
    content: {
      path: `docs/modules/${id}.md`, objectivesAnchor: 'learning-objectives',
      completionCriteriaAnchor: 'completion-criteria',
    },
  };
}

export const MODULE = '# Synthetic\n\n## Learning Objectives\n\n## Completion Criteria\n';

export const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
