import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { competency, json, MODULE, workspace } from './support/workspace.js';

// These tests run the real command-line entry point against disposable synthetic repositories
// passed as its optional root argument. The production curriculum is never modified.
const cli = fileURLToPath(new URL('../scripts/validate-curriculum-cli.ts', import.meta.url));

function run(root: string) {
  const { status, stdout, stderr } = spawnSync(process.execPath, [cli, root], { encoding: 'utf8' });
  // Keep only the command's own diagnostics; Node may add an experimental-feature warning.
  const issues = stderr.split('\n').filter((line) => line.startsWith('- ['));
  return { status, stdout, stderr, issues };
}

/** A valid synthetic curriculum with a `foundations` track, so every production rule applies. */
function repository(overrides: Record<string, string> = {}) {
  return workspace({
    'curriculum/manifest.json': json({ schemaVersion: 1, curriculumVersion: '9.8.7' }),
    'curriculum/competencies/a.json': json(competency('a')),
    'curriculum/competencies/b.json': json(competency('b', ['a'])),
    'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'Synthetic', competencyIds: ['a', 'b'] }),
    'docs/modules/a.md': MODULE,
    'docs/modules/b.md': MODULE,
    ...overrides,
  });
}

function expectFailure(result: ReturnType<typeof run>, stage: string) {
  expect(result.status).toBe(1);
  expect(result.stdout).toBe('');
  expect(result.stderr).toContain(`Curriculum validation failed at the ${stage} stage:`);
  expect(result.stderr).not.toContain('is valid');
}

describe('validation command', () => {
  it('succeeds on a valid synthetic repository given as an argument', () => {
    const result = run(repository());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Curriculum 9.8.7 is valid.');
    expect(result.stdout).toContain('Track "foundations" (2): a, b');
    expect(result.issues).toEqual([]);
  });

  it('fails at the load stage with the offending files', () => {
    const result = run(repository({
      'curriculum/competencies/b.json': '{ "id": "synthetic-private-value", }',
      'curriculum/tracks/notes.txt': 'synthetic',
    }));
    expectFailure(result, 'load');
    expect(result.issues).toEqual([
      expect.stringMatching(/^- \[INVALID_JSON\]: curriculum\/competencies\/b\.json /),
      expect.stringMatching(/^- \[UNEXPECTED_ENTRY\]: curriculum\/tracks\/notes\.txt /),
    ]);
    expect(result.stderr).not.toContain('synthetic-private-value');
  });

  it('fails without reading through a symbolic link at the curriculum directory', () => {
    const outside = repository();
    const root = workspace({ 'docs/modules/a.md': MODULE, 'docs/modules/b.md': MODULE });
    symlinkSync(join(outside, 'curriculum'), join(root, 'curriculum'));
    const result = run(root);
    expectFailure(result, 'load');
    expect(result.issues).toEqual([expect.stringMatching(/^- \[UNEXPECTED_ENTRY\]: curriculum must be a real directory/)]);
  });

  it('fails at the structural stage and maps each pointer to its source file', () => {
    const invalid = { ...competency('b', ['a']), level: 'expert', tracks: ['foundations'] };
    const result = run(repository({ 'curriculum/competencies/b.json': json(invalid) }));
    expectFailure(result, 'structural');
    expect(result.issues).toEqual([
      expect.stringMatching(/^- \[additionalProperties\] \/competencies\/1\/tracks \(curriculum\/competencies\/b\.json\): /),
      expect.stringMatching(/^- \[enum\] \/competencies\/1\/level \(curriculum\/competencies\/b\.json\): /),
    ]);
  });

  it('fails at the semantic stage with stable codes and source files', () => {
    const result = run(repository({
      'curriculum/competencies/a.json': json(competency('a', ['b'])),
      'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'Synthetic', competencyIds: ['a', 'b', 'zz'] }),
    }));
    expectFailure(result, 'semantic');
    expect(result.issues).toEqual([
      expect.stringMatching(/^- \[UNKNOWN_TRACK_COMPETENCY\] \/tracks\/0\/competencyIds\/2 \(curriculum\/tracks\/foundations\.json\): /),
      expect.stringMatching(/^- \[DEPENDENCY_CYCLE\] \/competencies\/1\/prerequisites\/0 \(curriculum\/competencies\/b\.json\): /),
    ]);
  });

  it('fails at the content stage with metadata, document, and acceptance issues', () => {
    const result = run(repository({
      'curriculum/tracks/foundations.json': json({ id: 'foundations', title: 'Synthetic', competencyIds: ['b'] }),
      'docs/modules/a.md': '# A\n\n## Learning Objectives\n\n[x](missing.md)\n',
      'docs/modules/b.md': `${MODULE}\n\`\`\`sh\nunfinished\n`,
    }));
    expectFailure(result, 'content');
    expect(result.issues).toEqual([
      expect.stringMatching(/^- \[MISSING_ANCHOR\] \/competencies\/0\/content\/completionCriteriaAnchor \(curriculum\/competencies\/a\.json\): /),
      expect.stringMatching(/^- \[MISSING_FILE\]: docs\/modules\/a\.md:5 links to "missing\.md": /),
      expect.stringMatching(/^- \[UNCLOSED_FENCE\]: docs\/modules\/b\.md:7 /),
      expect.stringMatching(/^- \[PREREQUISITE_OUTSIDE_TRACK\] \/competencies\/1\/prerequisites\/0 \(curriculum\/competencies\/b\.json\): /),
    ]);
  });

  it('fails when the required Foundations track is absent', () => {
    const other = workspace({
      'curriculum/manifest.json': json({ schemaVersion: 1, curriculumVersion: '9.8.7' }),
      'curriculum/competencies/a.json': json(competency('a')),
      'curriculum/tracks/other.json': json({ id: 'other', title: 'Synthetic', competencyIds: ['a'] }),
      'docs/modules/a.md': MODULE,
    });
    const missing = run(other);
    expectFailure(missing, 'content');
    expect(missing.issues).toEqual([expect.stringMatching(/^- \[REQUIRED_TRACK_MISSING\] \/tracks: /)]);
  });

  it('prints identical diagnostics on repeated runs', () => {
    const root = repository({ 'docs/modules/a.md': '# A\n', 'docs/z.md': '[x](no.md)\n', 'docs/y.md': '[x](no.md)\n' });
    const first = run(root);
    expectFailure(first, 'content');
    expect(first.issues).toHaveLength(4);
    expect(run(root).issues).toEqual(first.issues);
  });
});

