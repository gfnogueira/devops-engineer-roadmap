# ADR 0001: Curriculum localization overlays

Status: **Architectural direction approved; MVP 0.4-B infrastructure implemented.** The schema, loader, validator, hash and synthetic tests exist (see [Implementation status](#implementation-status)). **No real translation exists**, no human translation review has occurred, and consumer integration, module translation and Markdown rendering remain **not authorized**.

Numbering is local to this repository. Workspace-level records (for example the curriculum-contract ADR-0002 in the architecture register) are numbered independently.

## Status vocabulary

| Term | Meaning in this record |
| --- | --- |
| Approved for planning | The maintainer accepted the direction as the basis for MVP 0.4 planning. It fixes principles, not field names or algorithms. |
| Proposed detail | A concrete shape suggested here so planning can start. It is not approved and may change in MVP 0.4-B. |
| Not authorized | No schema, overlay, validator, importer, UI or content change may be made from this record alone. |
| Not validated | No experiment, prototype or test has been run against this design. |

No historical approval is claimed beyond the direction listed under [Decision](#decision). Earlier records (Skill Tree ADR 0004) say curriculum text is English only; that remains the **implemented** behavior until a later task changes it.

## Implementation status

MVP 0.4-B was authorized and implemented. Where this record's *Proposed detail* sections differ, the [curriculum contract](../curriculum-contract.md#localization-overlay-contract) describes the implemented behavior and is authoritative:

| Topic | Proposed here | Implemented |
| --- | --- | --- |
| Layout | `curriculum/localization/…` | `curriculum/schema/localization.schema.json` and `curriculum/locales/<locale>/{competencies,tracks}/<id>.json` |
| Stored status | `draft`, `reviewed`, `outdated` | `draft`, `reviewed` only; `outdated` is derived from the hash |
| Hash input | Sorted-key canonical JSON (RFC 8785 style) | `JSON.stringify({title, summary})` in that fixed order, NFC, SHA-256 over UTF-8; tracks hash `{title}` |
| Review metadata | Under `provenance` | Under `provenance`; required for `reviewed`, forbidden for `draft` |
| Overlay version | Unspecified | `localizationVersion: 1` in every overlay |
| Draft in release mode | Allowed, shown as English | Allowed (no failure), reported as `DRAFT_NOT_PUBLISHABLE` |

Not implemented and still unauthorized: real `pt-BR` overlays, snapshot export, consumer import and display, translated module bodies, module digests, Markdown rendering and anchor policy, and any decision on `curriculumVersion` for overlays.

## Context

- The Roadmap owns canonical curriculum content. Curriculum records are validated by `curriculum/schema/curriculum.schema.json` (`schemaVersion` 1), which rejects unknown properties at every object boundary. See the [curriculum contract](../curriculum-contract.md).
- The Skill Tree MVP 0.3 consumes a pinned, validated snapshot and offers a `pt-BR`/`en` interface, but shows curriculum text in English only.
- The maintainer works in Brazilian Portuguese. Learners benefit from translated titles, summaries and, later, modules, provided translations never weaken the canonical meaning or assessments.
- An independent discovery concluded that adding locale fields to the strict schema would force a breaking change on every consumer and mix translation churn with curriculum meaning.

## Decision

Approved for planning:

1. English is the canonical curriculum language.
2. Brazilian Portuguese (`pt-BR`) is the first supported translation.
3. Translations live in **separate localization overlays** indexed by the stable competency and track IDs.
4. A dedicated `localization.schema.json` carries its own versioned contract.
5. `curriculum.schema.json` stays at `schemaVersion` 1 and is not modified.
6. Competency IDs, prerequisites, `assessmentRevision` and learner progress do not depend on locale.
7. Existing English Markdown paths and contents are preserved.
8. Only reviewed, current translations are shown to learners; everything else falls back explicitly to English.
9. Translation freshness is checked during validation.
10. The Skill Tree consumes only pinned, validated curriculum snapshots and has no runtime dependency on the private Roadmap repository.

Not approved: field names, directory names, hash algorithm details, overlay granularity, how translated module bodies are stored, and any Markdown rendering. Sections below marked *Proposed detail* are starting points for MVP 0.4-B.

## Localization overlay contract

Approved principle: an overlay adds translated text for entities that already exist in the curriculum. It cannot create, rename, remove or restructure them.

- An overlay is addressed by `(locale, entity kind, stable ID)`. IDs are the same as in the canonical records.
- An overlay may carry only translatable text (initially competency `title` and `summary`, and track `title`) and translation metadata. It must not contain `id` redefinitions, `level`, `prerequisites`, `assessmentRevision`, track membership or content paths.
- Unknown properties are rejected, as in the curriculum schema.
- The overlay contract has its own version, independent of `schemaVersion` and `curriculumVersion`.
- Overlays for an ID that does not exist in the curriculum are errors, not warnings.

*Original proposal* (superseded by the implemented shape in the curriculum contract):

```json
{
  "id": "git-change-management",
  "title": "…",
  "summary": "…",
  "provenance": {
    "sourceHash": "sha256:…",
    "method": "human | machine-assisted",
    "translatedBy": "…",
    "reviewedBy": "…",
    "reviewedAt": "…"
  },
  "status": "draft | reviewed | outdated"
}
```

`reviewedBy` and `reviewedAt` appear only when `status` is `reviewed`. Values must come from a real review; none may be fabricated or back-filled for existing text.

## Schema compatibility

- `curriculum.schema.json` and its `schemaVersion` 1 are unchanged. A consumer that understands only schema 1 continues to work with or without overlays.
- `localization.schema.json` is new and versioned separately. Unsupported overlay versions are reported, never guessed.
- `curriculumVersion` is **not** changed by this ADR. Whether adding overlays changes it (a producer decision) is deferred to implementation.
- Overlay data is validated at the boundary with its own schema plus cross-checks against the curriculum (IDs exist, hash matches); TypeScript types are not validation.

## File organization

Approved: English Markdown modules keep their paths and contents. Overlays are stored separately from the canonical curriculum records.

*Original proposal* (the implemented layout is in [Implementation status](#implementation-status)): a new directory outside `curriculum/competencies/` and `curriculum/tracks/`, grouped by locale, for example:

```text
curriculum/localization/localization.schema.json
curriculum/localization/pt-BR/competencies/<competency-id>.json
curriculum/localization/pt-BR/tracks/<track-id>.json
```

Per-entity files keep review diffs small and avoid merge conflicts between translators; a single file per locale is the alternative. Translated module bodies are future scope and, if added, must live under a locale-specific path, never replace `docs/modules/<name>.md`.

## Translation provenance

Approved principle: every translation records which English source it was made from, so freshness can be computed instead of assumed.

*Original proposal* (the implemented algorithm is in the curriculum contract):

- The source is the English `title` and `summary` of the entity at translation time. Provenance stores a hash of a **deterministic canonical representation**.
- Canonical representation: apply Unicode NFC to `title` and `summary`; serialize `{"summary": …, "title": …}` as JSON with sorted keys and no insignificant whitespace (RFC 8785 style, UTF-8); hash with SHA-256. No trimming, case folding or whitespace collapsing, so any wording change is detected.
- The algorithm is versioned by the overlay contract, so changing it is a contract change.
- Provenance also records the translation method (human or machine-assisted) and who translated it, using stable role or account identifiers rather than personal data beyond what is necessary.

## Review status

States: `draft`, `reviewed`, `outdated`.

- `draft`: translated, not reviewed. Never shown to learners.
- `reviewed`: a fluent reviewer approved this text against the recorded source hash.
- `outdated`: the English source changed after the translation. This may be **derived** (recorded hash differs from the current canonical hash) rather than only stored; the validator must derive it and not trust a stored `reviewed` claim.
- A translation is **current** only when its status is `reviewed` **and** its source hash equals the current English hash.
- Editing translated text after review returns it to `draft`.

## Fallback policy

- Learners see a translation only when it is reviewed and current.
- A missing, `draft` or `outdated` translation falls back to the English canonical text. The fallback is **explicit**: the consumer knows it fell back and can say so, rather than silently mixing languages.
- Fallback applies per entity and per field set; it never changes IDs, prerequisites, eligibility or progress.
- Showing machine-translated or unreviewed text to learners is not permitted by this policy.

## Validation policy

Producer-side, deterministic and with stable error codes, following the existing validators.

- Always an error: overlay for an unknown ID, duplicate overlay, unknown property, forbidden field (for example `assessmentRevision`), invalid locale, unsupported overlay version, malformed hash, `reviewed` without review metadata.
- Freshness: recompute the English hash and compare.
  - **Development mode:** stale or `outdated` translations are reported as **warnings**.
  - **Release mode:** a translation claimed as current (`reviewed`) whose source hash is stale is **rejected**. A translation that is honestly marked `outdated` or `draft` is allowed and is shown as English.
- Missing translations are not errors in either mode; they are coverage information.
- Unicode text is NFC-normalized before comparison; non-NFC input is reported.
- Anchors: any anchor the overlay stores or references is normalized to NFC. The current anchor reader only keeps letters, combining marks, digits, `_`, `-` and spaces, and is explicitly not renderer-compatible. Stable anchor handling (normalization, collisions between translated headings, renderer parity) is a requirement for **future** Markdown rendering and is not solved here.
- When translating educational modules (future), technical commands, code blocks, expected outputs and safety directives must be preserved exactly; only prose is translated. Validation of this is future work.

## Assessment revision invariants

- `assessmentRevision` lives only in canonical competency records and changes only under the existing policy (objectives, acceptance evidence or required prerequisites change).
- A translation-only edit must **never** change `assessmentRevision`, prerequisites or any canonical field.
- An English title or summary edit makes translations stale but does not by itself change `assessmentRevision`, consistent with the existing editorial-change policy.
- Learner progress is keyed by competency ID and `assessmentRevision` and is independent of locale; switching language never creates, removes or reconciles progress.

## Producer-consumer integration

- The Roadmap produces curriculum records and, later, overlays plus validation. The Skill Tree consumes only a **pinned, validated snapshot** and never fetches a floating branch at runtime.
- There is no runtime dependency on the private Roadmap repository.
- Overlays enter the consumer only through the existing snapshot import path (Skill Tree ADR 0001) after the consumer validates them against a locally reviewed `localization.schema.json`.
- Update order when implemented: producer schema and validator first, then overlays, then a reviewed producer revision to pin, then the consumer importer and UI. The consumer must keep working with snapshots that contain no overlays.
- Cross-repository coupling requires this contract and the integration choice to be accepted before implementation, as required by the workspace instructions.
- Out of scope for MVP 0.4-B: Markdown rendering and module-digest integration.

## Migration strategy

1. No migration of existing data is needed: English records, paths and progress are untouched.
2. MVP 0.4-B (needs its own authorization): define `localization.schema.json`, the canonical hash, the validator and tests with synthetic fixtures. No real translation yet.
3. Later: first reviewed `pt-BR` overlays for the three Foundations competencies and the track, then consumer import and display.
4. Module translation and rendering are separate decisions.

## Risks and limitations

- Review capacity: reviewed translations require a fluent reviewer; stale overlays will fall back to English often.
- Hash sensitivity: any English whitespace or punctuation change marks translations stale; this is intentional but adds churn.
- Hash covers only title and summary; changes to module bodies or objectives are not detected by it (module digests are deferred).
- The anchor algorithm and rendering policy are undecided; translated headings may produce unstable anchors.
- Mixed-language UI is possible during partial coverage; the consumer must communicate fallbacks.
- Overlay storage layout and granularity are proposed, not decided.
- The existing Skill Tree ADR 0004 and README state that curriculum text is not translated; they describe current behavior and become outdated only when implementation is authorized.
- Nothing here has been prototyped, so feasibility of the hash and validator behavior is untested.

## Remaining decisions before implementation

- Authorization to start MVP 0.4-B.
- Overlay file layout and granularity; exact provenance fields and locale code form.
- Whether `curriculumVersion` changes when overlays are added.
- Who reviews `pt-BR` and what counts as an acceptable review record.
- Snapshot update policy and which Roadmap revision to pin.
