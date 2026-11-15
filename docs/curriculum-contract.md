# Curriculum contract and validation

The Roadmap owns the canonical curriculum. C01 validates JSON structure; C02 adds identifier, reference, and prerequisite-graph validation for the complete catalog. C06 adds the production manifest and Foundations track, an in-memory catalog loader, content-reference validation for Markdown paths, anchors, and internal links, and one command that applies all of these to the real curriculum. Nothing here synchronizes repositories, renders content, fetches external URLs, or evaluates learner progress. The C01 and C02 APIs and the schema remain unchanged.

## Localization overlays

The structural contract below is English-only and stays at `schemaVersion` 1; `curriculum.schema.json` and the canonical records are unchanged. Translations are separate overlays with their own schema and version, described in [ADR 0001](adr/0001-curriculum-localization-overlays.md) and under [Localization overlay contract](#localization-overlay-contract). The infrastructure (schema, loader, validator, hash and tests) is implemented; the first reviewed `pt-BR` overlays (three competencies and the Foundations track) are included.

## Run the checks

Use Node.js 24.x and npm 11.x. The recorded package manager is npm 11.3.0. From this repository:

```sh
npm ci
npm test
npm run typecheck
npm run validate:curriculum
```

`npm test` runs Vitest once. `npm run typecheck` checks TypeScript without generating compiled files. `npm run validate:curriculum` validates the actual production curriculum, as described under [Repository validation command](#repository-validation-command). Dependencies are exact in `package.json`, with transitive versions and integrity hashes in `package-lock.json`. Installation requires registry access or a populated npm cache; the tests themselves require no network access or sibling repository.

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

The authoring layout uses a manifest, one JSON file per competency, and one JSON file per track under `curriculum/manifest.json`, `curriculum/competencies/`, and `curriculum/tracks/`. Production content currently includes [terminal file operations](modules/terminal-file-operations.md), [local access and secrets](modules/local-access-and-secrets.md), and [Git change management](modules/git-change-management.md), with their respective [terminal metadata](../curriculum/competencies/terminal-file-operations.json), [access metadata](../curriculum/competencies/local-access-and-secrets.json), and [Git metadata](../curriculum/competencies/git-change-management.json). The production [manifest](../curriculum/manifest.json) declares curriculum version `0.1.0`, and the [Foundations track](../curriculum/tracks/foundations.json) lists the three competencies; the [Foundations learning path](learning-paths/foundations.md) is its human-readable navigation page. The aggregate catalog is built in memory, as described under [Production catalog and aggregation](#production-catalog-and-aggregation). The [authoring guide](curriculum-authoring-guide.md) explains content conventions and checks for these records; the existing test fixtures remain synthetic. All three modules await practical laboratory execution.

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

For example, `docs/modules/fixture-root.md` and `docs/modules/example/fixture-root.md` have valid syntax. Absolute paths, `..` segments, backslashes, URL schemes, encoded path segments, and trailing newlines do not. Syntax checks do not prove filesystem containment, symlink safety, file existence, or anchor existence. [Content-reference validation](#content-reference-validation) establishes those for this repository; a consumer must still perform its own checks on whatever copy it imports.

Learning objectives, laboratories, challenges, assessments, and evidence criteria remain canonical Markdown. References do not duplicate their prose in metadata or UI components. The fixtures deliberately reference nonexistent synthetic module paths.

### Track

| Required field | Rule |
| --- | --- |
| `id` | Same stable identifier syntax as competencies |
| `title` | Nonempty, non-whitespace-only text |
| `competencyIds` | Nonempty array of identifiers |

Track files own membership. Competency records do not repeat a `tracks` field. A competency may be reused across tracks without creating another educational definition. Track ordering does not introduce prerequisites: `competencyIds` order is a suggested learning order that consumers may present, and only `prerequisites` restrict progression.

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

No new dependency is required for C02. Educational review and progress reconciliation remain separate future work.

## Production catalog and aggregation

Authors maintain separate files; the schema validates one aggregate object. `loadCurriculum(rootDir)` in [the loader](../scripts/load-curriculum.ts) builds that aggregate in memory. No `catalog.json` or other generated aggregate is written or committed, so there is no second copy to drift from its sources.

| Source | Aggregate property | Rule |
| --- | --- | --- |
| `curriculum/manifest.json` | `manifest` | Required regular file |
| `curriculum/competencies/<id>.json` | `competencies` | One record per file, ordered by ID |
| `curriculum/tracks/<id>.json` | `tracks` | One record per file, ordered by ID |

The aggregation contract for any consumer that reproduces it:

- **Inputs.** Only the three locations above are read. `curriculum/` itself, and both record directories, must be real directories; the manifest and every record must be regular files. Each is checked without following symbolic links, starting with `curriculum/`, before anything beneath it is listed or read. A symbolic link at any of these positions is rejected, whether it points inside or outside the repository, so loading cannot be redirected to other content. The record directories may contain only regular `.json` files directly inside them: no subdirectories, symbolic links, or other files. `rootDir` is the caller's chosen starting point and is used as given.
- **Identity.** A record's `id` must equal its file name without `.json`. Combined with the directory listing, this makes a duplicate ID impossible to author as two files, while the semantic validator still rejects duplicates in any aggregate it is given.
- **Order.** Records are sorted by ID using code-unit string comparison, independent of locale and of the order in which the filesystem lists entries. Arrays inside a record, such as `prerequisites` and `competencyIds`, keep their authored order. JSON Pointers in later diagnostics therefore refer to stable positions.
- **Content.** Each record is the parsed JSON value, unchanged. Nothing is trimmed, defaulted, merged, or derived, and no field such as a source revision or timestamp is added. The same files always produce an equal aggregate.
- **Validation.** The loader does not apply the schema. Its `catalog` is untrusted until the structural and semantic validators accept it.

On success the loader returns `{ ok: true, catalog, sources }`. `sources` lists the repository-relative file of each record, index-aligned with `catalog`, so `/competencies/1/title` can be traced to a file. Otherwise it returns `{ ok: false, errors }`, where each error has a `code`, a repository-relative `file`, and a `message`. If `curriculum/` is missing or is not a real directory, that single error is returned and nothing else is inspected. Otherwise independent problems are collected in one call, in a fixed order: the manifest, then competencies, then tracks. Within a record directory, unexpected entries come first, sorted by name; they are never read. The remaining regular `.json` files are still parsed, and their `INVALID_JSON` and `FILE_ID_MISMATCH` errors follow, sorted by the ID taken from the file name. A missing or invalid record directory produces one error for that directory.

| Code | Rejected condition |
| --- | --- |
| `MISSING_PATH` | `curriculum/`, the manifest, or one of the two record directories does not exist |
| `UNEXPECTED_ENTRY` | `curriculum/` or a record directory is not a real directory, the manifest is not a regular file, or a directory entry is not a regular `.json` file; this includes symbolic links |
| `INVALID_JSON` | A file cannot be parsed as JSON; the message does not repeat file content |
| `FILE_ID_MISMATCH` | A record's string `id` differs from its file name |

Unreadable files and other operating-system failures are not converted into diagnostics; they raise the original error.

A consumer that pins a Roadmap revision can apply the same rules to its own checkout and must validate the result against its reviewed copy of the schema. The loader in this repository is producer tooling, not an interface that consumers execute.

## Content-reference validation

`validateContentReferences(catalog, rootDir)` in [the content validator](../scripts/validate-content-references.ts) checks that references resolve to real content inside the repository. It expects a catalog that has already passed structural validation, reads files only, and never accesses the network.

It checks, in this order:

1. **Competency content.** Each `content.path` must be a normalized relative path under `docs/modules/` that names a regular file, and both `objectivesAnchor` and `completionCriteriaAnchor` must each match exactly one heading in that file. Two competencies may not share one path.
2. **Internal links.** Every inline link and image in every Markdown file under `docs/`, at any depth, must resolve to a regular file inside the repository. If the target is a Markdown file and the link has a fragment, the fragment must match exactly one heading in the target. A link consisting only of `#fragment` refers to its own file.
3. **Orphaned modules.** Every Markdown file under `docs/modules/` must be the content path of a competency.

Path rules apply equally to metadata paths and link targets:

- Each path segment must match a directory entry exactly, including letter case, so a result does not depend on a case-insensitive filesystem.
- No segment may be a symbolic link. Together with rejecting absolute paths and paths that climb above the repository root, this means a reference cannot reach a file outside the repository.
- Targets are compared literally. Percent-encoding and query strings are not interpreted, and backslashes are rejected.
- `http:`, `https:`, and `mailto:` targets are external. They are counted and never fetched; whether an external resource exists or is still accurate is a matter for [source verification](curriculum-authoring-guide.md#verify-and-attribute-resources), not automated validation. Any other URL scheme, and protocol-relative `//` targets, are rejected.
- A fragment on a target that is not a Markdown file is not checked.

Only Markdown under `docs/` is scanned. Files elsewhere, including repository-root files, are not inspected and cannot make validation fail.

### Heading anchors

Anchors come from [a deliberately small Markdown reader](../scripts/markdown-references.ts). It implements only what this curriculum needs and does **not** claim compatibility with GitHub or any other renderer. The rendering and anchor policy for integrated content is a separate, undecided architectural matter; consumers must not treat this algorithm as that decision.

- Headings are ATX headings: one to six `#` characters, a space, then text. Optional closing `#` characters are ignored.
- The anchor is the heading text, trimmed and lowercased, keeping only letters, combining marks, digits, `_`, `-`, and spaces, with each space or tab then replaced by `-`. Inline links contribute their text only. Runs are not collapsed: `Copy & verify` produces `copy--verify`, and `1. Establish the boundary` produces `1-establish-the-boundary`.
- Repeated headings produce the same anchor. No numeric suffix such as `-1` is generated. An unreferenced repetition is allowed; a reference to a repeated anchor is rejected as ambiguous, because different renderers would resolve it differently.
- Lines inside fenced code blocks, opened by three or more backticks or tildes, are neither headings nor links. Following CommonMark, a line of backticks whose remaining text contains another backtick, such as ```` ```code``` ````, does not open a fence; it is ordinary text, and the headings and links after it are checked. A tilde fence may carry any info text. A fence closes on a line holding only a marker of the same character that is at least as long. Inline code spans are not searched for links.
- A fenced code block that is never closed is rejected as `UNCLOSED_FENCE`, reported at its opening line. Markdown renderers accept such a block and treat the rest of the file as code; this validator refuses it because the headings and links after that line would otherwise go unchecked without notice.

### Known limitations of the Markdown reader

The reader works line by line and is not a Markdown parser. The cases below were confirmed against the implementation. They are grouped by consequence, because an unsupported construct that produces an error is safer than one that hides a problem.

**Reported as a failure although a renderer may accept it (false positives).** These are safe, and the remedy is to use the supported form:

| Construct | Behavior here |
| --- | --- |
| Setext heading (text underlined with `===` or `---`) | Not a heading; a reference to its anchor is `MISSING_ANCHOR` |
| Heading inside a block quote or list item (`> ## Title`, `- ## Title`) | Not a heading; a reference to its anchor is `MISSING_ANCHOR` |
| Raw HTML anchor (`<a id="x">`, `<a name="x">`) | Not an anchor; a reference to it is `MISSING_ANCHOR` |
| Example link in an indented code block (four or more leading spaces) | Indented code is not recognized; the link is checked like prose |
| Example link in an HTML comment | Comments are not recognized; the link is checked like prose |
| Fence indented four or more spaces, for instance inside a nested list | Not recognized as a fence; links inside it are checked like prose |
| Unclosed fenced code block | Always `UNCLOSED_FENCE` |
| Percent-encoded target or target with a query string | Compared literally; normally `MISSING_FILE` |

**Not checked, so a broken reference can pass (false negatives).** Avoid these forms in curriculum documents:

| Construct | Behavior here |
| --- | --- |
| Reference-style link (`[text][label]` with `[label]: target`) | Neither the use nor the definition is checked |
| Autolink (`<https://example.invalid>`) and bare URL | Not checked; these are external in any case |
| Raw HTML link or image (`<a href>`, `<img src>`) | Not checked |
| Link whose text or target wraps onto another line | Not checked |
| Image nested in a link (`[![alt](image.png)](target.md)`) | The outer target is checked; the inner image path is not |
| Fragment on a target that is not a Markdown file | Not checked |
| Anything in a Markdown file outside `docs/` | Not scanned |

**Anchors that can differ from a renderer's (either direction).** The anchor rule uses the heading's source text, not its rendered text, so a heading with markup can produce an anchor that no renderer generates. A link written for this validator may then not work when rendered, and a link that works when rendered may be reported as `MISSING_ANCHOR`:

| Heading content | Anchor here |
| --- | --- |
| Emphasis written with underscores (`_term_`) | Underscores are kept: `_term_` |
| Emphasis written with asterisks, or inline code | Markers are dropped, matching the visible text |
| Character entity (`A &amp; B`) | The entity name is kept as letters: `a-amp-b` |
| Inline HTML (`<code>x</code>`) | Tag names are kept as letters: `codexcode` |
| Repeated heading text | One shared anchor, never a `-1` suffix |

Use plain text, asterisk emphasis, or inline code in any heading that is linked or named in metadata. The curriculum's current documents use none of the constructs in the second and third groups in a way that affects a checked reference; that statement is a review observation, not something the validator enforces.

### Content diagnostics

The function returns `{ valid: true, errors: [], summary }`, where `summary` counts the Markdown files and the internal and external links seen, or `{ valid: false, errors }`. Every issue has a stable `code`, the failing `reference`, and a `message`. Issues from metadata carry `path`, a JSON Pointer into the catalog. Issues from a document carry `file` and, for links, a 1-based `line`.

| Code | Rejected condition |
| --- | --- |
| `UNSAFE_PATH` | A content path outside `docs/modules/` or not normalized; a link that is absolute, uses backslashes, uses an unsupported URL scheme, or resolves above the repository root |
| `SYMLINK_NOT_ALLOWED` | A referenced path, one of its parent directories, or an entry found under `docs/` is a symbolic link |
| `MISSING_FILE` | The target does not exist, differs only in letter case, or the link target is empty |
| `NOT_A_FILE` | The target exists but is a directory or special file |
| `MISSING_ANCHOR` | No heading in the target produces the anchor |
| `AMBIGUOUS_ANCHOR` | More than one heading in the target produces the anchor |
| `UNCLOSED_FENCE` | A Markdown file under `docs/` opens a fenced code block and never closes it; `line` is the opening line |
| `DUPLICATE_CONTENT_PATH` | A competency uses the content path of an earlier competency |
| `ORPHANED_MODULE` | A Markdown file under `docs/modules/` is not referenced by any competency |

Diagnostics are ordered: competency issues in catalog order; then, for each Markdown file in path order, its unclosed fence if any followed by its link issues in line order; then orphaned modules by path. Directory listings are sorted before use, so the order does not depend on the filesystem. A file that fails a path check is not read.

## Repository validation command

```sh
npm run validate:curriculum
```

This runs [the command-line entry point](../scripts/validate-curriculum-cli.ts) with Node.js directly, using its built-in TypeScript type stripping; no build step or additional dependency is involved. It validates the curriculum in the repository that contains the script, regardless of the current directory, by calling `validateCurriculumRepository` in [the repository validator](../scripts/validate-curriculum-repository.ts). That function reuses the existing validators without reimplementing them:

| Stage | Performed by | A failure reports |
| --- | --- | --- |
| `load` | `loadCurriculum` | Loader issues |
| `structural` | `validateCurriculum`, through the semantic entry point | Schema issues |
| `semantic` | `validateCurriculumSemantics` | Graph and reference issues |
| `content` | `validateContentReferences` and the production acceptance rule below | Content and acceptance issues together |

Before any validator is imported, the entry point runs `loadCurriculum` and then `checkSchemaSource(rootDir)` from the loader. This order matters because the structural validator reads and compiles the schema as soon as it is imported. A missing `curriculum/`, or a symbolic link in its place, is therefore reported as a `load` diagnostic, and neither the schema nor any record is read through the link. `checkSchemaSource` then requires `curriculum/schema/` to be a real directory and `curriculum.schema.json` to be a regular file containing JSON, checking each level without following symbolic links, and reports `MISSING_PATH`, `UNEXPECTED_ENTRY`, or `INVALID_JSON`. If the validators still cannot be imported, typically because the JSON is not a schema Ajv accepts, the command reports `VALIDATOR_INIT_FAILED` with the underlying message. All of these are printed in the `load` stage format with status `1` and no stack trace.

This ordering belongs to the command. The structural validator itself is unchanged: code that imports it directly still reads the schema during module initialization and fails there if the schema is unusable.

A failing stage stops later stages, because each stage relies on the guarantees of the one before. On success the command prints the curriculum version, the competency IDs, each track with its members, and the number of files and links checked, and exits with status `0`. On failure it prints the stage and one line per issue with its code, catalog location, source file, and message to standard error, and exits with status `1`. An unexpected operating-system error ends the process with a stack trace and a nonzero status.

The entry point accepts one optional argument, a repository root to validate with the same rules: `node scripts/validate-curriculum-cli.ts <directory>`. `npm run validate:curriculum` passes none and always validates this repository. The argument exists so that [the command's own tests](../tests/curriculum-cli.test.ts) can exercise failures on disposable synthetic repositories without touching production files.

### Node.js module hook and its stability

The validators import one another using `.js` specifiers, which TypeScript and Vitest resolve to the `.ts` sources but Node's type stripping does not. The entry point registers a process-local module resolution hook, [`module.registerHooks`](https://nodejs.org/download/release/v24.2.0/docs/api/module.html#moduleregisterhooksoptions), that maps relative `./name.js` imports made from files in `scripts/` to `./name.ts`. It writes no files and changes no validator.

Both features this depends on are experimental in the approved Node.js 24 toolchain. `module.registerHooks` is documented by Node.js as an experimental API that may change, and type stripping prints an experimental-feature warning on some Node.js 24 releases, including the one used here. That warning goes to standard error and is not a validation result; rely on the printed result and the exit status.

The command and its tests were validated with **Node.js 24.2.0** and npm 11.3.0 on 2026-11-13. Other Node.js 24 releases are expected to work but were not run. If a Node.js update changes or removes the hook API, the command fails at startup with an import error instead of reporting a false success, and `npm test` detects it because the tests run the command as a child process. The planned response in that case is to consider importing the `.ts` files by their real names, which Node resolves natively and which removes the hook; that requires editing the import lines of the existing validators and the TypeScript configuration, so it is deferred until it is needed or separately approved.

### Production acceptance rules

Some requirements describe this curriculum's current scope, not every valid catalog, so they are not part of the schema or the semantic validator:

- **Prerequisite closure of Foundations.** The `foundations` track must exist and must contain every prerequisite of each of its members. `validatePrerequisiteClosure(catalog, trackIds)` reports `REQUIRED_TRACK_MISSING` or `PREREQUISITE_OUTSIDE_TRACK`. The command applies it only to the track IDs in `PREREQUISITE_CLOSED_TRACK_IDS`. In general a prerequisite may still live outside a track, and future tracks are not bound by this rule unless they are added to that list deliberately.
- **Approved membership.** [The production acceptance tests](../tests/production-curriculum.test.ts) state the exact approved competency IDs, prerequisites, assessment revisions, track, and suggested order. Expanding the curriculum therefore requires a deliberate edit to those expectations; this is enforced by `npm test`, not by the command.

### Tests for C06

Synthetic tests create disposable repositories in the system temporary directory and remove them afterwards; they use no production lesson and no network. They cover [loading](../tests/load-curriculum.test.ts), [Markdown anchors and links](../tests/markdown-references.test.ts) including punctuation, whitespace, case, repeated and numeric headings, and fenced code, [content references](../tests/content-references.test.ts) including unsafe paths and symbolic links, and [stage ordering and prerequisite closure](../tests/curriculum-repository.test.ts). Regression tests cover a symbolic link in place of `curriculum/`, unclosed fenced code blocks, and backtick lines that are not valid opening fences. Start-up tests install a copy of the scripts in a disposable repository and confirm that a missing or symbolic-link `curriculum/`, including one that leads to an invalid schema, and a missing, linked, or invalid schema file each produce one coded diagnostic, a nonzero status, and no stack trace. [Command tests](../tests/curriculum-cli.test.ts) run the entry point as a child process against invalid synthetic repositories and check, for each stage, a status of `1`, the stable codes and source files on standard error, and the absence of any success output. The production acceptance tests read the real curriculum and also run the command as a child process.

No new dependency is required for C06. Passing these checks does not establish educational quality, the availability or accuracy of external resources, or that any laboratory has been executed.

## Localization overlay contract

Implemented in MVP 0.4-B. The overlay contract is versioned independently (`localizationVersion`, currently `1`) from `schemaVersion` and `curriculumVersion`. Nothing here changes how the English curriculum is validated; the localization stage runs only after every canonical stage has passed, and only when `curriculum/locales/` exists.

### Layout and schema

```text
curriculum/schema/localization.schema.json
curriculum/locales/<locale>/competencies/<competency-id>.json
curriculum/locales/<locale>/tracks/<track-id>.json
```

The only supported locale directory is `pt-BR`. One file holds one overlay, and the file name must equal the overlay `id`. [The schema](../curriculum/schema/localization.schema.json) rejects unknown properties at every object boundary, so an overlay can never carry `prerequisites`, `level`, `assessmentRevision`, `content`, `competencyIds`, progress or any other graph or assessment field.

Competency overlay (track overlays are identical except `kind` is `track` and there is no `summary`):

```json
{
  "localizationVersion": 1,
  "kind": "competency",
  "locale": "pt-BR",
  "id": "<competency-id>",
  "title": "…",
  "summary": "…",
  "status": "draft",
  "provenance": {
    "sourceHash": "sha256:<64 lowercase hex digits>",
    "method": "human",
    "translatedBy": "<role or account identifier>"
  }
}
```

| Field | Rule |
| --- | --- |
| `status` | `draft` or `reviewed`. `outdated` is never stored; it is derived from the hash. |
| `provenance.method` | `human` or `machine-assisted`. |
| `provenance.reviewedBy`, `reviewedAt` | Required when `status` is `reviewed` (date as `YYYY-MM-DD`) and forbidden when `draft`. The validator checks that they are present, not that a review really happened; values must come from a real review and must never be back-filled. |
| `provenance.reviewedBy` convention | Use a stable, verifiable reviewer identifier, such as the reviewer's GitHub handle (for example `gfnogueira`), without a leading `@`. Do not use display names, e-mail addresses or other personal data. Do not invent historical reviews: record only reviews that actually took place, on the date they took place. |

### Source hash

The hash records the English metadata a translation was made from. It is computed over metadata fields, never over file bytes, so reformatting a JSON record does not make a translation stale. Both functions live in [the hash module](../scripts/localization-hash.ts).

```text
competency: "sha256:" + hex( SHA-256( UTF-8( JSON.stringify({ title: NFC(title), summary: NFC(summary) }) ) ) )
track:      "sha256:" + hex( SHA-256( UTF-8( JSON.stringify({ title: NFC(title) }) ) ) )
```

The property order is fixed exactly as written. `NFC` is `String.prototype.normalize('NFC')`. There is no trimming, case folding or whitespace collapsing, so any wording change is detected. A track has a single translatable canonical field (`title`); its `id` is the overlay key and its `competencyIds` are graph membership, so neither is hashed and reordering or editing a track's members does not stale a title translation. Changing this algorithm is a contract change.

Test vectors (from [the tests](../tests/localization.test.ts)):

| Input | Hash |
| --- | --- |
| competency `Synthetic capability` / `Synthetic test record.` | `sha256:2153f5132c27fba5b095aa4454a8fef909f72e856435ee942ddfeab488c65c7c` |
| competency `Café` / `Maçã — é` (precomposed or decomposed input) | `sha256:fd648b69a8d720711d791384631d522caf9f93d3c1efc18bb796a61702837a79` |
| track `Synthetic track` | `sha256:32c795e9af69c09b5e0167dbf6b1c376770b4c1a542a85f32cd77745f88571c1` |
| track `Foundations` | `sha256:dbba71772c7a701403a4fa8acce084cec8cf3c707e7377485e50730a76100d00` |

### Validation and modes

`validateLocalization` in [the localization validator](../scripts/validate-localization.ts) loads and checks overlays; `validateCurriculumRepository` runs it as the `localization` stage after `content`. Issues have stable codes.

| Code | When |
| --- | --- |
| `UNEXPECTED_ENTRY` | A stray file or directory, or a symbolic link, where only locale directories, `competencies/`, `tracks/` or `<id>.json` files are allowed. Nothing is read through it. |
| `UNSUPPORTED_LOCALE` | A directory under `curriculum/locales/` that is not a supported locale. |
| `INVALID_JSON` | A file that does not parse; the parser message is not echoed. |
| `UNSUPPORTED_LOCALIZATION_VERSION` | `localizationVersion` is present and not `1`; the file is not interpreted further. |
| `SCHEMA_VIOLATION` | Any structural error, including forbidden fields. |
| `LOCALE_MISMATCH`, `KIND_MISMATCH`, `FILE_ID_MISMATCH` | The overlay disagrees with its directory or file name. |
| `UNKNOWN_ID` | The competency or track does not exist. Overlays cannot create entities. |
| `NOT_NFC` | Any string value is not NFC normalized. |
| `DUPLICATE_OVERLAY` | Two overlays for the same locale, kind and ID. |
| `STALE_TRANSLATION` (warning) | `sourceHash` differs from the current English hash. |
| `OUTDATED_REVIEWED_TRANSLATION` (error, strict only) | A `reviewed` overlay whose hash is stale. |
| `DRAFT_NOT_PUBLISHABLE` (warning, strict only) | A `draft` overlay: valid, but a consumer must show English. |

A translation is **publishable** only when it is `reviewed` and its hash matches. Missing translations are never an error in either mode; they are only counted as coverage.

| Condition | Development (default) | Strict (`--strict-translations`) |
| --- | --- | --- |
| Invalid JSON, schema, locale, ID, path, NFC, duplicate | error | error |
| `reviewed`, stale hash | warning | **error** |
| `draft`, stale hash | warning | warning |
| `draft`, current hash | accepted | accepted, reported as not publishable |
| Missing translation | accepted | accepted |

```sh
npm run validate:curriculum
npm run validate:curriculum -- --strict-translations
```

Warnings go to standard error and do not change the exit status; errors fail the command at the `localization` stage with status `1`. When `curriculum/locales/` exists, the success output adds a coverage line per locale (publishable, draft, outdated and missing counts). An unknown option is rejected. Without `curriculum/locales/` the command and its result are identical to before.

Not implemented: translated module bodies and module digests, Markdown rendering, translated anchors, snapshot export of overlays, `curriculumVersion` policy for overlays, and any consumer behavior. The hash covers title and summary only, so objective or module changes do not make a translation stale.

## Tool references

- [Ajv JSON Schema dialect support](https://ajv.js.org/json-schema.html)
- [Ajv validation options](https://ajv.js.org/options.html)
- [Vitest setup and runtime requirements](https://vitest.dev/guide/)
- [Node.js releases](https://nodejs.org/en/about/previous-releases)
