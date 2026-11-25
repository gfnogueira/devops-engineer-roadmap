# Curriculum Authoring Guide

Use this guide to propose or revise educational content in the DevOps Engineer Roadmap. The Roadmap maintains the canonical lessons and competency metadata. A consuming application may present that material, but educational corrections belong here.

Write project content in English. A contributor should be able to understand, review, and maintain a module using this repository alone. No personal tooling, sibling checkout, or external workspace document is required.

## Start with a capability and its evidence

Describe a bounded learner outcome before choosing commands or resources. For example, a learner can preserve an original file, diagnose a path mistake, and prove that a handoff copy is correct. A list of commands does not establish that capability.

Choose a level according to the work learners can demonstrate: Foundations introduces bounded tasks and familiar failures; Junior combines established workflows; Mid-Level requires more independent integration and diagnosis; Senior emphasizes design and operational judgment; Specialist develops depth in a particular domain. These labels do not certify job seniority.

The initial approved Foundations competencies are:

| Stable ID | Required competency IDs | Content status |
| --- | --- | --- |
| `terminal-file-operations` | None | [Module available](modules/terminal-file-operations.md); see its verification status |
| `local-access-and-secrets` | `terminal-file-operations` | [Module available](modules/local-access-and-secrets.md); see its verification status |
| `git-change-management` | `terminal-file-operations` | [Module available](modules/git-change-management.md); see its verification status |

Validation differs by module: some laboratory execution has been recorded, but it is partial, and each module's own verification status says what has and has not been checked. This list records scope and prerequisite intent; it is not a second machine-readable track definition. The [Foundations learning path](learning-paths/foundations.md) is the learner-facing entry point for these modules, and [the Foundations track record](../curriculum/tracks/foundations.json) holds the machine-readable membership. Do not create placeholder links to unpublished modules or expand the curriculum while fixing an existing lesson.

## Use a consistent module structure

Each complete module has one title and the following eleven second-level headings, in order. Third-level headings can organize the actual lesson. Keep the prose readable without relying on a graph, color, or mouse-only interaction.

| Heading | What a reviewer should find |
| --- | --- |
| Overview | Learner outcome, competency identity, level, and an honest verification status |
| Why It Matters | A concrete engineering situation that makes the capability useful |
| Prerequisites | Required competencies separately from tools, permissions, accounts, and environment assumptions |
| Learning Objectives | A small set of observable outcomes with local labels such as O1 and O2 |
| Core Concepts | Explanations that make the exercises understandable, including limits and common misconceptions |
| Recommended Resources | A few relevant sources with reading purpose, access conditions, and verification information |
| Hands-on Labs | Guided practice with setup, checkpoints, an intentional failure, recovery, and cleanup |
| Practical Challenges | A changed scenario requiring the learner to choose an approach independently |
| Knowledge Assessment | Questions about reasoning and diagnosis, with answer guidance or a rubric |
| Completion Criteria | Objective-to-evidence mapping and explicit pass/fail rules |
| Next Steps | Remediation and real follow-on links, with unavailable topics clearly labeled as planned |

The sequence is **Learn → Practice → Build → Validate**. Concepts support guided work; the independent challenge checks transfer; assessment and evidence establish completion. Use internal links to make the route from practice to challenge, assessment, and final cleanup explicit, especially when cleanup appears earlier in the document. Do not replace an explanation with a link or require learners to infer essential safety steps from external documentation.

## Write assessable objectives

Give each objective an action, context, and observable success condition. “Understand file paths” is too vague. “From a child directory, locate the unchanged source using relative and absolute paths and explain both results” can be assessed.

Use objective labels within the Markdown to connect concepts, exercises, questions, and evidence. Every objective needs a practice opportunity and an assessment. Remove an objective if the module never teaches or evaluates it; add the missing exercise if it is essential.

