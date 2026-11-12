import { validateCurriculum, type ValidationIssue } from './validate-curriculum.js';

export type SemanticErrorCode =
  | 'DUPLICATE_COMPETENCY_ID'
  | 'DUPLICATE_TRACK_ID'
  | 'DUPLICATE_PREREQUISITE'
  | 'DUPLICATE_TRACK_MEMBERSHIP'
  | 'UNKNOWN_PREREQUISITE'
  | 'UNKNOWN_TRACK_COMPETENCY'
  | 'SELF_PREREQUISITE'
  | 'DEPENDENCY_CYCLE';

export interface SemanticIssue {
  code: SemanticErrorCode;
  entityType: 'competency' | 'track';
  entityId: string;
  referenceId: string;
  path: string;
  message: string;
  relatedPath?: string;
  /** Dependency direction: each ID requires the next; the first ID repeats at the end. */
  cycle?: string[];
}

export type CatalogValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; stage: 'structural'; errors: ValidationIssue[] }
  | { valid: false; stage: 'semantic'; errors: SemanticIssue[] };

// A projection of fields consumed after the canonical schema validates the full input.
// This is not an alternative structural contract or a public assertion about unchecked data.
interface CatalogRelations {
  competencies: { id: string; prerequisites: string[] }[];
  tracks: { id: string; competencyIds: string[] }[];
}

interface Edge {
  target: string;
  path: string;
}

/** Return cycle witnesses without recursion or enumerating every possible simple cycle. */
function detectCycles(graph: ReadonlyMap<string, Edge[]>): SemanticIssue[] {
  const errors: SemanticIssue[] = [];
  const visited = new Set<string>();
  const active = new Map<string, number>();
  const stack: { id: string; edges: Edge[]; next: number }[] = [];

  for (const [root, edges] of graph) {
    if (visited.has(root)) continue;
    visited.add(root);
    active.set(root, 0);
    stack.push({ id: root, edges, next: 0 });

    while (stack.length > 0) {
      const frame = stack[stack.length - 1]!;
      const edge = frame.edges[frame.next++];
      if (edge === undefined) {
        active.delete(frame.id);
        stack.pop();
        continue;
      }

      const start = active.get(edge.target);
      if (start !== undefined) {
        const cycle = stack.slice(start).map((entry) => entry.id);
        cycle.push(edge.target);
        errors.push({
          code: 'DEPENDENCY_CYCLE',
          entityType: 'competency',
          entityId: frame.id,
          referenceId: edge.target,
          path: edge.path,
          cycle,
          message: `Prerequisite cycle detected: ${cycle.join(' -> ')}. Remove or revise a prerequisite in this cycle.`,
        });
      } else if (!visited.has(edge.target)) {
        visited.add(edge.target);
        active.set(edge.target, stack.length);
        stack.push({ id: edge.target, edges: graph.get(edge.target)!, next: 0 });
      }
    }
  }
  return errors;
}

/** Validate the complete catalog, preserving the separate C01 structural API. */
export function validateCurriculumSemantics(input: unknown): CatalogValidationResult {
  const structural = validateCurriculum(input);
  if (!structural.valid) {
    return { valid: false, stage: 'structural', errors: structural.errors };
  }

  const catalog = input as CatalogRelations;
  const errors: SemanticIssue[] = [];
  const competencyIndexes = new Map<string, number>();
  const ambiguousIds = new Set<string>();
  const trackIndexes = new Map<string, number>();

  catalog.competencies.forEach(({ id }, index) => {
    const first = competencyIndexes.get(id);
    if (first !== undefined) {
      ambiguousIds.add(id);
      errors.push({
        code: 'DUPLICATE_COMPETENCY_ID', entityType: 'competency', entityId: id,
        referenceId: id, path: `/competencies/${index}/id`, relatedPath: `/competencies/${first}/id`,
        message: `Competency ID "${id}" repeats /competencies/${first}/id. Keep one canonical definition per ID.`,
      });
    } else {
      competencyIndexes.set(id, index);
    }
  });

  catalog.tracks.forEach(({ id }, index) => {
    const first = trackIndexes.get(id);
    if (first !== undefined) {
      errors.push({
        code: 'DUPLICATE_TRACK_ID', entityType: 'track', entityId: id,
        referenceId: id, path: `/tracks/${index}/id`, relatedPath: `/tracks/${first}/id`,
        message: `Track ID "${id}" repeats /tracks/${first}/id. Give each track a unique ID.`,
      });
    } else {
      trackIndexes.set(id, index);
    }
  });

  const graph = new Map<string, Edge[]>();
  catalog.competencies.forEach(({ id, prerequisites }, index) => {
    const seen = new Map<string, string>();
    const edges: Edge[] = [];
    prerequisites.forEach((target, referenceIndex) => {
      const path = `/competencies/${index}/prerequisites/${referenceIndex}`;
      const common = { entityType: 'competency' as const, entityId: id, referenceId: target, path };
      const first = seen.get(target);
      if (first !== undefined) {
        errors.push({
          ...common, code: 'DUPLICATE_PREREQUISITE', relatedPath: first,
          message: `Competency "${id}" lists prerequisite "${target}" more than once. Remove the repeated reference.`,
        });
      } else {
        seen.set(target, path);
      }
      if (!competencyIndexes.has(target)) {
        errors.push({
          ...common, code: 'UNKNOWN_PREREQUISITE',
          message: `Competency "${id}" requires unknown competency "${target}". Correct the ID or add its canonical definition.`,
        });
      } else if (target === id) {
        errors.push({
          ...common, code: 'SELF_PREREQUISITE', cycle: [id, id],
          message: `Competency "${id}" requires itself (${id} -> ${id}). Remove this prerequisite.`,
        });
      } else if (first === undefined && !ambiguousIds.has(target)) {
        edges.push({ target, path });
      }
    });
    // Never choose between competing definitions. Other components can still be checked.
    if (!ambiguousIds.has(id)) graph.set(id, edges);
  });

  catalog.tracks.forEach(({ id, competencyIds }, index) => {
    const seen = new Map<string, string>();
    competencyIds.forEach((target, referenceIndex) => {
      const path = `/tracks/${index}/competencyIds/${referenceIndex}`;
      const common = { entityType: 'track' as const, entityId: id, referenceId: target, path };
      const first = seen.get(target);
      if (first !== undefined) {
        errors.push({
          ...common, code: 'DUPLICATE_TRACK_MEMBERSHIP', relatedPath: first,
          message: `Track "${id}" lists competency "${target}" more than once. Remove the repeated membership.`,
        });
      } else {
        seen.set(target, path);
      }
      if (!competencyIndexes.has(target)) {
        errors.push({
          ...common, code: 'UNKNOWN_TRACK_COMPETENCY',
          message: `Track "${id}" refers to unknown competency "${target}". Correct the ID or add its canonical definition.`,
        });
      }
    });
  });

  errors.push(...detectCycles(graph));
  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, stage: 'semantic', errors };
}
