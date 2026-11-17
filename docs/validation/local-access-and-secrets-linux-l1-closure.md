# Local Access and Secrets — Linux L1 Validation Closure Report

**Status: Linux L1 validation complete with documented limitations and one privileged-environment case outstanding.** Of the 23 planned `LAS` cases in the [validation matrix](foundations-validation-matrix.md), 20 are `PASSED`, 2 are `NOT APPLICABLE` (`LAS-G08`, `LAS-C07`, by decision OD-5), 1 is still `PLANNED` (`LAS-P01`, which needs a disposable VM and written approval), and 0 are `FAILED` or `BLOCKED`. This report consolidates the external execution evidence. It does not change the matrix, which still lists all 85 cases as `PLANNED` (planned coverage), and it does not validate the module on other platforms. Definitions of cases, oracles (`O-*`), and divergences (`D*`) are in the [validation plan](foundations-lab-validation-plan.md); controls are in the [execution safety checklist](foundations-execution-safety-checklist.md); the environment is described in [Foundations Linux L1 Environment](foundations-linux-environment.md). The structure follows the [Terminal File Operations closure report](terminal-file-operations-linux-l1-closure.md).

## Executive summary

- **Scope.** The canonical [Local Access and Secrets module](../modules/local-access-and-secrets.md) (file hash `b4ac72d923ac025c4af567d7003991118aa9346535315467f0bfcefae8a556b8`, unchanged throughout) was exercised block by block in disposable Linux containers, through a real pseudo-terminal, with `dash` as the laboratory shell, as an ordinary user.
- **Result.** 20 of 23 cases passed with recorded evidence. `LAS-G08` and `LAS-C07` are `NOT APPLICABLE` under OD-5 and were not executed. `LAS-P01` is outstanding.
- **What this establishes.** For this image, on this architecture, as a non-root user on a tmpfs, the module's documented commands behaved as the module and the matrix state; a denied read, its diagnosis, its minimal recovery, interruption and resume, the report and its marker check, and the cleanup each produced the recorded result.
- **What it does not establish.** Nothing here covers root behavior, macOS, other Linux environments, a learner's own challenge solution, the unexercised repair and challenge-resume paths, the `RUN-LAS-B` cleanup path, or secure erasure. See [Known limitations](#known-limitations) and [Unresolved discrepancies](#unresolved-discrepancies).
- **Not formal evidence.** Nothing here is evidence of the separate formal C07 process, and no result of that process was reused.

## Scope

In scope: the 23 `LAS` cases of the matrix, run for Linux class L1 only. Out of scope: the other two modules, macOS (classes M0 to M2), Linux L2 and L3, ACLs, SELinux or organization policy, the PT-BR translation, and the knowledge questions and self-assessment tables (gap G-5). The matrix, the module, the translations, the localization overlays, the formal C07 materials, the Skill Tree and the TFO closure report were not modified by this work.

## Environment

All runs used one image (the same as the TFO validation). Values come from the environment records and each run header.

| Item | Value |
| --- | --- |
| Image tag | `foundations-lab-l1:ubuntu24.04-git2.43` |
| Image ID | `sha256:922a342b0606fe9a4036e7062ee97e39c79597814a0f91addab3abd9e02e1d38` (equal in every run) |
| Base | `ubuntu@sha256:fe81560990fae86dc4743202b2cb4d3df98d0bcf949173cecef15ce1127ef852` (Ubuntu 24.04.5 LTS, arm64), pinned by digest |
| Definition | [`environment/linux-l1.Dockerfile`](environment/linux-l1.Dockerfile) |
| Architecture and runtime | aarch64; Linux `7.0.14-linuxkit` in a Docker Desktop VM; Engine 29.9.1 |
| Laboratory shell | `dash` 0.5.12 (`/bin/sh`), started with `env ENV= HISTFILE= /bin/sh` |
| Tool versions | GNU coreutils 9.4 (`ls`, `cat`, `chmod`, `rm`, `rmdir`, `stat`), GNU diffutils (`cmp`), GNU grep 3.11 |
| Controlled variables | `LC_ALL=C`, `TZ=UTC`, `HOME=/home/ubuntu` |
| Identity | uid and gid `1000` (not root) in every case; effective ID checked nonzero |

