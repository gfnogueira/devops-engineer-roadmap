# Foundations Laboratory Evidence Template

**Status: template only. No evidence exists.** All 85 cases in the [validation matrix](foundations-validation-matrix.md) are `PLANNED`. This file defines how a later, separately authorized execution records its evidence. Nothing in it is, or may be filled in as, an invented result. See the [validation plan](foundations-lab-validation-plan.md) for oracle (`O-*`) and divergence (`D*`) definitions and the [safety and cleanup checklist](foundations-execution-safety-checklist.md) for what must hold before any record is created.

## Status vocabulary

| Status | Meaning | Allowed transition |
| --- | --- | --- |
| `PLANNED` | The case is defined and approved for a future run. Nothing has been run | Start state. The only state present in Phase 1 |
| `EXECUTED` | The commands ran and output was captured, but the verdict is not yet judged against the pass criteria | From `PLANNED` |
| `PASSED` | Executed, and every pass criterion of the case was met with evidence | From `EXECUTED` |
| `FAILED` | Executed, and at least one criterion was not met, or an unexpected status, prompt, `STOP`, or out-of-lab write occurred | From `EXECUTED` |
| `BLOCKED` | Could not run or be judged because a precondition or the environment was unavailable (for example, the process runs as root, or the Git version is below the minimum in a case that needs it) | From `PLANNED` or `EXECUTED` |
| `NOT APPLICABLE` | The case does not apply to this platform or by design, with a recorded reason | From `PLANNED` |

A `FAILED` record is never edited into `PASSED`. A retry after a fix is a new record with a new run ID that cites the failed one.

## Run header (one per run)

A run is one fresh environment executing a defined list of cases (for example `RUN-GCM-A` on one Linux container).

```text
Run ID:               <e.g. RUN-GCM-A-linux-001>
Plan pin:             repository commit d7bc4805a145d78ab5886a377e8508d417c65349 (or the later pin, if the plan changed)
Canonical module hash:<sha256 of the module file executed>
Environment class:    L1 | L2 | L3 | VM | M0 | M1 | M2
Operating system:     <name and version, from O-FP>
Architecture:         <from O-FP>
Shell:                <resolved /bin/sh implementation and version if obtainable>
Controlled variables: LC_ALL=C, TZ=<value>, no other variable recorded by value
Tool versions:        git <full string>; coreutils or BSD userland <version or OS version>
Operator:             <role only, for example "validator"; never a personal name>
Run start (UTC):      <ISO 8601>
Isolation checklist:  <reference to the completed pre-run checklist>
Deviations:           <anything done differently from the plan, with the reason>
```

## Case record (one per case)

```text
Case ID:            <for example LAS-G05>
Run ID:             <run header reference>
Status:             PLANNED | EXECUTED | PASSED | FAILED | BLOCKED | NOT APPLICABLE
Operating system:   <name and version>
Shell:              <implementation and version>
Tool versions:      <only the tools this case used>
Execution time UTC: <ISO 8601, start of the case>
Setup state:        <the preceding case or fixture used>

Command(s) exactly as executed (one entry per command; "V:" blocks copied byte for byte):
  1. <command>
     Exit code:       <integer, read immediately; "n/a" for a builtin prompt only if truly unavailable>
     Sanitized output:
       <output with the sanitization rules below applied>
  2. ...

Oracle results:     <O-CMP, O-MODE-STAT, ... each with its recorded value>
Expected result:    <copied from the matrix>
Actual result:      <what was observed, in plain words>
Verdict basis:      <the specific pass criteria met or the failure condition hit>
Pass/fail:          PASSED | FAILED | BLOCKED | NOT APPLICABLE
Notes or deviations:<unexpected observations, divergence IDs encountered (Dxx), versions of note>
Cleanup:            <which cleanup case or fixture teardown covered the artifacts, and its result>
```

Evidence kinds referenced in the matrix:

| Code | Meaning | What to capture |
| --- | --- | --- |
| T | Transcript record | Each command, its exit code, and its sanitized output |
| M | Mode observation | The first ten characters of the `ls -l` or `ls -ld` line, plus a numeric mode from O-MODE-STAT |
| C | Content observation | The synthetic file content shown by `cat`, or the result of O-CMP |
| S | State observation | A name-only directory listing or a snapshot comparison |
| R | Reviewer note | A short written statement of a decision or explanation that the module requires the learner to give, for example why a file was chosen |

## Sanitization and redaction rules

Apply these before any record is written down, shared, or stored. When unsure, redact and note the redaction.

| Replace or remove | With |
| --- | --- |
| The lab root, parent, sandbox, and home paths | `<LAB_ROOT>`, `<LAB_PARENT>`, `<SANDBOX>`, `<HOME>` (keep the lab's own relative names such as `./inbox`) |
| User name, group name, host name, domain | `<USER>`, `<GROUP>`, `<HOST>`. Numeric IDs are not recorded; record only whether the effective ID is zero |
| `id`, `ls -l` owner and group columns | Replace the names as above; keep the mode column |
| Any Git author or committer identity other than the synthetic `Lab Learner <learner@example.invalid>` | Remove and stop the run; it means the isolation failed |
| Output of `env`, `printenv`, `set`, or shell history | **Never captured.** For Git variables, record names only (O-GITENV) |
| Absolute paths printed by `git init`, `git rev-parse --show-toplevel`, and `pwd -P` | The placeholders above |
| Timestamps inside command output | Keep only if needed for a verdict, otherwise omit |
| IP addresses, network interface names, serial numbers, license or account identifiers | Remove |

What a record may contain: the synthetic marker text `SYNTHETIC-NOT-A-CREDENTIAL-` followed by the fixed module suffixes (`ALPHA`, `BETA`, `GUIDED`, `LEGACY`, `CHALLENGE-OLD`, `CHALLENGE-NEW`), because they are fake by construction and the modules print them deliberately. Any other string that resembles a token, key, or password is a stop condition: do not record it, halt, and treat it as a failure of isolation.

Not allowed in evidence: real credentials or secrets, personal paths, access tokens, the contents of any file outside the lab, the output of commands that list unrelated system information, and screenshots of a terminal that shows any of the above.

## Run summary (one per run, filled in at the end)

| Case ID | Status | Notes |
| --- | --- | --- |
| `<id>` | `PLANNED`/`EXECUTED`/`PASSED`/`FAILED`/`BLOCKED`/`NOT APPLICABLE` | `<divergences, deviations>` |

Totals: counts per status, plus a one-line statement of what was **executed** versus only **reviewed**, and the environment class. A run summary never claims a module "validated" from a partial or `M0`-only run; the claim is limited to the cases and environments actually recorded. Results from this plan are not formal C07 evidence, and C07 evidence is not reused here, unless the maintainer decides otherwise through that process.

## Storage

Records are created and kept outside this repository, in a private location the maintainer selects, because they originate from machines that hold personal information even after sanitization. Do not commit raw transcripts. A reviewed, sanitized summary can later be proposed for the repository as a separate change.
