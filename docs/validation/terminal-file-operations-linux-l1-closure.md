# Terminal File Operations — Linux L1 Validation Closure Report

**Status: Linux L1 validation complete with documented limitations.** All 25 planned `TFO` cases of the [validation matrix](foundations-validation-matrix.md) are resolved for Linux class L1: 24 `PASSED`, 1 `NOT APPLICABLE`, 0 `FAILED`, 0 `BLOCKED`. This report consolidates the external execution evidence. It does not change the matrix, which still lists all 85 cases as `PLANNED` (planned coverage), and it does not validate the module on other platforms. Definitions of cases, oracles (`O-*`), and divergences (`D*`) are in the [validation plan](foundations-lab-validation-plan.md); controls are in the [execution safety checklist](foundations-execution-safety-checklist.md); the environment is described in [Foundations Linux L1 Environment](foundations-linux-environment.md).

## Executive summary

- **Scope.** The canonical [Terminal File Operations module](../modules/terminal-file-operations.md) (file hash `bda3b7ca60692ecaa54d0a9167221e515b84baeb891621e4541a409c23cfc965`, unchanged throughout) was exercised block by block in disposable Linux containers, through a real pseudo-terminal, with `dash` as the laboratory shell.
- **Result.** 24 of 25 cases passed with recorded evidence. `TFO-G09` is `NOT APPLICABLE` by decision OD-5 (no deliberate fault injection) and was not executed.
- **What this establishes.** For this image, on this architecture, the module's documented commands behaved as the module and the matrix state, and the safety claims tested by the probes held.
- **What it does not establish.** The applicable case coverage is complete; broader platform and behavioral coverage is not. There was no macOS run, no other Linux class, no integrated `C07` → `G12` → `G13` sequence, and only part of the resume-state table was exercised. See [Known limitations](#known-limitations).
- **Not formal evidence.** Nothing here is evidence of the separate formal C07 process, and no C07 result was reused.

## Environment

All runs used one image. Values below come from the environment and run records (`ENV-L1-linux-002` and each run header).

| Item | Value |
| --- | --- |
| Image tag | `foundations-lab-l1:ubuntu24.04-git2.43` |
| Image ID | `sha256:922a342b0606fe9a4036e7062ee97e39c79597814a0f91addab3abd9e02e1d38` |
| Base | `ubuntu@sha256:fe81560990fae86dc4743202b2cb4d3df98d0bcf949173cecef15ce1127ef852` (Ubuntu 24.04.5 LTS, arm64), pinned by digest; provenance reviewed, no signature verification |
| Definition | [`environment/linux-l1.Dockerfile`](environment/linux-l1.Dockerfile) |
| Architecture and runtime | aarch64; Linux `7.0.14-linuxkit` in a Docker Desktop VM; Docker Desktop 4.96.0, Engine 29.9.1 |
| Laboratory shell | `dash` 0.5.12 (`/bin/sh`), started with `env ENV= HISTFILE= /bin/sh` |
| Tool versions | GNU coreutils 9.4 (`ls`, `cat`, `cp`, `mv`, `rm`, `rmdir`, `stat`), GNU diffutils 3.10 (`cmp`), GNU grep 3.11, GNU findutils 4.9.0; Git 2.43.0 is present but not used by `TFO` cases |
| Controlled variables | `LC_ALL=C`, `TZ=UTC`, `HOME=/home/ubuntu` |

Isolation properties of every container (checked with `docker inspect` and from inside): `--network none`; user `1000:1000` (not root); `Privileged=false`; `--cap-drop ALL`; `no-new-privileges`; default seccomp filter; read-only root filesystem; one writable tmpfs at the home directory with `nosuid,nodev,noexec`, size 64 MiB, mode `0700`; no bind mounts or volumes (`Mounts=0`); no container socket; 256 MiB memory without swap, 1 CPU, 64 processes; image started by ID with `--pull=never`. `noexec` was kept for every run and caused no incompatibility, because the lab only runs programs from the read-only root.

## Execution coverage

Classification is from the matrix and equals the external index for all 25 cases. `Evidence batch` names the run record in the external evidence store (see [Evidence references](#evidence-references)).

| Case | Class | Result | Evidence batch | Qualification |
| --- | --- | --- | --- | --- |
| TFO-G01 | SAFE | PASSED | RUN-TFO-PILOT-linux-001 | Result taken from its own report; not re-run later |
| TFO-G02 | SAFE | PASSED | RUN-TFO-PILOT-linux-001 | Exit status of the `env … /bin/sh` command itself not separately observable |
| TFO-G03 | CONTROLLED | PASSED | RUN-TFO-CTRL-linux-001 | — |
| TFO-G04 | CONTROLLED | PASSED | RUN-TFO-CTRL-linux-001 | — |
| TFO-G05 | CONTROLLED | PASSED | RUN-TFO-CTRL-linux-001 | — |
| TFO-G06 | SAFE | PASSED | RUN-TFO-CTRL-linux-002 | Run on a reconstructed post-G05 state |
| TFO-G07 | SAFE | PASSED | RUN-TFO-CTRL-linux-002 | Run on a reconstructed post-G05 state |
| TFO-G08 | CONTROLLED | PASSED | RUN-TFO-CTRL-linux-002 | Refusal status `2` under dash (D01); attribution to `noclobber` is supported by `TFO-P04` |
| TFO-G09 | CONTROLLED | NOT APPLICABLE | none (not executed) | Decision OD-5: no fault injection; the case needs a lab-owned fault |
| TFO-G10 | SAFE | PASSED | RUN-TFO-PILOT-linux-001 | Exit status of the block as a whole not captured; assertions unaffected |
| TFO-G11 | CONTROLLED | PASSED | RUN-TFO-G11-linux-001 | Post-G05 state reconstructed; interruption was an external `SIGKILL` of the lab shell; two of the five resume-table rows exercised |
| TFO-G12 | SAFE | PASSED | RUN-TFO-G12-P01-linux-001 | Run on a state reconstructed without a challenge directory, as a stand-in for "after C07" |
| TFO-G13 | HIGH-RISK | PASSED | RUN-TFO-G13-G14-linux-001 | Post-C07 state reconstructed; not preceded by a real C07 or G12 in the same container |
| TFO-G14 | HIGH-RISK | PASSED | RUN-TFO-G13-G14-linux-001 | Helper success branch only; shell termination verified from a separate `docker exec` session |
| TFO-C01 | CONTROLLED | PASSED | RUN-TFO-CHAL-linux-001 | Plan-derived reference solution (the challenge has no canonical recipe) |
| TFO-C02 | CONTROLLED | PASSED | RUN-TFO-CHAL-linux-001 | As C01 |
| TFO-C03 | CONTROLLED | PASSED | RUN-TFO-CHAL-linux-001 | As C01 |
| TFO-C04 | SAFE | PASSED | RUN-TFO-CHAL-linux-001 | The canonical guarded-return block reads a reconstruction file, not the challenge source; the source was read separately |
| TFO-C05 | CONTROLLED | PASSED | RUN-TFO-CHAL-linux-001 | Refusal status `2` under dash (D01); `noclobber` attribution relies on the diagnostic and on `TFO-P04` |
| TFO-C06 | SAFE | PASSED | RUN-TFO-CHAL-linux-001 | As C01 |
| TFO-C07 | HIGH-RISK | PASSED | RUN-TFO-C07-linux-001 | Challenge state reconstructed from the reference solution; four directories removed with four separate `rmdir` commands; `G12` was not run afterwards |
| TFO-P01 | CONTROLLED | PASSED | RUN-TFO-G12-P01-linux-001 | The fixture is the validator's realization of the matrix wording; refusal wording is GNU coreutils 9.4 |
| TFO-P02 | HIGH-RISK | PASSED | RUN-TFO-P02-linux-001 | Fixture only (no lab); unset-variable branch of the helper |
| TFO-P03 | HIGH-RISK | PASSED | RUN-TFO-P03-linux-001 | Lab built by the canonical setup and step 2 only; location-mismatch branch of the helper |
| TFO-P04 | CONTROLLED | PASSED | RUN-TFO-P04-linux-001 | The read-only file was created with `umask 277` to avoid `chmod` (HIGH-RISK) |

Totals: 25 cases = 24 `PASSED` + 1 `NOT APPLICABLE` + 0 `FAILED` + 0 `BLOCKED` + 0 `PLANNED`. By class: 8 SAFE (all passed), 12 CONTROLLED (11 passed, 1 not applicable), 5 HIGH-RISK (all passed). The external index and the case counts above agree; the matrix itself was not edited and still shows `PLANNED` for each of these rows.

## Verified behaviors

### Observations supported by evidence

- **Workspace and setup.** The lab root is created by the canonical block with `umask 077` and `set -C`; its mode is `drwx------`; synthetic files are created with mode `600` (G01–G05).
- **Copy, rename, append, compare.** `cp -i` and `mv -i` produced no prompt on a fresh run; the original and its backup are byte-identical (`cmp` status `0`); the handoff has three lines and no draft remains (G03–G05, G06, G07).
- **Overwrite protection.** With `noclobber` on, redirection onto an existing writable file is refused, the file is unchanged, and `dash` returns status `2` (G08, C05). With `noclobber` off the same writable file is overwritten (status `0`); a read-only file produces a different diagnostic (`Permission denied`); when both causes apply the `dash` diagnostic names `noclobber` (P04).
- **Missing-file diagnosis and recovery.** A failed `cat` of a missing relative path returns `1` with a diagnostic naming the path; the guarded-return block restores the recorded lab root (G06, G07, C04).
- **Challenge outcomes.** Each of C01–C06 met its criteria on the plan-derived reference solution, with the original and backup compared and the overwrite refused (C01–C06).
- **Interruption and resume.** After an external kill of the lab shell, the recorded lab root was found again, `umask 077` and `noclobber` were restored by the canonical block, and the file set, modes and hashes were unchanged (G11).
- **Cleanup.** The challenge artifacts (C07) and the guided lab (G13) were removed with named `rm -i` and `rmdir` commands only, with exact prompts matched to the intended targets and snapshot diffs showing exactly the expected removals; the final helper removed the empty lab directory and ended the lab shell, confirmed from a separate session (G13, G14). `rmdir` of a non-empty directory is refused and nothing is removed (P01).
- **Helper refusals.** The final helper prints `STOP: cleanup is incomplete.`, removes nothing and leaves the shell open when `lab_root` is unset (P02) and when the shell is in `./work` (P03). Its exit status in those cases is `0`, the status of the final `printf`; the refusal is defined by the message and by the unchanged state, not by a nonzero status.
- **Containment.** In every run the sentinel file and the parent directory were unchanged; no path outside the container's tmpfs was touched; the Roadmap repository was unchanged.

### Interpretations (not directly observed)

- That the module's wording matches learner experience on a personal computer is an interpretation: the runs used a minimal container, not a desktop system.
- "Not recreated" for the resumed files in G11 is inferred from identical modes, hashes and file set; inode numbers were not captured before the interruption.
- That the `noclobber` attribution in G08 and C05 is correct rests on the diagnostic text plus the P04 contrast; it was not repeated inside the same batches.
- A `PASSED` case means its documented criteria were met in this environment. It is not a statement about learning outcomes; the knowledge questions and self-assessment tables are not machine-executable (gap G-5).

## Safety controls

The controls below were applied throughout and are the ones listed in the [execution safety checklist](foundations-execution-safety-checklist.md).

| Control | How it was applied |
| --- | --- |
| Disposable containers | One new container per batch or fixture, created from the pinned image and removed by name at the end; no container survived, no image was removed, no `docker system prune` was used |
| No network | `--network none` on every container |
| Non-root execution | UID/GID `1000:1000`; effective ID checked nonzero before each batch |
| No host mounts | `Mounts=0`, no bind mounts, no container socket, no repository or workspace directory inside any container |
| Read-only root and tmpfs | `--read-only` root; a single writable `noexec` tmpfs holds the lab and the sentinel; destroyed with the container |
| Capabilities and privileges | `--cap-drop ALL`, `no-new-privileges`, default seccomp; resource limits as above |
| Sentinel | A synthetic sentinel file next to the lab, created by the validator from outside the lab shell and never under a removal target; its hash was compared after every deletion step |
| O-SNAP | Host-side name, mode and content-hash snapshots before and after each step of the destructive cases; each diff was compared with the expected change |
| Target verification | Before each deletion: physical working directory, exact target, type, no symlink, target inside the lab, sentinel outside the target |
| Interactive deletion confirmation | `rm -i` prompts were read against the intended target before answering `y` on its own line; no `-f`, `-r`, wildcard or `find -delete` form was used |
| Real pseudo-terminal | A terminal relay typed one block at a time; no replay script drove any case |
| Restricted container cleanup | Only the container created for the batch was removed, by name; Docker resource counts were recorded before and after |
| Repository integrity | Hashes of the modules, PT-BR translations, localization overlays, matrix, formal C07 materials and Skill Tree, plus `git status`, were compared before and after each batch |

## Known limitations

1. **No macOS validation.** No `TFO` case ran on macOS (classes M0–M2). BSD userland and the macOS shell differences in the divergence register are untested.
2. **No Linux L2 or L3 validation.** Only L1 (Ubuntu 24.04, `dash`, GNU coreutils, aarch64) was used; no other distribution, shell as `/bin/sh`, or architecture.
3. **No integrated C07 → G12 → G13 execution.** `C07`, `G12`, and `G13`/`G14` each ran on separately reconstructed state. The integrated sequence in one container has not been demonstrated, and `G12` keeps its reconstructed-state qualification.
4. **Partial coverage of the resume-state table.** The module's table has five rows; only "original and backup exist" and "a draft or handoff already exists" were exercised (G11, gap G-1). The rows for partial step 2, a completed guided lab, and an untrustworthy starting state were not.
5. **Untested helper failure branches.** The final helper was run to success (G14) and to two refusals (P02, P03). A failing `cd ..`, a refused `rmdir`, and a failing absence test were not exercised, nor was the recovery guidance after a refused cleanup.
6. **`TFO-G09` is `NOT APPLICABLE` under OD-5.** The conditional recovery of step 5 needs a lab-owned fault, and the decision was not to inject faults (see canonical-source issue A-TFO-3 in the plan).
7. **Remaining documented gaps.** From the plan's G-1 to G-10, these remain open for `TFO`: G-1 (above); G-3, G-6 and G-10 (macOS root behavior, macOS versions and macOS network isolation, outside this class); G-4 (ACLs, SELinux or organization policy); G-5 (questions and self-assessment are not executed); G-7 (PT-BR prose checkpoints not executed); G-8 (non-English locale messages; `LC_ALL=C` was used); G-9 (challenge accepted on one reference solution). G-2 (Git 2.32.0 acceptance) concerns the Git module only.
8. **Reconstructed prerequisites are not independent validation results.** Every batch after the first rebuilt the needed state in a new container with the canonical blocks. Those rebuilds were recorded separately and do not count as results for the cases that originally produce that state. The challenge state in C07, G12 and G13 comes from the plan's reference solution, which is not canonical content.
9. **PT-BR translations remain draft.** The pt-BR module overlay for this module has status `draft`; its prose and checkpoints were not executed and need separate human review. No Portuguese text was validated by this work.
10. **Single-run and fixture-based evidence.** Each case has one recorded passing run (two discarded or cancelled attempts are described under deviations). Probe cases (`P01`–`P04`) use validator-built fixtures that realize the matrix wording; there is no canonical fixture script.

## Deviations and lessons learned

These are operational deviations from the plan's ideal; none changed a verdict or was hidden.

- **Shell verification before execution.** One challenge batch started with an interactive `bash` instead of `dash` because the first `env ENV= HISTFILE= /bin/sh` line was typed too early and not taken by the terminal. The shell check caught it, the container (with only reconstruction run) was removed, and the batch was redone. Lesson: confirm `readlink /proc/$$/exe` before the first lab command, as the later batches did.
- **Fixture reconstruction versus case validation.** Because each batch used a fresh container, the lab was rebuilt with the canonical setup, step 2 and step 3 blocks. This is useful for isolation but is not a validation of those steps. Records label it separately and the index annotates the affected cases.
- **Interactive terminal behavior.** A mistyped block range (G12 attempt one, which included a code-fence line) left `dash` in continuation and executed nothing; it was cancelled and only the second attempt was recorded. Terminal echo and readline redraws make raw transcripts noisy, so transcripts were sanitized and compared with host-side snapshots.
- **Evidence collection.** Statuses were read from extra `echo "rc=$?"` lines and gates were typed between canonical commands. They are read-only and are listed in each record. Exit statuses that could not be observed (the `env … /bin/sh` command in G02, the whole G10 block) are stated as such.
- **Snapshot comparison.** Snapshots were taken from the host through `docker exec` (read-only) because the container's `dash` lacks features some snapshot code needed. Each destructive step was compared with the previous snapshot. G11's "not recreated" claim is weaker than the others because inodes were not captured.
- **Consistency of integrity hashing across batches.** The repository-integrity script's hash formulas changed between batches because the method was not recorded; absolute values for module, translation, harness and Skill Tree hashes therefore do not compare across all batches. Within each batch the before and after values are identical, and the formula-independent items (HEAD, `git status`, matrix hash, Skill Tree status hash) match across batches. Lesson: record and reuse one integrity script.
- **Canonical commands versus reference-derived challenge solutions.** The challenge has no canonical command sequence. C01–C07 used the plan's reference solution, so those results show that the module's acceptance criteria are satisfiable and checkable, not that a learner's own solution would pass (gap G-9).
- **Dash status values.** Failed redirections return status `2` under `dash`, not `1` as under `bash`. The plan anticipated this (D01), so it is not a deviation from the expected result.
- **Unrelated Docker activity.** During one batch the host's container and network counts changed because of an unrelated project; the validation touched only its own containers.

## Closure decision

**Linux L1 validation complete with documented limitations.** On the pinned Linux L1 image, every applicable `TFO` case has a recorded result: 24 passed with evidence, 1 not applicable by recorded decision, none failed or blocked. The safety claims tested by the probes (`P01`–`P04`) held, and no run touched anything outside its disposable container.

This does not make the Terminal File Operations module universally validated. It does not cover macOS, other Linux environments, the integrated cleanup sequence, the untested resume rows or helper branches, a learner's own challenge solution, or the PT-BR translation. The version-controlled matrix remains the plan of record (`PLANNED`) until the maintainer decides how to promote observed results; this report is a summary and not that promotion.

## Follow-up recommendations

In priority order:

1. **macOS validation** (classes M1 or M2, per OD-1; HIGH-RISK cases only in a dedicated account or VM). This is the largest uncovered platform difference for a module that tells learners to use macOS or Linux.
2. **Integrated cleanup sequence.** Run `C07` → `G12` → `G13` → `G14` in one container, with the helper's failure branches as additional probes, so the cleanup path is demonstrated as the module presents it.
3. **Remaining coverage gaps.** Exercise the other rows of the resume-state table (G-1), consider a second challenge solution (G-9), and decide whether to authorize a lab-owned fault for `G09` (OD-5).
4. **Human review of the PT-BR translation.** The pt-BR module overlay is `draft`; a bilingual reviewer should check it against the English module before it is called reviewed.
5. **Preparation for LAS validation.** Reuse the same image, controls and one recorded integrity script; handle `chmod` and root behavior (`LAS-P01`, a VM-only probe under OD-4) under their own authorization, and record reconstructions separately again.
6. **Evidence process.** Decide whether and how a sanitized summary of the external evidence is proposed for the repository, per OD-6, and keep storing raw records outside it.

## Evidence references

The raw evidence is private and kept outside this repository, in `.project-evidence/foundations-lab-validation/` at the workspace root. It is not copied here. `EXECUTION-INDEX.md` in that directory maps each case to its run record. Run records, by batch directory:

| Batch directory | Run record | Cases |
| --- | --- | --- |
| `phase-2.1-smoke/` | `SMOKE-L1-linux-001` | infrastructure smoke test (no case) |
| `phase-2.2-environment/` | `ENV-L1-linux-002` | image provenance and build (no case) |
| `phase-2.2-pilot/` | `RUN-TFO-PILOT-linux-001` | G01, G02, G10 |
| `phase-2.3-tfo-controlled-batch/` | `RUN-TFO-CTRL-linux-001` | G03, G04, G05 |
| `phase-2.4-tfo-batch-g06-g08/` | `RUN-TFO-CTRL-linux-002` | G06, G07, G08 |
| `phase-2.5-tfo-p04-g11/` | `RUN-TFO-P04-linux-001`, `RUN-TFO-G11-linux-001` | P04, G11 |
| `phase-2.6-tfo-challenge-c01-c06/` | `RUN-TFO-CHAL-linux-001` | C01–C06 |
| `phase-2.7-tfo-g12-p01/` | `RUN-TFO-G12-P01-linux-001` | G12, P01 |
| `phase-2.8-tfo-c07/` | `RUN-TFO-C07-linux-001` | C07 |
| `phase-2.9-tfo-g13-g14/` | `RUN-TFO-G13-G14-linux-001` | G13, G14 |
| `phase-2.10-tfo-p02/` | `RUN-TFO-P02-linux-001` | P02 |
| `phase-2.11-tfo-p03/` | `RUN-TFO-P03-linux-001` | P03 |

`TFO-G09` has no run record because it was not executed; its `NOT APPLICABLE` status is recorded in the index with the OD-5 reason. Each run directory also holds sanitized transcripts, before-and-after snapshots, and integrity records. No expected run record is missing.
