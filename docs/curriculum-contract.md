# Curriculum contract and validation

The Roadmap owns the canonical curriculum. C01 validates JSON structure; C02 adds identifier, reference, and prerequisite-graph validation for the complete catalog. Neither implementation inspects Markdown files, synchronizes repositories, renders content, or evaluates learner progress. The original C01 API and schema remain unchanged.

## Run the checks

Use Node.js 24.x and npm 11.x. The recorded package manager is npm 11.3.0. From this repository:

```sh
npm ci
npm test
npm run typecheck
```

`npm test` runs Vitest once. `npm run typecheck` checks TypeScript without generating compiled files. Dependencies are exact in `package.json`, with transitive versions and integrity hashes in `package-lock.json`. Installation requires registry access or a populated npm cache; the tests themselves require no network access or sibling repository.

The initial verification used Node.js 24.2.0 and npm 11.3.0. It used a previously populated npm cache because live registry access was unavailable. Direct dependency metadata, engine requirements, upstream repository URLs, and cached package integrity were checked before installation. This is not a claim of a live vulnerability audit or verification of every upstream release signature.

| Development dependency | Exact version | Purpose |
| --- | --- | --- |
| Ajv | 8.20.0 | Compile the local Draft 2020-12 schema and validate input |
| Vitest | 5.1.0 | Run structural and semantic contract tests in Node |
| TypeScript | 6.0.3 | Check the validation utility and tests in strict mode |
| @types/node | 24.13.2 | Supply Node.js API types for the toolchain |

Vite is a required peer of Vitest and is resolved through the lockfile. No browser runner, UI framework, schema conversion library, or additional format plugin is installed directly. The root package is marked private to prevent accidental npm publication; this does not decide repository visibility or licensing.

## Canonical schema and document shape

[The schema](../curriculum/schema/curriculum.schema.json) uses JSON Schema Draft 2020-12. It contains reusable `$defs` for identifiers, text, manifest, content references, competencies, and tracks. It is the single structural specification; the TypeScript utility does not maintain a second field model.

The structural catalog has exactly three required top-level properties:

```json
{
  "manifest": {
    "schemaVersion": 1,
    "curriculumVersion": "0.1.0"
  },
  "competencies": [],
  "tracks": []
}
```

An empty catalog is structurally valid. It is not a complete learning product. A declared track must contain at least one competency ID. The three-competency delivery requirement is a product acceptance criterion, not a schema restriction.

The authoring layout uses a manifest, one JSON file per competency, and one JSON file per track under `curriculum/manifest.json`, `curriculum/competencies/`, and `curriculum/tracks/`. C03 introduces the first production [competency record](../curriculum/competencies/terminal-file-operations.json) and its [canonical module](modules/terminal-file-operations.md). Production manifest/track files and file aggregation remain future work. The [authoring guide](curriculum-authoring-guide.md) explains content conventions and a bounded structural check for this record; the existing test fixtures remain synthetic.

### Manifest

| Required field | Rule |
| --- | --- |
| `schemaVersion` | Integer equal to `1`; other values are unsupported |
| `curriculumVersion` | Three nonnegative integers separated by dots, without leading zeros: `MAJOR.MINOR.PATCH` |

Prerelease/build suffixes are outside the initial curriculum release format. The release policy is patch for editorial fixes, minor for compatible additions, and major for incompatible curriculum changes. A change to accepted structural rules requires an explicit schema-version review; consumers must not assume a new version is supported. These rules apply even during the initial `0.x` editions.

The validator checks version structure, not whether a particular editorial change deserves a release increment. A future importer records `sourceRevision` from the actual checkout outside the author-maintained manifest. Progress `storageVersion` belongs to the application and is not part of this schema.

### Competency

| Required field | Rule |
| --- | --- |
| `id` | Stable lowercase kebab-case identifier, starting with a letter; subsequent segments may contain lowercase ASCII letters and digits |
| `title` | Nonempty text containing at least one non-whitespace character |
| `summary` | Nonempty text containing at least one non-whitespace character; short discovery description, not a duplicate lesson |
| `level` | `foundations`, `junior`, `mid-level`, `senior`, or `specialist` |
| `assessmentRevision` | Integer greater than or equal to `1` |
| `prerequisites` | Array of identifiers; an empty array describes a root |
| `content` | Markdown reference object described below |