Keep the level appropriate: a Foundations learner should encounter a bounded task with clear feedback. A root competency must provide enough orientation to begin without already knowing the skill it teaches. Explain how to reach the exercise's starting location; distinguish auxiliary safety code from the capability being assessed. Advanced detail can be optional, but an essential prerequisite cannot be hidden in an optional reference.

## Design practice, challenges, and recovery together

Before writing a command block, identify its starting state, expected change, and how the learner will inspect that change. Explain commands in context, especially redirection, overwrite behavior, privilege changes, and removal.

A guided exercise must state:

- Environment assumptions and utilities needed, with tested versions only when actually tested.
- Where its disposable workspace begins and what it is allowed to modify.
- Synthetic inputs and expected artifacts or observations.
- Steps with checkpoints that distinguish normal output from expected failure.
- A realistic fault the learner can diagnose safely, plus a recovery route. Distinguish fresh setup from resuming an interrupted session: restore required settings, inspect existing artifacts, and identify the next unfinished step without blindly repeating writes.
- Security checks and cleanup with observable confirmation.

An independent challenge changes the input or situation and supplies constraints and acceptance criteria. Include a decision the learner must explain, such as selecting the correct input from its contents or investigating a symptom without a prescribed failing command. Changing filenames alone provides little evidence of transfer. Let the learner select the operations; provide optional hints separately. Ensure the challenge also has a cleanup plan.

Prefer commands available on both Linux and macOS when that is the module's scope. Use POSIX-compatible syntax where possible, and label platform-specific commands or options. Differences in shell, filesystem, permissions, and diagnostic text are part of the environment contract. A portability review is not a substitute for running the exercise on its supported platforms.

## Make evidence and assessment explicit

The Completion Criteria table must connect each objective to practice, assessment, required evidence, and a pass condition. Evidence can be a file comparison, a small synthetic artifact, a diagnostic explanation, or an observed recovery. Define what makes it correct; “provide a screenshot” alone is insufficient.

Questions should uncover misconceptions: why a command failed, what a safety option does not protect, or how the learner would verify a recovery. Put questions and answer guidance in separate Markdown subsections with navigation links so learners can attempt answers first. Supply reasoning in the guidance and accept equivalent correct approaches; no interactive component is required.

For mandatory outcomes, missing evidence means **not yet passed**. A successful functional result cannot compensate for a failed security check. Explain how to retry failed criteria. Identify whether completion is self-assessed or peer-reviewed; do not imply an automated assessment or professional credential that does not exist.

Use only synthetic examples of learner evidence. Do not request real credentials, production logs, or public uploads containing personal paths. Learners may review evidence locally before deleting temporary artifacts.

## Keep exercises safe and bounded

Use disposable local resources by default. New cloud accounts, paid infrastructure, containers, administrative privileges, or live-system access need a justified, explicitly scoped learning requirement; they are not needed for the initial terminal module.

Choose a security control related to the capability and make its result observable. For file operations, this includes scoped paths, preserved originals, overwrite protection, and restrictive creation permissions. Explain limits rather than treating one setting as complete protection.

Make destructive targets explicit before showing the command. Avoid broad paths, ambiguous variables, recursive deletion shortcuts, and wildcard cleanup. Guard dependent actions when a location change can fail. Confirm cleanup only after successful removal and verification of the recorded target; a failed step must leave the learner able to inspect and recover, rather than automatically ending the shell. A safe failure should teach diagnosis without damaging unrelated files. Explain what can be recovered from a backup and what cannot be undone.

