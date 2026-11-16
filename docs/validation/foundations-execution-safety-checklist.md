# Foundations Laboratory Execution Safety and Cleanup Checklist

**Status: checklist for a future, separately authorized execution. Nothing here has been run.** Reading this file does not authorize any execution. The checklist applies to every case in the [validation matrix](foundations-validation-matrix.md); definitions of environments and divergences are in the [validation plan](foundations-lab-validation-plan.md), and records follow the [evidence template](foundations-evidence-template.md). The checklist contains no script and no command that deletes anything with a variable path. It states requirements and the few fixed commands an operator reads and runs by hand.

## 1. Before the first command of a run

Every item must be true and recorded. If one cannot be confirmed, do not start; record the affected cases `BLOCKED`.

| # | Check | How it is confirmed |
| --- | --- | --- |
| P1 | The maintainer authorized this phase, this environment class, and this list of cases in writing | A reference in the run header |
| P2 | The environment is disposable and dedicated: a fresh container, a disposable VM, a dedicated macOS account, or (for `SAFE`/`CONTROLLED` cases only) a validator-created temporary directory | The environment class in the run header |
| P3 | The lab parent was created by the validator, is owned by the test user, has mode `700`, and is **not** inside any Git repository, the Roadmap repository, or the workspace | `git rev-parse --git-dir` fails in the parent; the parent path is not under the Roadmap checkout |
| P4 | The test user is not root (effective ID nonzero), except in `LAS-P01` in a disposable VM | O-ID |
| P5 | No credential is present: no SSH key, token, cloud profile, Git credential helper, or personal Git configuration is reachable from the test user | A review of the environment's contents before the run; the home directory is empty or synthetic |
| P6 | No volume or bind mount from the host; no container socket | The container definition reviewed |
| P7 | The network is unused: no network for the container; for a macOS environment, the labs are known to need none, and the run observes none | The container definition; the run notes |
| P8 | A sentinel file with a fixed synthetic content sits next to the lab parent, and the parent's name list was captured (O-SNAP) | The snapshot in the run record |
| P9 | `LC_ALL=C` and a fixed `TZ` are set in the outer environment | The run header |
| P10 | The Roadmap checkout's status was recorded read-only before the run (`git status --short`, run in the checkout) and is expected unchanged afterwards | The record |
| P11 | The exact canonical file hashes match the pin in the plan | `shasum -a 256` (macOS) or `sha256sum` (Linux) on each module file, compared with the plan |
| P12 | The operator will drive a real pseudo-terminal one block at a time, with no replay script | The operator's statement in the run header |
| P13 | For `HIGH-RISK` cases only: the operator has read the block, named the target, and has explicit approval for that block | A per-case note |

## 2. During the run

- Run each canonical block exactly as written. Copy it, do not retype it. Record the exact command (see the template).
- Run blocks in the order in the matrix's run list. Do not paste a whole module. Some commands fail on purpose and some prompt for an answer.
- Read each result before the next command. Record the exit status immediately after the command it belongs to.
- Answer `rm -i` prompts only after reading the target, matching on the trailing `?` and not on exact wording (D08).
- Type the removal confirmation of the Git cleanup yourself, in the pseudo-terminal, only after the verification action passed (D17).
- Never add `sudo`, `-f`, `-r`, `-R`, wildcards, `-A`, or `.` forms to a command that did not contain them.
- Do not repair a failed case so that it reads as passed. Record `FAILED` or `BLOCKED` with the reason and continue only if the rest of the run is still meaningful.
- Take the O-SNAP comparison after each module's cleanup and after any fixture teardown.

### Stop conditions (halt the run immediately)

1. A path printed by `pwd -P`, `Lab root:`, or `git rev-parse --show-toplevel` is outside the sandbox.
2. The effective ID is zero when the case requires an ordinary user.
3. A Git command reports a repository above the lab parent, a remote, or a configuration origin other than `file:.git/config`.
4. A Git identity other than `Lab Learner <learner@example.invalid>` appears.
5. A string that looks like a real credential appears anywhere.
6. A command changes, creates, or deletes anything outside the lab, as seen by the sentinel comparison.
7. A prompt, `STOP` line, or status appears that the case does not list as expected.
8. A removal target is not exactly the named lab artifact.
9. The pseudo-terminal feeds a pasted line to a `read`, or the shell state is uncertain.

On a stop: do not run further blocks, do not attempt repair outside the lab, record the state (name-only listings), and apply section 4 for whatever the lab owns.

## 3. Cleanup boundaries

The only things the validation may remove are listed here. Anything else is out of bounds.