Isolation properties of every container (checked with `docker inspect` and from inside): `--network none`; `Privileged=false`; `--cap-drop ALL` (effective capabilities `0`); `no-new-privileges`; default seccomp filter; read-only root filesystem; one writable tmpfs at the home directory with `nosuid,nodev,noexec`, 64 MiB, mode `0700`; no mounts and no container socket; 256 MiB without swap, 1 CPU, 64 processes; started by image ID with `--pull=never`. The container's main process is `sleep 3600`, so ending a lab shell does not stop the container.

## Execution summary

Nine batches ran between the pilot and the final control, each in its own container, removed by name at the end. Each batch reconstructed the state it needed from verified blocks; reconstructions are recorded separately and are **not** counted as validation of the cases that produce that state.

| Batch | Run record | Cases counted |
| --- | --- | --- |
| Pilot | `RUN-LAS-PILOT-linux-001` | G09, G01 |
| A1 | `RUN-LAS-A1-linux-001` | G02, G03 |
| A2 | `RUN-LAS-A2-linux-001` | G04, G05, G06 |
| A3 | `RUN-LAS-A3-linux-001` | G07, C01 |
| A4 | `RUN-LAS-A4-linux-001` | C02, C03 |
| A5 | `RUN-LAS-A5-linux-001` | C04, C05 |
| A6 | `RUN-LAS-A6-linux-001` | C06, G11, G12, G13 |
| A7 | `RUN-LAS-A7-linux-001` | P03, P02 |
| B1 | `RUN-LAS-B1-linux-001` | G10 |

Totals: 23 cases = 20 `PASSED` + 2 `NOT APPLICABLE` + 1 `PLANNED` + 0 `FAILED` + 0 `BLOCKED`. By class: 4 SAFE (all passed), 8 CONTROLLED (7 passed, 1 not applicable), 11 HIGH-RISK (9 passed, 1 not applicable, 1 planned). The matrix classes equal the external index classes for every executed case.

Command provenance, which matters for how far each result generalizes:

| Provenance | Cases |
| --- | --- |
| Canonical module blocks (run verbatim) | G01, G02, G03, G04, G05, G06, G07, G09, C01, G11, G12, G13; G10 (canonical recovery block and the restoration block with only the placeholder path replaced, as the module instructs) |
| Reference-derived (plan solutions R-LAS-1 to R-LAS-4, not canonical) | C02, C03, C04, C05 |
| Prose-derived (the module names targets but has no code block) | C06 |
| Test-derived (fixtures and commands written for the control) | P02, P03 (and the classifier and verification blocks used around G10) |

## Case-by-case results