Removal by explicit name is the default. An exception needs a concrete reason that the module states for the learner, such as a tool that creates internal files the learner cannot reasonably name. The [Git module's cleanup](modules/git-change-management.md#cleanup-after-assessment) is the only current exception: it removes one dedicated laboratory directory after separate verification and typed confirmation, and stops whenever a check is inconclusive. Treat it as a reviewed special case to study, not a pattern to copy; this guide intentionally provides no reusable recursive-removal snippet.

When an exercise depends on an installed tool, state the minimum supported version derived from the features actually used, the recommended maintained release, and the versions practically tested, as three separate facts. Check the installed version before the first dependent step and stop with clear guidance if it is insufficient. Do not install or upgrade software on the learner's behalf, and keep tool configuration scoped to the exercise rather than the learner's account.

Do not turn a security explanation into a requirement to change a learner's global configuration. Report environmental limitations instead of suggesting privilege escalation as a routine fix.

## Verify and attribute resources

Prefer upstream documentation, standards, and official maintainers. Read the actual destination and relevant section before labeling a resource verified; a successful HTTP request alone is not enough. If a standard is accessed through an attributed reproduction, say so. Label archived documentation and version limits.

For each resource, record its title/publisher, relevant learning purpose, URL, access/account requirements, possible exercise costs, applicable version or edition, and actual review date. Shared notes or table columns may avoid repeating identical facts. A free document does not establish that its cloud exercise is free.

If verification fails, record the failure and leave that claim unverified, or replace it with an inspected authoritative source. Do not invent a URL or advance a review date for material you did not inspect. Explain concepts in original prose, link to supporting material, and preserve attribution; do not copy third-party tutorials into the curriculum.

## Follow the existing metadata contract

The [curriculum contract](curriculum-contract.md) and [canonical JSON Schema](../curriculum/schema/curriculum.schema.json) define accepted data. Keep learning prose in Markdown and reference it from JSON.

| Location | Responsibility |
| --- | --- |
| `docs/modules/<id>.md` | Canonical lesson, objectives, exercises, assessment, and completion criteria |
| `curriculum/competencies/<id>.json` | Discovery fields, stable identity, required prerequisites, assessment revision, and Markdown references |
| `curriculum/manifest.json` | Catalog schema version and curriculum version |
| `curriculum/tracks/<id>.json` | Track identity, membership, and suggested learning order |
| `docs/learning-paths/<id>.md` | Human-readable navigation for a track; links to modules without repeating their lessons |

There are currently three production competency records, one for each approved Foundations competency, a manifest at curriculum version `0.1.0`, and one track, `foundations`. Each record's `id` must equal its file name without `.json`, and the two record directories may contain nothing else. The catalog is [aggregated in memory](curriculum-contract.md#production-catalog-and-aggregation) from these files; do not create or commit a combined catalog file.

A track's `competencyIds` order is the suggested learning order shown on its learning-path page. It never adds a requirement: only `prerequisites` do. The Foundations track must also contain every prerequisite of its members.

A competency record must contain exactly `id`, `title`, `summary`, `level`, `assessmentRevision`, `prerequisites`, and `content`. Use lowercase kebab-case IDs and preserve them when titles change. The terminal competency is a root with an empty prerequisite array; dependent competencies list all required IDs, using AND semantics.

`content` contains `path`, `objectivesAnchor`, and `completionCriteriaAnchor`. Paths stay under `docs/modules/` and end in `.md`. Anchor values omit `#`. Use the unique headings `## Learning Objectives` and `## Completion Criteria` with `learning-objectives` and `completion-criteria` as their respective references. Schema validation alone cannot establish that the file and headings exist; [content-reference validation](curriculum-contract.md#content-reference-validation) does.

The summary is a short discovery description. Do not put the full objectives, assessment answers, rubrics, application layout, or learner progress in JSON. Track records own membership; competency records have no `tracks` field.

Start an assessment revision at `1`. Increment it when learning objectives, mandatory evidence, or required prerequisites change; retain it for editorial-only corrections. Catalog `schemaVersion` is currently `1`. Curriculum releases use `MAJOR.MINOR.PATCH`: editorial fixes are patch changes, compatible additions minor changes, and incompatible changes major changes. A structural contract change needs an explicit schema-version review. These policies are not enforced by simply checking the number format.

Review references and the whole prerequisite graph when changing dependencies. Structural validation rejects invalid shapes; semantic validation rejects duplicate IDs, missing targets, duplicate edges, self-dependencies, and cycles. Content-reference validation rejects missing or unsafe content paths, unresolved or ambiguous anchors, broken internal links, and module files that no competency references. None of these establishes educational quality, checks external resources, or grants completion.

## Validate and submit a focused contribution

Use the repository's documented Node.js 24.x and npm 11.x environment. With dependencies already installed, run from the repository root:

```sh
npm test
npm run typecheck
npm run validate:curriculum
```

For setup, see [the contract's check instructions](curriculum-contract.md#run-the-checks). `npm test` exercises the validators with synthetic inputs and also holds the acceptance expectations for the production curriculum. `npm run validate:curriculum` is the check for your actual files: it loads the manifest, every competency record, and every track, then runs structural, semantic, and content-reference validation and the Foundations prerequisite rule. It needs no network access and writes nothing.

**Expected success:** the command prints the curriculum version, the competency and track membership, and the number of Markdown files and internal links checked, and exits with status `0`. On failure it names the stage that failed and prints one line per problem, with a stable code, the location, and a corrective message, and exits with status `1`. A Node experimental-feature warning about type stripping is distinct from a validation result: rely on the printed result and the exit status.

The command was executed successfully on **2026-11-13** with Node.js **24.2.0** and the existing installed dependencies, against the three current competencies. No laboratory commands are executed by this check.

### Write links and headings the checks can resolve

Automated validation covers internal references only. External URLs are counted but never fetched; verifying them remains the manual review described under [Verify and attribute resources](#verify-and-attribute-resources).

- Link to other repository files with relative paths and forward slashes, matching letter case exactly: `[text](../modules/example.md#completion-criteria)`. Do not use absolute paths, symbolic links, or paths that leave the repository.
- Write headings in the `## Heading` form. An anchor is the heading text in lowercase with punctuation removed and each space replaced by a hyphen, so `#### 1. Establish the boundary` is `#1-establish-the-boundary`. The [contract](curriculum-contract.md#heading-anchors) gives the exact rule and its limits. It is this project's minimal rule, not a guarantee about how any particular website renders anchors.
- Give every heading that you link to, or name in metadata, text that is unique within its file. A link to a repeated heading is rejected as ambiguous; numeric suffixes such as `#cleanup-1` are not supported.
- Keep each link on one line and use inline links. Reference-style links and links wrapped across lines are not checked.
- Example links inside fenced code blocks or inline code are ignored, so they can show syntax without pointing at a real file. Close every fenced code block: an unclosed one is rejected, because the rest of the file could not be checked.
- Use plain text, asterisk emphasis, or inline code in headings you link to. The contract lists the [known limitations](curriculum-contract.md#known-limitations-of-the-markdown-reader) of the checks, including forms that are not checked at all.

### Add or change curriculum membership

Adding a competency to the production curriculum is a deliberate scope decision, not a side effect of writing a lesson. When one is approved, add its module and record, add its ID to the track at the intended position, update the track's learning-path page and the links between neighboring modules, and update the approved membership in [the production acceptance tests](../tests/production-curriculum.test.ts). A Markdown file under `docs/modules/` without a competency record is rejected as orphaned; keep drafts elsewhere until they are ready.

Before proposing a contribution, review:

- The eleven headings and objective-to-evidence coverage, including failure and recovery.
- Command safety, environment assumptions, security checks, and cleanup boundaries.
- Resource accuracy, attribution, dates, and unresolved source checks.
- JSON validity, stable references, and local Markdown links/anchors.
- The final diff for unrelated edits, personal data, and accidental generated files.

Describe the learner problem, changed behavior, affected objectives, assessment-revision impact, and validation results. Separate **documentation review**, **automated metadata/tests**, and **actual lab execution**. If an exercise was executed, record its environment, results, failures, and cleanup; otherwise state that execution is pending. Do not mark an unexecuted exercise as tested, or treat authoring completion as public-release readiness.

Keep changes small. A wording correction should not introduce a new schema, dependency, framework, or test system. Coordinate changes to stable IDs or contract meaning with downstream consumers before they are adopted.