Identifiers remain stable when titles change. Levels describe educational scope, not professional certification. Prerequisites use AND semantics: a learner must satisfy every required prerequisite. This validator only checks the array and identifier syntax; it does not implement that progression behavior.

Increment `assessmentRevision` when objectives, required evidence, or mandatory prerequisites change. Editorial changes alone do not require an assessment revision. This policy is documented here, but comparison with previous revisions and progress reconciliation are not implemented.

### Content reference

| Required field | Rule |
| --- | --- |
| `path` | Relative `.md` path under `docs/modules/`; lowercase kebab-case directory and filename segments, optionally nested |
| `objectivesAnchor` | Identifier syntax, without a leading `#` |
| `completionCriteriaAnchor` | Identifier syntax, without a leading `#` |

For example, `docs/modules/fixture-root.md` and `docs/modules/example/fixture-root.md` have valid syntax. Absolute paths, `..` segments, backslashes, URL schemes, encoded path segments, and trailing newlines do not. Syntax checks do not prove filesystem containment, symlink safety, file existence, or anchor existence; later content/import checks must establish those separately.

Learning objectives, laboratories, challenges, assessments, and evidence criteria remain canonical Markdown. References do not duplicate their prose in metadata or UI components. The fixtures deliberately reference nonexistent synthetic module paths.

### Track

| Required field | Rule |
| --- | --- |
| `id` | Same stable identifier syntax as competencies |
| `title` | Nonempty, non-whitespace-only text |
| `competencyIds` | Nonempty array of identifiers |

Track files own membership. Competency records do not repeat a `tracks` field. A competency may be reused across tracks without creating another educational definition. Track ordering does not introduce prerequisites.

Unknown properties are rejected at every object boundary: catalog, manifest, competency, content reference, and track. No input is trimmed, coerced, defaulted, or stripped of extra fields.

## Structural validation API and diagnostics

`validateCurriculum(input: unknown)` in [the utility](../scripts/validate-curriculum.ts) accepts already parsed JSON. It returns either:

```json
{ "valid": true, "errors": [] }
```

or a result such as:

```json
{
  "valid": false,
  "errors": [
    {
      "path": "/competencies/0/title",
      "keyword": "required",
      "message": "must have required property 'title'"
    }
  ]
}
```

Paths use JSON Pointer; an empty path denotes the document root. Missing and extra properties are included in the diagnostic path. Property names are escaped correctly. Diagnostics include the violated rule and a message, not the entire input or its values. One invalid field may violate more than one structural rule.

The function compiles the trusted local schema once and copies diagnostics into each result so later calls do not replace earlier errors. It does not fetch remote schemas or accept an input-supplied schema. JSON parsing and file discovery are caller responsibilities. A malformed trusted schema fails during module initialization instead of silently accepting data.

## Fixtures and test boundaries

[The valid fixture](../tests/fixtures/curriculum.valid.json) contains a synthetic root, a synthetic dependent, and one synthetic path. These are not learning modules or an approval of production competency scope.

[The negative cases](../tests/fixtures/curriculum.invalid.json) each describe one set/remove operation against a fresh copy of the valid fixture, with an expected diagnostic path and keyword. This avoids repeating full catalogs or introducing unrelated faults into one case. Tests assert rejection for the intended reason and verify that validation leaves the input unchanged.

Other tests cover all five levels, an empty catalog, non-object input, escaped diagnostic paths, and diagnostics retained across calls.

The structural API deliberately accepts structurally valid records even when their relationships are invalid. Call the semantic entry point below when checking a full catalog. Neither entry point establishes pedagogical quality, checks real files/anchors, implements synchronization, or awards learner completion.

## Semantic validation API and diagnostics

`validateCurriculumSemantics(input: unknown)` in [the semantic validator](../scripts/validate-curriculum-semantics.ts) first calls the unchanged structural validator. If structure is invalid, it returns `{ valid: false, stage: "structural", errors }` with the original C01 diagnostics and does not traverse the graph.

For a structurally valid catalog it checks every competency and track, including competencies absent from all learning paths. There is no selected-track parameter and no dependency on the frontend, DOM, browser storage, or a sibling repository. The internal TypeScript relation projection is used only after schema validation; it does not replace the canonical contract.

