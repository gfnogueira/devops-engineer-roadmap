import { describe, expect, it } from 'vitest';
import { validateCurriculum } from '../scripts/validate-curriculum.js';
import { validateCurriculumSemantics } from '../scripts/validate-curriculum-semantics.js';

type Definition = [id: string, prerequisites: string[]];
type Track = [id: string, competencyIds: string[]];

function catalog(definitions: Definition[], tracks: Track[] = []) {
  return {
    manifest: { schemaVersion: 1, curriculumVersion: '0.1.0' },
    competencies: definitions.map(([id, prerequisites]) => ({
      id, title: 'Synthetic capability', summary: 'Synthetic graph test record.',
      level: 'foundations', assessmentRevision: 1, prerequisites,
      content: {
        path: `docs/modules/${id}.md`, objectivesAnchor: 'learning-objectives',
        completionCriteriaAnchor: 'completion-criteria',
      },
    })),
    tracks: tracks.map(([id, competencyIds]) => ({ id, title: 'Synthetic path', competencyIds })),
  };
}

function semanticErrors(input: unknown) {
  // Isolate semantic failures from unintended structural defects in test inputs.
  expect(validateCurriculum(input)).toEqual({ valid: true, errors: [] });
  const result = validateCurriculumSemantics(input);
  expect(result.valid).toBe(false);
  if (result.valid || result.stage !== 'semantic') throw new Error('Expected semantic diagnostics');
  return result.errors;
}

describe('valid complete catalogs', () => {
  const cases: { name: string; definitions: Definition[]; tracks?: Track[] }[] = [
    { name: 'empty catalog', definitions: [] },
    { name: 'independent roots', definitions: [['a', []], ['b', []]] },
    { name: 'dependency chain', definitions: [['a', ['b']], ['b', ['c']], ['c', []]] },
    { name: 'diamond graph', definitions: [['a', ['b', 'c']], ['b', ['d']], ['c', ['d']], ['d', []]] },
    { name: 'shared prerequisite', definitions: [['a', ['c']], ['b', ['c']], ['c', []]] },
    { name: 'cross-track prerequisite', definitions: [['a', ['b']], ['b', []]], tracks: [['first', ['a']], ['second', ['b']]] },
    { name: 'shared membership across tracks', definitions: [['a', []]], tracks: [['first', ['a']], ['second', ['a']]] },
    { name: 'prerequisite outside all tracks', definitions: [['a', ['b']], ['b', []]], tracks: [['first', ['a']]] },
    { name: 'separate identifier namespaces', definitions: [['a', []]], tracks: [['a', ['a']]] },
  ];

  it.each(cases)('accepts $name without mutating input', ({ definitions, tracks }) => {
    const input = catalog(definitions, tracks);
    const before = structuredClone(input);
    expect(validateCurriculumSemantics(input)).toEqual({ valid: true, errors: [] });
    expect(input).toEqual(before);
  });
});

describe('identifier and relationship diagnostics', () => {
  it('rejects duplicate competency IDs before indexing can overwrite a record', () => {
    const errors = semanticErrors(catalog([['a', []], ['a', ['b']], ['b', []]]));
    expect(errors).toEqual([expect.objectContaining({
      code: 'DUPLICATE_COMPETENCY_ID', entityType: 'competency', entityId: 'a', referenceId: 'a',
      path: '/competencies/1/id', relatedPath: '/competencies/0/id',
    })]);
  });

  it('rejects duplicate track IDs', () => {
    expect(semanticErrors(catalog([['a', []]], [['path', ['a']], ['path', ['a']]])))
      .toEqual([expect.objectContaining({
        code: 'DUPLICATE_TRACK_ID', entityType: 'track', entityId: 'path', referenceId: 'path',
        path: '/tracks/1/id', relatedPath: '/tracks/0/id',
      })]);
  });

  it('rejects repeated prerequisite references', () => {
    expect(semanticErrors(catalog([['a', ['b', 'b']], ['b', []]])))
      .toEqual([expect.objectContaining({
        code: 'DUPLICATE_PREREQUISITE', entityType: 'competency', entityId: 'a', referenceId: 'b',
        path: '/competencies/0/prerequisites/1', relatedPath: '/competencies/0/prerequisites/0',
      })]);
  });

  it('rejects repeated competency membership within a track', () => {
    expect(semanticErrors(catalog([['a', []]], [['path', ['a', 'a']]])))
      .toEqual([expect.objectContaining({
        code: 'DUPLICATE_TRACK_MEMBERSHIP', entityType: 'track', entityId: 'path', referenceId: 'a',
        path: '/tracks/0/competencyIds/1', relatedPath: '/tracks/0/competencyIds/0',
      })]);
  });

  it('rejects unknown prerequisites', () => {
    expect(semanticErrors(catalog([['a', ['missing']]]))).toEqual([expect.objectContaining({
      code: 'UNKNOWN_PREREQUISITE', entityType: 'competency', entityId: 'a', referenceId: 'missing',
      path: '/competencies/0/prerequisites/0',
    })]);
  });

  it('rejects unknown track members', () => {
    expect(semanticErrors(catalog([['a', []]], [['path', ['missing']]])))
      .toEqual([expect.objectContaining({
        code: 'UNKNOWN_TRACK_COMPETENCY', entityType: 'track', entityId: 'path', referenceId: 'missing',
        path: '/tracks/0/competencyIds/0',
      })]);
  });

  it('reports self-prerequisites once, with a complete self-cycle path', () => {
    expect(semanticErrors(catalog([['a', ['a']]]))).toEqual([expect.objectContaining({
      code: 'SELF_PREREQUISITE', entityType: 'competency', entityId: 'a', referenceId: 'a',
      path: '/competencies/0/prerequisites/0', cycle: ['a', 'a'],
    })]);
  });
});