// The schema is read from the repository that contains the scripts, so these tests install a
// copy of the scripts in a disposable repository and run that copy without arguments, exactly
// as `npm run validate:curriculum` does. Only dependencies are shared, through a link.
describe('validation command start-up order', () => {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const SCHEMA = 'curriculum/schema/curriculum.schema.json';
  const realSchema = readFileSync(join(repoRoot, SCHEMA), 'utf8');

  /** A complete synthetic repository with its own scripts and schema. */
  function installed(schema: string = realSchema) {
    const root = repository({ [SCHEMA]: schema, 'package.json': json({ type: 'module' }) });
    mkdirSync(join(root, 'scripts'));
    for (const name of readdirSync(join(repoRoot, 'scripts'))) {
      copyFileSync(join(repoRoot, 'scripts', name), join(root, 'scripts', name));
    }
    symlinkSync(join(repoRoot, 'node_modules'), join(root, 'node_modules'));
    return root;
  }

  function runInstalled(root: string) {
    const { status, stdout, stderr } = spawnSync(
      process.execPath, [join(root, 'scripts/validate-curriculum-cli.ts')], { encoding: 'utf8', cwd: root },
    );
    return { status, stdout, stderr, issues: stderr.split('\n').filter((line) => line.startsWith('- [')) };
  }

  function expectDiagnosticOnly(result: ReturnType<typeof runInstalled>, issue: RegExp) {
    expectFailure(result, 'load');
    expect(result.issues).toEqual([expect.stringMatching(issue)]);
    // A stack trace or an uncaught error would mean the schema was read before the checks.
    expect(result.stderr).not.toMatch(/^\s+at /m);
    expect(result.stderr).not.toMatch(/Error:|ENOENT|ELOOP|node:internal/);
  }

  it('validates an installed copy that has a real curriculum directory and schema', () => {
    const result = runInstalled(installed());
    expect(result.stderr).not.toMatch(/^- \[/m);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Curriculum 9.8.7 is valid.');
  });

  it('reports a missing curriculum directory instead of failing to read the schema', () => {
    const root = installed();
    rmSync(join(root, 'curriculum'), { recursive: true });
    expectDiagnosticOnly(runInstalled(root), /^- \[MISSING_PATH\]: curriculum does not exist/);
  });

  it('rejects a symbolic-link curriculum directory that holds a valid curriculum and schema', () => {
    const outside = installed();
    const root = installed();
    rmSync(join(root, 'curriculum'), { recursive: true });
    symlinkSync(join(outside, 'curriculum'), join(root, 'curriculum'));
    expectDiagnosticOnly(runInstalled(root), /^- \[UNEXPECTED_ENTRY\]: curriculum must be a real directory/);
  });

  it.each([
    ['is not JSON', '{ "synthetic-private-value": '],
    ['is not a usable JSON Schema', '{ "type": "synthetic-private-value" }'],
  ])('never reads a schema that %s through a symbolic-link curriculum directory', (_name, schema) => {
    const outside = installed(schema);
    const root = installed();
    rmSync(join(root, 'curriculum'), { recursive: true });
    symlinkSync(join(outside, 'curriculum'), join(root, 'curriculum'));
    const result = runInstalled(root);
    expectDiagnosticOnly(result, /^- \[UNEXPECTED_ENTRY\]: curriculum must be a real directory/);
    expect(result.stderr).not.toContain('synthetic-private-value');
    expect(result.stderr).not.toContain('schema');
  });

  it('rejects a symbolic link at the schema directory or the schema file', () => {
    const outside = installed('{');
    const directory = installed();
    rmSync(join(directory, 'curriculum/schema'), { recursive: true });
    symlinkSync(join(outside, 'curriculum/schema'), join(directory, 'curriculum/schema'));
    expectDiagnosticOnly(runInstalled(directory), /^- \[UNEXPECTED_ENTRY\]: curriculum\/schema must be a real directory/);

    const file = installed();
    rmSync(join(file, SCHEMA));
    symlinkSync(join(outside, SCHEMA), join(file, SCHEMA));
    expectDiagnosticOnly(runInstalled(file), /^- \[UNEXPECTED_ENTRY\]: curriculum\/schema\/curriculum\.schema\.json must be a real regular file/);
  });

  it('reports a missing schema file', () => {
    const root = installed();
    rmSync(join(root, SCHEMA));
    expectDiagnosticOnly(runInstalled(root), /^- \[MISSING_PATH\]: curriculum\/schema\/curriculum\.schema\.json does not exist/);
  });

  it('reports a schema that is not JSON', () => {
    const root = installed();
    writeFileSync(join(root, SCHEMA), '{ "synthetic-private-value": ');
    const result = runInstalled(root);
    expectDiagnosticOnly(result, /^- \[INVALID_JSON\]: curriculum\/schema\/curriculum\.schema\.json is not valid JSON/);
    expect(result.stderr).not.toContain('synthetic-private-value');
  });

  it('reports a schema that cannot be compiled without a stack trace', () => {
    const result = runInstalled(installed('{ "type": "not-a-type" }'));
    expectFailure(result, 'load');
    expect(result.issues).toEqual([expect.stringMatching(/^- \[VALIDATOR_INIT_FAILED\]: The validators could not be initialized: /)]);
    expect(result.stderr).not.toMatch(/^\s+at /m);
  });

  it('checks the curriculum given as an argument before the schema of the installed copy', () => {
    const root = installed();
    rmSync(join(root, 'curriculum'), { recursive: true });
    const target = workspace();
    const { status, stdout, stderr } = spawnSync(
      process.execPath, [join(root, 'scripts/validate-curriculum-cli.ts'), target], { encoding: 'utf8' },
    );
    expect(status).toBe(1);
    expect(stdout).toBe('');
    expect(stderr.split('\n').filter((line) => line.startsWith('- ['))).toEqual([
      expect.stringMatching(/^- \[MISSING_PATH\]: curriculum does not exist/),
    ]);
    expect(stderr).not.toMatch(/^\s+at /m);
  });
});