On success it returns `{ valid: true, errors: [] }`. Semantic failures return `{ valid: false, stage: "semantic", errors }`. Every semantic issue contains:

- `code`: a stable machine-readable identifier listed below.
- `entityType`: `competency` or `track`.
- `entityId`: the affected competency or track ID.
- `referenceId`: the repeated ID, missing target, self-reference, or target of a cycle-closing edge.
- `path`: a JSON Pointer to the affected field or reference.
- `message`: an English explanation with a corrective action, without lesson text or full curriculum objects.

Duplicate issues also include `relatedPath` pointing to the first occurrence. Cycle issues include `cycle`, a closed path with its first ID repeated at the end.

| Code | Rejected condition |
| --- | --- |
| `DUPLICATE_COMPETENCY_ID` | A competency ID occurs more than once |
| `DUPLICATE_TRACK_ID` | A track ID occurs more than once |
| `DUPLICATE_PREREQUISITE` | The same prerequisite is repeated within one competency |
| `DUPLICATE_TRACK_MEMBERSHIP` | The same competency is repeated within one track |
| `UNKNOWN_PREREQUISITE` | A prerequisite ID does not exist in the competency catalog |
| `UNKNOWN_TRACK_COMPETENCY` | A track member ID does not exist in the competency catalog |
| `SELF_PREREQUISITE` | A competency requires itself; `cycle` is `[id, id]` |
| `DEPENDENCY_CYCLE` | A chain of prerequisites leads back to an active ancestor |

Competency IDs and track IDs have separate uniqueness scopes. Reusing a competency in several tracks is valid; repeating it within one track is not. Shared prerequisites, diamonds, and cross-track dependencies are valid. A prerequisite does not need membership in the current track, or in any track. An empty catalog remains valid for both validators.

### Cycle paths and incomplete references

Cycle paths follow stored dependency direction: each competency requires the next. This is the reverse of the prerequisite-to-dependent arrows normally used in teaching diagrams. For `a` requiring `b` and `b` requiring `a`, the diagnostic is:

```json
{
  "code": "DEPENDENCY_CYCLE",
  "entityType": "competency",
  "entityId": "b",
  "referenceId": "a",
  "path": "/competencies/1/prerequisites/0",
  "cycle": ["a", "b", "a"],
  "message": "Prerequisite cycle detected: a -> b -> a. Remove or revise a prerequisite in this cycle."
}
```

Duplicate identifiers and references are diagnosed before cycle traversal. Duplicate competency definitions are never silently overwritten or selected as authoritative. Ambiguous competency IDs and edges targeting them are omitted from cycle traversal; unknown references are also omitted after being reported. Repeated edges are traversed once. Self-edges receive their dedicated diagnostic and are not reported a second time as a general cycle.

The catalog still fails validation for those errors, and independent unambiguous components are checked for cycles in the same call. Fix ambiguous IDs and missing references and rerun validation to obtain complete diagnostics for the corrected graph.

Cycle detection uses iterative depth-first traversal across all components. It reports a complete witness for each encountered edge to an active ancestor, without including acyclic prefixes or claiming to enumerate every possible simple cycle. It uses linear graph traversal work plus the cost of constructing the reported cycle paths, and does not depend on the JavaScript recursion limit.

### Determinism and tests

Results are deterministic for the same ordered input. Diagnostic order is competency ID duplicates, track ID duplicates, prerequisite issues, track membership issues, then cycle witnesses. Within these stages, catalog/reference order determines traversal and output order. Reordering arrays can change diagnostic paths and the chosen cycle witness; it cannot turn an invalid graph into a valid graph.

The validators do not mutate the input or retain semantic traversal state between calls. [Semantic tests](../tests/semantics.test.ts) build fresh synthetic catalogs independently for each case. They cover roots, chains, diamonds, shared prerequisites and membership, cross-track relationships, each error code, disconnected cycles, cycles beyond an already completed branch, structural short-circuiting, stable diagnostics, and a 12,000-node chain and closing cycle. The C01 fixtures and tests are preserved unchanged.

No new dependency is required for C02. Filesystem/content validation, educational review, and progress reconciliation remain separate future work.

## Tool references

- [Ajv JSON Schema dialect support](https://ajv.js.org/json-schema.html)
- [Ajv validation options](https://ajv.js.org/options.html)
- [Vitest setup and runtime requirements](https://vitest.dev/guide/)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
