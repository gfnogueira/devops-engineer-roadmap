import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateCurriculum } from '../scripts/validate-curriculum.js';

const validCatalog = JSON.parse(
  readFileSync(new URL('./fixtures/curriculum.valid.json', import.meta.url), 'utf8'),
) as Record<string, unknown>;

interface FixtureChange {
  name: string;
  operation: 'set' | 'remove';
  path: (string | number)[];
  value?: unknown;
}

interface InvalidCase extends FixtureChange {
  expected: { path: string; keyword: string };
}

const invalidCases = JSON.parse(
  readFileSync(new URL('./fixtures/curriculum.invalid.json', import.meta.url), 'utf8'),
) as InvalidCase[];

// Each case makes one explicit change to a fresh fixture, never to another invalid case.
function catalogWithChange(testCase: FixtureChange): Record<string, unknown> {
  const input = structuredClone(validCatalog);
  let parent = input;
  for (const segment of testCase.path.slice(0, -1)) {
    parent = parent[segment] as Record<string, unknown>;
  }
  const key = testCase.path.at(-1);
  if (key === undefined) throw new Error(`Missing fixture path: ${testCase.name}`);
  if (testCase.operation === 'remove') delete parent[key];
  else parent[key] = testCase.value;
  return input;
}

describe('curriculum structural contract', () => {
  it('accepts a root and dependent competency without modifying the input', () => {
    const input = structuredClone(validCatalog);
    expect(validateCurriculum(input)).toEqual({ valid: true, errors: [] });
    expect(input).toEqual(validCatalog);
  });

  it('accepts an empty catalog without claiming product completeness', () => {
    expect(validateCurriculum({
      manifest: { schemaVersion: 1, curriculumVersion: '0.1.0' },
      competencies: [],
      tracks: [],
    })).toEqual({ valid: true, errors: [] });
  });

  it.each(['foundations', 'junior', 'mid-level', 'senior', 'specialist'])(
    'accepts the %s educational level', (level) => {
      const input = catalogWithChange({
        name: 'level', operation: 'set', path: ['competencies', 0, 'level'], value: level,
      });
      expect(validateCurriculum(input).valid).toBe(true);
    },
  );

  it.each(invalidCases)('rejects $name with a useful diagnostic and no mutation', (testCase) => {
    const input = catalogWithChange(testCase);
    const before = structuredClone(input);
    const result = validateCurriculum(input);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ ...testCase.expected, message: expect.any(String) }),
    ]));
    expect(result.errors.every((error) => error.message.length > 0)).toBe(true);
    expect(input).toEqual(before);
  });

  it.each([null, false, 42, 'catalog', []])('rejects a non-object input: %j', (input) => {
    expect(validateCurriculum(input)).toEqual({
      valid: false,
      errors: [{ path: '', keyword: 'type', message: 'must be object' }],
    });
  });

  it('escapes property names in JSON Pointer diagnostics without returning input values', () => {
    const input = { ...structuredClone(validCatalog), 'extra~/field': 'synthetic-private-value' };
    const result = validateCurriculum(input);
    expect(result.errors).toContainEqual({
      path: '/extra~0~1field', keyword: 'additionalProperties',
      message: 'must NOT have additional properties',
    });
    expect(JSON.stringify(result)).not.toContain('synthetic-private-value');
  });

  it('keeps previous diagnostics stable across subsequent validations', () => {
    const result = validateCurriculum({});
    const before = structuredClone(result);
    validateCurriculum(validCatalog);
    validateCurriculum(null);
    expect(result).toEqual(before);
  });
});