| Artifact | Removed by | Boundary |
| --- | --- | --- |
| Lab files and directories created by a module | That module's own cleanup cases (`TFO-G12`–`G14`, `TFO-C07`, `LAS-G11`–`G13`, `LAS-C06`, `GCM-G21`, `GCM-G22`) | Named `rm -i` and `rmdir` only; the Git lab uses the module's single `rm -rf ./git-change-management-lab` of a fixed literal after Action 1 and the typed confirmation |
| Fixture sandboxes of probe and negative cases | Operator, after confirming the fixture's marker file | Section 4 |
| The validator-created lab parent | Operator, after the labs are removed | Section 4: only `rm` of the sentinel and marker files by exact name, then `rmdir` of the empty parent |
| The container or VM | Operator, after the evidence is extracted | Removal of that container or guest only, by its recorded name |
| The dedicated macOS account | The maintainer, as an administrative step outside the lab | Not part of any lab command |

Never removed: the Roadmap checkout, any file outside the designated sandboxes, the container image (kept for reproducibility, or removed only by the maintainer's decision), and the evidence records.

## 4. Fixture and parent teardown, without recursion

For a fixture sandbox or the lab parent, after the lab content has been removed by the module's own cleanup:

1. Confirm by a name-only listing (`ls -A`) that the directory contains only the validator's marker file, the sentinel file, and nothing else. If anything else exists, **stop and inspect**; do not widen the removal.
2. Remove the marker and the sentinel by their exact names with `rm`, one at a time.
3. Remove the now-empty directory with `rmdir` and confirm its absence from its own parent with `ls -A`.
4. If a fixture was built with a symbolic link or a nested repository (cases `GCM-G24`, `GCM-G25`), remove those objects by exact name first, with `rm` for a link and the Git module's verified Action 2 for a nested lab; do not use a recursive removal on a path that a variable chose.

If step 1 finds leftovers that cannot be identified, leave the sandbox in place, record it, and ask the maintainer. A sandbox left behind is a small problem; a wrong removal is not.

## 5. After the run

| # | Check |
| --- | --- |
| T1 | The O-SNAP comparison shows the parent unchanged except for the entries the run created and removed, and the sentinel's content is unchanged |
| T2 | The Roadmap checkout's `git status --short` equals the pre-run record (read-only comparison) |
| T3 | No file outside the sandbox was created, as far as the snapshots show |
| T4 | Evidence records have been sanitized by the rules in the template, and none holds a path, user name, host name, token, or the output of an environment dump |
| T5 | Every executed case has a final status, and every case not run is still `PLANNED` or recorded `BLOCKED` or `NOT APPLICABLE` with a reason |
| T6 | The container or VM was removed (or the account deletion requested), and no copy of the lab remains elsewhere |
| T7 | A run summary was written, stating what was executed versus only reviewed, and the environment class |

## 6. Specific safeguards for the high-risk operations

| Operation | Cases | Safeguard |
| --- | --- | --- |
| `chmod` on lab files, including intentional denial | `LAS-G04`–`G06`, `G10`, `C02`, `C03`, `C07` | Explicit lab-owned target only; the file lives inside a directory the user keeps accessible (`700`); no recursive form; restore only the read bit as written; run as non-root; never on a path outside the lab |
| Intentional overwrite attempt | `TFO-G08`, `TFO-C05` | Original and backup compared before the attempt; the original compared with its specified text after it; a successful overwrite is `FAILED` and never repaired to look passed |
| `rm -i`, `rmdir` cleanup | `TFO-G13`, `TFO-G14`, `TFO-C07`, `LAS-G12`, `LAS-G13`, `LAS-C06` | Verification block first; target named; the removal list matches the canonical list; O-SNAP afterwards |
| `git restore <path>` | `GCM-G13`, `GCM-C08` | Run only after `git rev-parse --show-toplevel` equals the expected lab repository; `git diff <path>` read first; exactly one explicit path; the `--staged` variants separately labelled |
| `git rm --cached` | `GCM-G11`, `GCM-C06` | `--cached` present; confirmed by `git status` before the commit; the working file's presence checked afterwards |
| `git revert --no-edit` | `GCM-G15`, `GCM-C09` | Clean tracked tree first; the revert target read from `git log --oneline`; `GIT_EDITOR=true` confirmed |
| `rm -rf` of the Git lab | `GCM-G22`, `GCM-G23` | Action 1 must have passed in the same shell; the target is the literal relative path; typed confirmation by the operator; the parent is not a repository and not the home directory; O-SNAP afterwards. Cancel paths in `GCM-G23` run in a separate fixture |
| Root-user probe | `LAS-P01` | Disposable VM or rootless user-namespace container only; written approval; no mounts; destroyed afterwards |

## 7. Out-of-bounds actions

Never, in any phase of this plan: run a laboratory command in a personal working directory, in the Roadmap repository, in the sibling application repository, or in a directory the validator did not create; use real credentials; write a script that replays or automates destructive lab commands; use `sudo` or change ownership; contact a network; push, merge, publish, deploy, or change any remote; or edit a canonical module, a competency record, or a translation as part of an execution.