describe('whole-catalog cycle detection', () => {
  it('reports a direct two-node cycle', () => {
    const errors = semanticErrors(catalog([['a', ['b']], ['b', ['a']]]));
    expect(errors).toEqual([expect.objectContaining({
      code: 'DEPENDENCY_CYCLE', entityType: 'competency', entityId: 'b', referenceId: 'a',
      path: '/competencies/1/prerequisites/0', cycle: ['a', 'b', 'a'],
    })]);
    expect(errors[0]!.message).toContain('a -> b -> a');
  });

  it('reports an indirect cycle without labeling its acyclic dependent as cyclic', () => {
    const errors = semanticErrors(catalog([['outside', ['a']], ['a', ['b']], ['b', ['c']], ['c', ['a']]]));
    expect(errors).toEqual([expect.objectContaining({
      code: 'DEPENDENCY_CYCLE', entityId: 'c', referenceId: 'a', cycle: ['a', 'b', 'c', 'a'],
    })]);
    expect(errors[0]!.message).not.toContain('outside');
  });

  it('finds cycles in every disconnected component, including unlisted competencies', () => {
    const errors = semanticErrors(catalog(
      [['root', []], ['a', ['b']], ['b', ['a']], ['c', ['d']], ['d', ['c']]],
      [['visible-path', ['root']]],
    ));
    expect(errors.map((error) => error.cycle)).toEqual([['a', 'b', 'a'], ['c', 'd', 'c']]);
  });

  it('rejects cycles crossing learning paths', () => {
    const errors = semanticErrors(catalog(
      [['a', ['b']], ['b', ['a']]], [['first', ['a']], ['second', ['b']]],
    ));
    expect(errors).toEqual([expect.objectContaining({ code: 'DEPENDENCY_CYCLE', cycle: ['a', 'b', 'a'] })]);
  });

  it('continues checking independent components when references are missing or IDs are ambiguous', () => {
    const errors = semanticErrors(catalog([
      ['duplicate', []], ['duplicate', []], ['broken', ['missing', 'duplicate']],
      ['a', ['b']], ['b', ['a']],
    ]));
    expect(errors.map((error) => error.code)).toEqual([
      'DUPLICATE_COMPETENCY_ID', 'UNKNOWN_PREREQUISITE', 'DEPENDENCY_CYCLE',
    ]);
    expect(errors[2]!.cycle).toEqual(['a', 'b', 'a']);
  });

  it('detects a late cycle after an earlier branch has finished', () => {
    const errors = semanticErrors(catalog([['a', ['root', 'b']], ['root', []], ['b', ['c']], ['c', ['b']]]));
    expect(errors).toEqual([expect.objectContaining({ cycle: ['b', 'c', 'b'] })]);
  });

  it('handles a deep chain and its closing cycle without exhausting the call stack', () => {
    const count = 12000;
    const definitions: Definition[] = Array.from({ length: count }, (_, i) => [
      `node-${i}`, i + 1 < count ? [`node-${i + 1}`] : [],
    ]);
    expect(validateCurriculumSemantics(catalog(definitions)).valid).toBe(true);
    definitions[count - 1] = [`node-${count - 1}`, ['node-0']];
    const errors = semanticErrors(catalog(definitions));
    expect(errors).toHaveLength(1);
    expect(errors[0]!.cycle).toEqual([...definitions.map(([id]) => id), 'node-0']);
  });
});

describe('validation boundary and determinism', () => {
  it.each([null, {}, { manifest: {}, competencies: null, tracks: [] }])(
    'returns existing structural diagnostics before inspecting malformed relations: %j', (input) => {
      const structural = validateCurriculum(input);
      expect(validateCurriculumSemantics(input)).toEqual({
        valid: false, stage: 'structural', errors: structural.errors,
      });
    },
  );

  it('preserves C01 structural acceptance of a semantically invalid catalog', () => {
    const input = catalog([['a', ['missing']]]);
    expect(validateCurriculum(input)).toEqual({ valid: true, errors: [] });
    expect(validateCurriculumSemantics(input).valid).toBe(false);
  });

  it('returns deterministic results without mutating data or retaining state across calls', () => {
    const input = catalog([['a', ['b', 'b']], ['b', ['a']]], [['path', ['a', 'missing']]]);
    const before = structuredClone(input);
    const first = validateCurriculumSemantics(input);
    const snapshot = structuredClone(first);
    expect(validateCurriculumSemantics(structuredClone(input))).toEqual(first);
    validateCurriculumSemantics(catalog([['root', []]]));
    expect(validateCurriculumSemantics(input)).toEqual(snapshot);
    expect(first).toEqual(snapshot);
    expect(input).toEqual(before);
  });

  it('returns actionable identifiers and relationships without dumping lesson metadata', () => {
    const input = catalog([['a', ['missing']]]);
    input.competencies[0]!.summary = 'private-synthetic-text-not-for-diagnostics';
    const errors = semanticErrors(input);
    expect(errors[0]!.message).toContain('a');
    expect(errors[0]!.message).toContain('missing');
    expect(errors[0]!.message).toContain('Correct');
    expect(JSON.stringify(errors)).not.toContain(input.competencies[0]!.summary);
  });
});