`Evidence` names the run record in the external evidence store (see [Evidence references](#evidence-references)). Every case with status `PASSED` has a case record with that status in the cited run report.

| Case | Class | Result | Acceptance criterion (matrix, abbreviated) | Evidence | Qualification |
| --- | --- | --- | --- | --- | --- |
| LAS-G01 | SAFE | PASSED | `id -u` nonzero | PILOT | Names and numeric IDs not recorded; says nothing about root behavior |
| LAS-G02 | CONTROLLED | PASSED | stat mode `700`, parent gained exactly one entry, no `STOP` | A1 | First attempt aborted by an operator error before any canonical command ran (see [Deviations](#deviations-and-lessons-learned)) |
| LAS-G03 | CONTROLLED | PASSED | modes `700`, `700`, `600`; three exact lines; read status `0`; `> /dev/null` accepted under `noclobber` | A1 | — |
| LAS-G04 | HIGH-RISK | PASSED | mode `400` after `chmod` and after `umask 077`; read `0` | A2 | Prerequisite state reconstructed |
| LAS-G05 | HIGH-RISK | PASSED | baseline read earlier on the same path, mode `000`, nonzero status, diagnostic classified permission denied | A2 | Status `1`, `Permission denied`; the control `LAS-P02` was not yet run (it was run later in A7) |
| LAS-G06 | HIGH-RISK | PASSED | mode `400` after `chmod u+r`, read `0`, content unchanged | A2 | — |
| LAS-G07 | CONTROLLED | PASSED | report mode `600`, three exact lines, marker count `0`, status `1` | A3 | State reconstructed; controls `P02`/`P03` not yet run at that time |
| LAS-G08 | CONTROLLED | NOT APPLICABLE | (if executed) exact content and marker check | none | OD-5; see [Conditional applicability decisions](#conditional-applicability-decisions) |
| LAS-G09 | SAFE | PASSED | `STOP` printed, root unset, sandbox unchanged | PILOT | Only the refusal branch of the restoration block (the success branch is exercised in G10) |
| LAS-G10 | HIGH-RISK | PASSED | mode `000` before and `400` after, read `0`, denial evidence still attributed to G05, no other object changed | B1 | State reconstructed; interruption by an external `SIGKILL` of the verified lab shell; cleanup path of this variant not validated |
| LAS-G11 | SAFE | PASSED | no `STOP`, recognizable entries | A6 | Run after C06 per the matrix, by maintainer decision on an ordering conflict |
| LAS-G12 | HIGH-RISK | PASSED | named removals with matched `rm -i` prompts, then `rmdir` | A6 | State reconstructed; `status.txt` present; no recursion |
| LAS-G13 | HIGH-RISK | PASSED | final helper removes the empty lab, shell ends, absence confirmed | A6 | Success branch only; refusal branches of this helper not exercised |
| LAS-C01 | CONTROLLED | PASSED | supplied-input block gives the specified directories, files, modes and text | A3 | No challenge item attempted |
| LAS-C02 | HIGH-RISK | PASSED | challenge modes as planned, draft fields classified | A4 | Reference-derived R-LAS-1; classification is an assisted review |
| LAS-C03 | HIGH-RISK | PASSED | baseline read, fault, denial, restoration to `400` | A4 | Reference-derived R-LAS-2; one fault choice (`u-r` from `400`) |
| LAS-C04 | CONTROLLED | PASSED | response equals the reference three lines; no token, internal note, user name or path | A5 | Reference-derived R-LAS-3; explanation criteria reviewed by the AI operator, not independently |
| LAS-C05 | SAFE | PASSED | modes as planned, inputs unchanged, marker count `0`, status `1` | A5 | Reference-derived R-LAS-4; explanatory part not machine-verifiable |
| LAS-C06 | HIGH-RISK | PASSED | named removals only, challenge directory gone, guided lab intact | A6 | Prose-derived commands; each removal gated and snapshot-checked |
| LAS-C07 | HIGH-RISK | NOT APPLICABLE | (if executed) mode `400`, read `0`, no other object changed | none | OD-5; see [Conditional applicability decisions](#conditional-applicability-decisions) |
| LAS-P01 | HIGH-RISK | PLANNED | root read succeeds despite `000`, recorded as the environment-limited outcome, not as denial | none | Needs a disposable VM and written approval; see [Outstanding P01 dependency](#outstanding-p01-dependency) |
| LAS-P02 | CONTROLLED | PASSED | missing-path diagnostic differs from the permission diagnostic | A7 | Test-derived fixture; wording is GNU coreutils 9.4 under `LC_ALL=C` |
| LAS-P03 | CONTROLLED | PASSED | `grep -F -c` status `0` on a match and `2` on a real error | A7 | Test-derived fixture; status `1` (no match) is an extension beyond the matrix row |

## Evidence references

The raw evidence is private and kept outside this repository, in `.project-evidence/foundations-lab-validation/` at the workspace root. It is not copied here. `EXECUTION-INDEX.md` in that directory maps each case to its run record. Each batch directory holds the run report, a sanitized transcript, the environment fingerprint, the isolation record (`docker inspect`), the extracted blocks with their provenance suffix (`canonical`, `reference-derived`, `prose-derived`, `test-derived`), host-side snapshots, `integrity.sh` and its before and after outputs. Checked for this report: every batch directory contains these records, and every `integrity-before.txt` equals its `integrity-after.txt`.

| Batch directory | Run record | Cases |
| --- | --- | --- |
| `phase-3.1-las-pilot-g09-g01/` | `RUN-LAS-PILOT-linux-001` | G09, G01 |
| `phase-3.2-las-guided-g02-g07/` | `RUN-LAS-A1-linux-001` | G02, G03 |
| `phase-3.3-las-g04-g06/` | `RUN-LAS-A2-linux-001` | G04, G05, G06 |
| `phase-3.4-las-g07-c01/` | `RUN-LAS-A3-linux-001` | G07, C01 |
| `phase-3.5-las-c02-c03/` | `RUN-LAS-A4-linux-001` | C02, C03 |
| `phase-3.6-las-c04-c05/` | `RUN-LAS-A5-linux-001` | C04, C05 |
| `phase-3.7-las-cleanup-c06-g11-g13/` | `RUN-LAS-A6-linux-001` | C06, G11, G12, G13 (also the cleanup driver and its gate) |
| `phase-3.8-las-p02-p03/` | `RUN-LAS-A7-linux-001` | P03, P02 |
| `phase-3.9-las-g10-interruption/` | `RUN-LAS-B1-linux-001` | G10 (also process-identity and SIGKILL records) |

`LAS-G08` and `LAS-C07` have no run record because they were not executed; their `NOT APPLICABLE` rationale is recorded in the index. `LAS-P01` has no record because it was not executed.

## Verified behaviors

### Observations supported by evidence

- **Workspace and setup.** The canonical setup block creates the lab root with `umask 077` and `set -C`; mode `700`; the synthetic configuration is created `600` with three exact lines and the initial read returns `0` (G02, G03).
- **Read-only policy.** `chmod 400` gives `-r--------`; re-applying `umask 077` does not change an existing file's mode; the read still returns `0` (G04).
- **Controlled denial.** After `chmod u-r` the mode is `000`, a read by the same non-root user fails with `cat: ./private/service.conf: Permission denied` and status `1`; the baseline read of the same path had succeeded (G05). The missing-path error differs in text and state from the permission error, though both return status `1`; the classifier built for the control separates them (P02).
- **Minimal recovery.** `chmod u+r` restores `400` and a successful read; content is unchanged, and no other object changes (G06, G10, C03).
- **Report and marker check.** The report is created `600` with exactly the three allowed facts; the literal marker count is `0` with status `1` (G07, C05). `grep` returns `0` on a match, `1` on no match and `2` on a real error, with stdout and stderr captured separately (P03).
- **Interruption and resume.** After an external `SIGKILL` of the lab shell (the target verified as the only lab `dash`, parent bash, container main process unaffected), the container and outer shell survived, the file stayed at `000`, a new `env ENV= HISTFILE= /bin/sh` shell started with no lab variable, the canonical restoration block found the recorded root, the read was still `DENIED`, and `chmod u+r` restored `400` with a read of `0` and unchanged content (G10).
- **Restoration guard.** The restoration block refuses its unusable placeholder (`STOP`) and leaves the sandbox unchanged (G09).
- **Cleanup.** Challenge and guided artifacts were removed only by named `rm -i` and `rmdir` commands, each after a gate; prompts matched the intended targets, including the write-protected prompt for the `400` file; snapshot diffs showed exactly the expected removals; the final helper removed the empty lab directory and ended the lab shell, confirmed from the outer shell and the host (C06, G11, G12, G13).
- **Containment.** In every run the sentinel and the parent directory were unchanged, no path outside the container's tmpfs was touched, and the Roadmap repository was unchanged.

### Interpretations (not directly observed)

- That the module's wording matches learner experience on a personal computer is an interpretation: the runs used a minimal container, not a desktop system.
- "Denial attributable to the intended fault" rests on the diagnostic text, the same-path baseline read, the mode change and the P02 control; it is not an independent proof of the kernel's decision.
- A `PASSED` case means its documented criteria were met in this environment. It is not a statement about learning outcomes; the knowledge questions and the self-assessment tables are not machine-executable (gap G-5).
- The disclosure reasoning in C04 and C05 (why a draft or a world-read grant is rejected) was written by the AI operator applying the module's text. It is an assisted review, not an independent human review, and no learner's explanation was produced or assessed.

## Validated learning outcomes

Traceability is the plan's completion-criteria table. "Validated" here means the mechanical, observable part of the criterion was met on Linux L1; the explanatory parts need a learner or a human reviewer.

| Outcome | Cases feeding it | What is validated | What is not |
| --- | --- | --- | --- |
| O1 — Interpret | G01, G03, C02 | Ordinary identity, owner and modes observed with `stat`; modes of files and directories as stated | A learner's explanation of read, write, execute and search classes |
| O2 — Restrict | G02, G03, G04, C02 | `700`/`600`/`400` modes configured and verified; `umask` does not repair an existing file | The explanation of why |
| O3 — Diagnose | G05, G06, G10, C03, P02 | A same-path baseline read, an actual denied read with diagnostic and status, a minimal restoration, interruption and resume at the `000` state, and a missing-versus-denied control | Root behavior (P01); the challenge-file resume row (C07); any other fault choice (`200`) |
| O4 — Separate | G07, C04, C05, P03 | Report content equals the allowed facts; marker count `0`, status `1`; `grep` statuses `0`/`1`/`2` | The repair path (G08); semantic completeness (the marker check proves one literal absent, nothing more); the learner's justification |
| O5 — Clean up | G11, G12, G13, C06 | Only lab-owned artifacts removed by named commands; workspace verified gone | Secure erasure, backups, terminal recordings (the module itself says removal proves none of them); the failure branches of the helper |

## Known limitations

1. **No macOS validation.** No `LAS` case ran on macOS (classes M0 to M2). BSD userland, macOS `chmod` and `stat` behavior and root differences are untested (gap G-3, G-6, G-10).
2. **No Linux L2 or L3 validation.** Only L1 (Ubuntu 24.04, `dash`, GNU coreutils 9.4, GNU grep 3.11, aarch64) was used.
3. **Linux L1 scope is a non-root user on a tmpfs.** Results are for a container, as uid `1000`, with capabilities dropped. Filesystem and ACL behavior on a typical desktop disk, SELinux or organization policy are not covered (gap G-4).
4. **Root behavior is unvalidated** (see [Outstanding P01 dependency](#outstanding-p01-dependency)). O3's enforcement criterion is supported only for an ordinary user.
5. **Reference-derived challenge solutions.** C02 to C05 used the plan's reference solutions and C06 used prose-derived commands. They show the module's acceptance criteria are satisfiable and checkable, not that a learner's own solution would pass (gap G-9).
6. **Human-review criteria were not independently assessed.** The explanations required by challenge items 3 and 4, and the questions Q1 to Q8, are not machine-executable. The assisted review in C04 was done by the AI operator; the maintainer should confirm or overrule it.
7. **Unexercised failure and recovery branches.** Not run: the repair path of step 5 (G08), the challenge-file resume row (C07), the other rows of the resume state table (gap G-1; only the `000` guided-fault row was exercised), the `200` fault choice (A-LAS-1), an answer of `n` to a removal prompt, the failure branches of the cleanup verifier and the final helper (a refused `rmdir`, a failing `cd ..`, a failing absence test), and the module's recovery guidance after a refused cleanup.
8. **Shell and tool-version specificity.** Diagnostic wording (`Permission denied`, `No such file or directory`, the `rm -i` prompt including `write-protected`) and exit statuses are those of coreutils 9.4 and grep 3.11 under `dash` and `LC_ALL=C`. Other versions and non-English locales can differ (D06, gap G-8); the classifier in P02 depends on the English wording.
9. **Reconstructed prerequisites are not independent validation.** Every batch after the pilot rebuilt the needed state in a new container. Those rebuilds do not count as results for the cases that originally produce that state, and no batch ran the whole sequence G01 to G13 in one container.
10. **No claim of secure data erasure.** Deleting files on a tmpfs says nothing about backups, terminal recordings, scrollback, copies or revoking an exposed credential; the module states this limit and the cleanup evidence does not extend it.
11. **Single-run, fixture-based evidence.** Each case has one recorded passing run. `P02` and `P03` use validator-built fixtures that realize the matrix wording; there is no canonical fixture script.
12. **PT-BR translation remains draft.** The `pt-BR` overlay for this module has status `draft` and is marked as an AI-generated draft without a human translator. Its prose and checkpoints were not executed and no Portuguese text was validated.
13. **The module banner is stale.** The module still says the laboratory and challenge "have not been executed". Updating it is a separate authorized change (A-X-1) and was not made.

## Unresolved discrepancies

None of these was resolved silently, and none changed a recorded verdict.

### D-1. `RUN-LAS-B` cleanup was not validated

- The matrix defines `RUN-LAS-B` as `G01 → G05, G10, G11 → G13`. The module creates `./reports/status.txt` only in step 5 (matrix case `G07`), after the recovered read. `RUN-LAS-B` as defined never runs that step.
- The canonical cleanup (`rm -i ./reports/status.txt`, then `rm -i ./private/service.conf`, then `rmdir ./reports ./private`) assumes that report exists. In a `RUN-LAS-B` state, the first removal targets a path that was never created; its outcome in that state was **not observed** (the expected refusal, `No such file or directory`, is a prediction and not a result).
- `G10` passed on its own matrix criteria, which do not include cleanup. `G11` to `G13` passed in `RUN-LAS-A`, where the report exists. The batch for `G10` deliberately stopped before cleanup, created no substitute report, and did not alter the canonical cleanup commands. No case was counted for this.
- The lab was destroyed with the container; **the `RUN-LAS-B` cleanup path is unvalidated**, and no claim is made that the complete `RUN-LAS-B` sequence was exercised.
- **Proposed correction (for a separate authorized change, not made here).** Option A (smallest, leaves canonical commands untouched): in the matrix, define `RUN-LAS-B` as `G01 → G05, G10, G07, G11 → G13`, and let `G07` run "after G06 or G10". Option B: keep the sequence and add an explicit matrix note that `G12`'s first removal is expected to be refused in this variant, recorded as a deviation, with a separate run to validate it. Option C (editorial, in the module): add a row to the resume state table for "recovered, no report yet" that continues at step 5 and says the report removal applies only if the report exists. Option A is the maintainer-approved **preferred editorial proposal**, because the module's own flow after the recovered read is step 5. It is a proposal only: it has not been applied to the matrix, and the sequence it describes (`G07` run in a state recovered by `G10`, followed by `G11` to `G13`) has **never been executed**, so it is not validated.

### D-2. Ordering conflict for the cleanup verifier (open documentation issue)

The module (and checklist section 6) puts the verification helper first, then challenge cleanup (C06, which "starts at the verified lab root"), then the removals. The matrix puts `G11` "after C06 (A) or G10 (B)". The maintainer decided to run the canonical verifier block twice, unchanged: once before C06 as its prerequisite (not counted as `G11`) and once after C06 (counted as `G11`). The sources themselves remain inconsistent; the maintainer's decision was an operational choice for this validation, not an editorial resolution, and the issue stays **open**.

### D-3. Stale "control not run" annotations

The index and the run reports for `G05`, `G07`, `C03`, `C04` and `C05` say the controls `P02` or `P03` were not run, which was true when written. They were run later (A7) and passed. The earlier verdicts were not re-derived from the controls and were not edited; the annotations are historical. A future index pass should add a note that the controls now exist, without changing those verdicts.

### D-4. Open module ambiguities carried from the plan

| ID | Ambiguity | How the validation handled it |
| --- | --- | --- |
| A-LAS-1 | Challenge item 2 says to change "only that file's owner read bit", but the resume table says the fault may leave `000` or `200` | The reference used `u-r` from `400`; the `200` case was not exercised |
| A-LAS-2 | Challenge item 3 does not fix the response lines | The guided report's three lines were the reference; other wording would need a content review |
| A-LAS-3 | Numeric modes are checked, but the module teaches only letter listings | `stat -c %a` was used as the oracle (outside the taught toolset) |
| A-LAS-4 | The module says to stop at effective ID `0`, but default container images run as root | A non-root image was supplied; the module gives a learner no guidance on getting one |
| G-1 | Only one interruption point per module was simulated | `G10` only |

### D-5. Wording of the conditional rule

OD-5 states that the conditional cases "stay `NOT APPLICABLE` by design if executed at all" and that no conditional failure is injected "in this round". The scope of "this round" is not defined in the plan. The decisions below treat it as the current Linux L1 scope and leave them reversible.

## Conditional applicability decisions

`NOT APPLICABLE` is not `PASSED`. The two cases below were not executed, their paths remain unvalidated, and the decision is reversible if the maintainer later approves a lab-owned fault.

| Case | Source rule | Evidence that the path was not reached | Decision |
| --- | --- | --- | --- |
| LAS-G08 | Matrix: `Default disposition NOT APPLICABLE by design. If executed: PASS on exact content and marker check`; needs a deliberately disclosing synthetic report; plan: conditional cases not approved for lab-owned fault injection are recorded `NOT APPLICABLE` with the reason; OD-5 names it | No disclosing report was created; the marker check in `G07` and `C05` returned count `0`, status `1`, so the repair path was never needed | `NOT APPLICABLE` under OD-5; the repair guidance (`rm -i ./reports/status.txt` and recreate) is unvalidated |
| LAS-C07 | Matrix: `Conditional on a deliberate interruption (OD-5)`; OD-5 names it; OD-3 limits LAS to one interruption (`G10`) and leaves the other resume rows as gap G-1 | The challenge fault of `C03` was restored in the same shell and no interruption left the challenge file at `000` or `200` | `NOT APPLICABLE` under OD-5; the challenge-file resume row is unvalidated |

Both decisions were applied by maintainer instruction in the closure-preparation task, confirmed by the maintainer's approval at the final quality review (2026-11-17), and recorded only in the external index. No fault injection was performed. The precedent is `TFO-G09`, recorded the same way.

## Outstanding P01 dependency

`LAS-P01` stays `PLANNED`. The source does not support another status.

- **Matrix row.** Claim: root bypasses the mode (the environment-limited branch of O3). Fixture: a disposable Linux VM or a rootless user-namespace container, with **explicit maintainer approval**, never the Docker default root with `--cap-drop=ALL` (D07). Commands: the same sequence as `G03` to `G05`, as uid `0`. Expected: the read succeeds despite mode `000`, which is the "expected enforcement not demonstrated" row; O3 stays `unverified`. PASS: the success is recorded as the canonical environment-limited outcome and **not** as a denial. FAIL: recorded as passing O3.
- **OD-4.** `LAS-P01` is deferred to a disposable VM and is not part of the container runs.
- **Why the Linux L1 container cannot satisfy it.** Every L1 container runs as uid `1000` with all capabilities dropped. The case needs uid `0` that actually bypasses file modes; a root with `--cap-drop=ALL` loses that bypass and would be denied, producing an inverted result (D07). Running the L1 image as root would also break the module's own stop condition (effective ID `0`) and would not represent a default-capability root.
- **Required environment.** A disposable Linux VM (or a rootless user-namespace container) in which uid `0` retains the permission-bypass capability, no host mounts, no shared credentials, no network need, and snapshot or destroy-on-exit teardown.
- **Required authorization.** Explicit written maintainer approval for a privileged-identity, HIGH-RISK run, with the same per-block approval as the other HIGH-RISK cases (OD-2).
- **What remains unvalidated.** That the module's environment-limited branch, "the read succeeds despite the expected restrictive mode, so enforcement was not demonstrated, record it and do not claim a denial", behaves as documented for root; and that the case is recorded as the environment-limited outcome rather than as a denial. O3 is therefore validated only for an ordinary user.

## Deviations and lessons learned

These are operational deviations from the plan's ideal; none changed a verdict or was hidden.

- **Operator error in the first G02 attempt.** The extracted block file included the markdown fence lines, so `dash` read the backticks as a command substitution and an inner `sh` absorbed some read-only commands. No canonical command ran; the container was removed, the extraction was corrected, and a guard now rejects any block containing a backtick. Only the second attempt is recorded.
- **Outer shell history.** The pilot's outer `bash` wrote a history file on exit (seven outer-shell commands, no output). From A1 on, the outer shell runs with history disabled and no history file was found in any later container.
- **Integrity script and locale.** The pilot's "after" integrity record first differed because the script ran under a different locale; it was fixed by running the byte-identical script under `LC_ALL=C` in every later batch. Hash values for formulas introduced in the pilot are comparable from that batch on, not with the earlier TFO runs.
- **Cleanup driver incident.** In the cleanup batch the gate's identity regex matched the echoed command line, so the driver aborted before any removal; the snapshot confirmed nothing changed, the regex was fixed, and the batch restarted.
- **Stray shell in the interruption batch.** A first terminal relay in the `G10` batch wrote nothing and was restarted, leaving one idle `bash` in the container; it received only read-only commands and was destroyed with the container.
- **Extra read-only commands.** Gate commands (`stat`, `cmp`, `test`, listings) were typed around the canonical blocks in every batch and are listed in each record. They changed nothing.
- **Terminal echo noise.** The history-disabling line shows `UNNSET` in the echoed command in several transcripts; the output `HISTFILE=[UNSET]` is authoritative.
- **Reconstruction versus validation.** Reconstructed states are labelled "not a validation" in each record and annotated in the index.
- **Safety-gate software.** The destructive-operation gate used in the cleanup batch is validator-written software, not a module artifact.

## Safety controls

| Control | How it was applied |
| --- | --- |
| Disposable containers | One new container per batch, created from the pinned image and removed by name; no image was removed, no `docker system prune` was used, and Docker resource counts were recorded before and after |
| No network, no host mounts | `--network none`; `Mounts=0`; no socket; no workspace directory inside any container |
| Non-root execution | uid and gid `1000`; effective ID checked nonzero before each batch |
| Read-only root and tmpfs | `--read-only`; one writable `noexec` tmpfs holds the lab and the sentinel; destroyed with the container |
| Capabilities and privileges | `--cap-drop ALL`, `no-new-privileges`, default seccomp, resource limits |
| Sentinel | A synthetic sentinel file next to the lab, created from outside the lab shell and never under a removal target; its hash was compared after each step and was identical in every batch |
| O-SNAP | Host-side name, mode and hash snapshots before and after each step of the destructive cases; mode-000 files print `UNREADABLE` |
| Target verification | Before each `chmod` (G04 to G06, C03, P02) read-only pre-gates on the exact target (regular file, not a symlink, expected mode, working directory equal to the recorded lab root, effective ID nonzero); before each deletion the ten-point gate of the cleanup batch (exact target, type, mode, no symlink, inside the lab, not a mount point, sentinel outside the target) |
| Signal control | The only signal was one `SIGKILL` to a verified PID after a ten-point gate; no `killall`, `pkill` or name matching |
| Deletion | `rm -i` prompts were read against the intended target before answering `y`; no `-f`, `-r`, wildcard or `find -delete` form was used inside any lab (the only forced removal was `docker rm -f` of the batch's own container, from the host) |
| Real pseudo-terminal | A terminal relay typed one block at a time; no replay script drove any case |
| Repository integrity | Hashes of the modules, PT-BR translations, overlays, matrix, formal C07 materials and Skill Tree, plus `git status`, compared before and after each batch; always identical within a batch |

## Recommendations

In priority order:

1. **Maintainer review of this report**, including the two `NOT APPLICABLE` decisions and the unresolved discrepancies; then decide whether and how observed results are promoted into the version-controlled matrix (a separate authorized change, per OD-6).
2. **Fix the `RUN-LAS-B` definition** (discrepancy D-1; option A is the approved preferred proposal) in a separate authorized change and, if wanted, run the corrected sequence once to validate the cleanup in that variant. Running it is a new case-run decision that has not been made.
3. **Resolve the ordering conflict D-2** editorially (it remains open), so the module, checklist and matrix agree on where the verifier belongs.
4. **Decide on `LAS-P01`:** approve a disposable VM and the privileged run, or leave it outstanding and say so wherever LAS is cited.
5. **Annotate the stale index notes (D-3)** after review, without changing verdicts.
6. **Human review.** A reviewer should confirm or overrule the assisted disclosure review in C04, and a bilingual reviewer should check the PT-BR overlay, which is `draft`.
7. **Update the module's "not executed" banner and the learning-path wording (A-X-1)** in a separate authorized change that also refreshes the translation.
8. **Consider** a second challenge solution (G-9), the `200` fault choice (A-LAS-1), and macOS validation (M1 or M2, per OD-1, HIGH-RISK cases only in a dedicated account or VM).
9. **Do not extend the claim.** Cite this validation as "Linux L1, ordinary user, tmpfs, one image" until the items above are resolved.

## Final closure statement

**Linux L1 validation complete with documented limitations and one privileged-environment case outstanding.** On the pinned Linux L1 image, 20 of 23 `LAS` cases passed with recorded evidence, `LAS-G08` and `LAS-C07` are `NOT APPLICABLE` by the recorded OD-5 decision, and `LAS-P01` remains `PLANNED` pending a disposable VM and written approval. None failed or was blocked, the sentinel and the Roadmap repository were never changed by any run, and every run's container was removed.

This does not make the Local Access and Secrets module universally validated. It does not cover root, macOS, other Linux environments, the repair and challenge-resume paths, the `RUN-LAS-B` cleanup path, a learner's own challenge solution, the explanatory criteria, the PT-BR translation or secure erasure. The version-controlled matrix remains the plan of record (`PLANNED`); this report is a summary, not that promotion.
