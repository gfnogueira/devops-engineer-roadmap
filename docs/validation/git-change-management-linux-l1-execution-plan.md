# Git Change Management — Linux L1 Execution Plan

**Status (revised 2026-11-17 after the independent audit of batches B1–B8):** this document was written as a planning document, with no case executed. Batches B1–B8 have since been executed on Linux L1 (15 `GCM` cases). The external execution index (the authoritative record of results, kept outside this repository) now records 14 of them as `PASSED`; `GCM-G02` stays `PLANNED` with partial execution (see OD-G4); 22 further `GCM` cases are `PLANNED` and none of them has been executed. All 37 `GCM` cases are still `PLANNED` in the [validation matrix](foundations-validation-matrix.md), which is not changed. The governance rules added in §9.4 apply to batches B9a onward. Reading this plan does not authorize any execution: every batch below needs its own written maintainer approval (checklist item P1), and every `HIGH-RISK` block needs its own approval (decision OD-2).

This plan prepares the Linux class L1 run of the [Local Git Change Management](../modules/git-change-management.md) module. It follows the structure and precedents of the [Terminal File Operations closure](terminal-file-operations-linux-l1-closure.md) and the [Local Access and Secrets closure](local-access-and-secrets-linux-l1-closure.md). It changes neither the matrix, the execution index, nor any canonical or translated content. Nothing here is evidence of the separate formal C07 process.

## 1. Scope

| Item | Value |
| --- | --- |
| In scope | The 37 `GCM` cases of the matrix on Linux class L1 (image `foundations-lab-l1:ubuntu24.04-git2.43`, Git 2.43.0, dash, GNU userland, non-root uid 1000) |
| Out of scope | macOS (M0–M2), Linux L2 (BusyBox), the root probe `LAS-P01`, the PT-BR module and overlays, the knowledge questions and self-assessment tables (gap G-5), any change to curriculum or banners (A-X-1) |
| Repository state at planning time | `devops-engineer-roadmap`, branch `main`, HEAD `c2738a573a56560ad44ee9a4b8b1e57950850707`, working tree clean before this document was added |
| Canonical source pin | The plan and matrix pin commit `d7bc4805a145d78ab5886a377e8508d417c65349`. `git-change-management.md` still has SHA-256 `7453d657abced420d2416d94de7073b0e5a4355132f3956e3662c3e8019ce775`, equal to the plan's recorded hash, and `git diff` of that file between the pin and HEAD is empty |
| Result authority | `.project-evidence/foundations-lab-validation/EXECUTION-INDEX.md` (outside the repository). At planning time it reported 44 `PASSED`, 3 `NOT APPLICABLE`, 38 `PLANNED` of 85 (the 37 `GCM` cases and `LAS-P01`). After the post-audit consolidation it reports 58 `PASSED`, 3 `NOT APPLICABLE`, 24 `PLANNED` of 85 (23 `GCM` cases, including `G02`, and `LAS-P01`) |
| Validation state by module | TFO: 24 `PASSED`, 1 `NOT APPLICABLE`, closed for L1. LAS: 20 `PASSED`, 2 `NOT APPLICABLE`, 1 `PLANNED` (`LAS-P01`), closed for L1 with limitations. GCM: 37 `PLANNED` at planning time; now 14 `PASSED` and 23 `PLANNED` (including `G02`, partially executed) |

## 2. Source inventory

Every file below was read in full for this plan.

| Source | Role | Notes relevant to this plan |
| --- | --- | --- |
| `docs/modules/git-change-management.md` (903 lines) | Canonical procedures and acceptance text | Defines steps 1–12, resume, two-action cleanup, challenge and its acceptance paragraph |
| [`foundations-lab-validation-plan.md`](foundations-lab-validation-plan.md) | Divergences `D01`–`D25`, oracles `O-*`, reference solutions `R-GCM-1`–`7`, false-pass register, decisions OD-1–OD-8 | `GCM` is the most oracle-heavy module |
| [`foundations-validation-matrix.md`](foundations-validation-matrix.md) | The 37 case rows (`PLANNED`), run order `RUN-GCM-A`, totals | Version-controlled; must stay unchanged |
| [`foundations-evidence-template.md`](foundations-evidence-template.md) | Run header, case record, sanitization | Identity other than the synthetic one means stop |
| [`foundations-execution-safety-checklist.md`](foundations-execution-safety-checklist.md) | Pre-run gates P1–P13, stop conditions, teardown rules, safeguards for Git operations | §4 item 4 and §6 are discussed in §11 |
| [`foundations-linux-environment.md`](foundations-linux-environment.md) and [`environment/linux-l1.Dockerfile`](environment/linux-l1.Dockerfile) | L1 image and run baseline | Git 2.43.0 (`1:2.43.0-1ubuntu7.4`), arm64 only, tmpfs home with `noexec` |
| TFO and LAS closure reports | Precedent for batching, reconstruction rules, evidence layout, `NOT APPLICABLE` handling | Reconstructed state is recorded and never credited as a pass of the cases that produce it |
| External `EXECUTION-INDEX.md` | Authoritative execution results | Read at planning time; the counts matched the planning-time figures above |

The Docker image itself was **not** inspected for this plan (no Docker command was run). Its properties are taken from the environment document and must be re-confirmed by the pre-flight gate SG-1 before any run.

## 3. Case inventory

The 37 rows below were checked against the matrix: `G01`–`G26` (26 cases) plus `C01`–`C11` (11 cases) give 37, each appearing exactly once in each table, and each in exactly one batch or in the `NOT APPLICABLE` proposal for `G17` (see §6). There are no `P` cases for `GCM`.

**Correction after batch B4.** The first draft of this plan said that `G06` uses three blocks. The canonical module's step 4 has four code blocks, and the acceptance criterion (two commits) needs all four. The four blocks were executed in their original order in batch B4 and `G06` passed; see `.project-evidence/foundations-lab-validation/phase-4.4-gcm-lab-g06-g07/RUN-GCM-A-linux-001-B4.md` (discrepancy 1). The row below was corrected; the canonical module, the matrix and the external index were not changed, and `G06` was not run again. The count of three blocks for `G07` (step 5) is correct.

Provenance labels follow the earlier runs: **canonical** (a fenced block of the module, copied byte for byte), **prose-derived** (commands the module names in prose without a code block), **reference-derived** (the plan's `R-GCM-*` solutions; the module deliberately gives no recipe), **test-derived** (oracles, guards, stubs and fixtures added by the validator). Acceptance criteria are those of the matrix column "Pass / fail", shortened; nothing was added.

### 3.1 Identification, risk, source and batch

| ID | Risk | Objective | Canonical procedure or source reference | Provenance | Batch |
| --- | --- | --- | --- | --- | --- |
| GCM-G01 | SAFE | O5 | Step 1: `env … /bin/sh` command and the five `unset` lines | canonical; oracle O-GITENV | B1 |
| GCM-G02 | SAFE | O5 | Step 1: version-check block | canonical; O-VER | B1 (and `RUN-GCM-OLD`, see §8) |
| GCM-G03 | SAFE | O5 | Step 2: two-line `git rev-parse --show-toplevel` block | canonical | B1 |
| GCM-G04 | CONTROLLED | O5 | Step 2: lab-creation block | canonical; O-SNAP, O-MODE-STAT | B3 |
| GCM-G05 | CONTROLLED | O1, O5 | Step 3: init and configuration block, then `config --list --show-origin`, `remote -v`, `status` | canonical; O-CFG, O-EXCL | B3 |
| GCM-G06 | CONTROLLED | O1, O2 | Step 4: four blocks (create two files; stage the notes; first commit; checklist commit) | canonical; O-LOG, O-GITID | B4 |
| GCM-G07 | CONTROLLED | O2 | Step 5: three blocks (inspect before and after) | canonical; O-LOG | B4 |
| GCM-G19 | CONTROLLED | O5 | Resume section: step 1 command, `unset` lines, version check, restoration block with the real path, then `cd ./guided-repo`, `rev-parse`, `status`, `log` | canonical; prose-derived (the four closing commands) | B5 |
| GCM-G08 | CONTROLLED | O1, O3, O4 | Step 6: three blocks (staged secret, `restore --staged`, commit) | canonical; O-STAGED | B6 |
| GCM-G09 | CONTROLLED | O4 | Step 7: three blocks (ignore rule, refused add, commit) | canonical; O-IGN | B6 |
| GCM-G10 | CONTROLLED | O4 | Step 8: three blocks (intentional mistake, ignore rule, observation) | canonical; O-IGN | B6 |
| GCM-G11 | HIGH-RISK | O4 | Step 9: first block (`git rm --cached`) | canonical | B7 |
| GCM-G12 | SAFE | O4 | Step 9: second and third blocks | canonical; test-derived guard `git log --oneline -2`; O-HIST | B7 |
| GCM-G13 | HIGH-RISK | O3 | Step 10: two blocks (`git restore ./service-notes.txt`) | canonical | B8 |
| GCM-G14 | CONTROLLED | O1, O3 | Step 11: first block (record a change to withdraw) | canonical; O-LOG | B9a |
| GCM-G15 | CONTROLLED | O3 | Step 11: second block (`git revert --no-edit HEAD`) | canonical; O-LOG | B9b |
| GCM-G16 | SAFE | O3 | Step 11: third block (`git diff --exit-code HEAD~2 HEAD`) | canonical; test-derived guard (identity of `HEAD` and `HEAD~2`) | B9c |
| GCM-G18 | SAFE | O5 | Step 12: boundaries block | canonical; O-LOG, O-CFG | B9c |
| GCM-C01 | CONTROLLED | O1, O5 | Challenge supplied-setup block | canonical | B10 |
| GCM-C02 | SAFE | O2 | Challenge item 1 | reference-derived `R-GCM-1` (read-only) | B10 |
| GCM-C03 | CONTROLLED | O1 | Challenge item 2 | reference-derived `R-GCM-2` | B11 |
| GCM-C04 | SAFE | O4 | Challenge item 3 | reference-derived `R-GCM-3` (a decision; no change) | B11 |
| GCM-C05 | SAFE | O4 | Challenge item 4, test the claim | reference-derived `R-GCM-4a` | B11 |
| GCM-C06 | HIGH-RISK | O4 | Challenge item 4, stop tracking | reference-derived `R-GCM-4b` | B12 |
| GCM-C07 | SAFE | O4 | Challenge item 4, old key still readable | reference-derived `R-GCM-4c` | B12 |
| GCM-C08 | HIGH-RISK | O3 | Challenge item 5, discard an edit | reference-derived `R-GCM-5a` | B13 |
| GCM-C09 | CONTROLLED | O3 | Challenge item 5, revert the fix | reference-derived `R-GCM-5b` | B14 |
| GCM-C10 | SAFE | O5 | Challenge item 6, boundaries | reference-derived `R-GCM-6` | B14 |
| GCM-C11 | SAFE | O1–O5 | Challenge acceptance paragraph | reference-derived `R-GCM-7`; O-HIST; transcript review | B14 |
| GCM-G21 | SAFE | O5 | Cleanup Action 1 (verification) | canonical | B15 |
| GCM-G22 | HIGH-RISK | O5 | Cleanup Action 2 (typed confirmation, `rm -rf ./git-change-management-lab`) | canonical, typed through a real pty | B15 |
| GCM-G20 | SAFE | O5 | Resume section: restoration block in a shell without the isolation variables | canonical block in a test-derived fixture | B16 |
| GCM-G24 | CONTROLLED | O5 | Cleanup Action 1 against four unsafe labs | canonical block in test-derived fixtures | B17 |
| GCM-G25 | CONTROLLED | O5 | Cleanup Action 1 identity checks against four variants | canonical block in test-derived fixtures | B17 |
| GCM-G23 | HIGH-RISK | O5 | Cleanup Action 2 cancelled three ways | canonical block in a test-derived fixture | B18 |
| GCM-G26 | SAFE | O5 | Version-check block with a stand-in `git` | canonical block with test-derived stubs | B2 |
| GCM-G17 | CONTROLLED | O3 | Step 11 closing sentence: `git revert --abort`, then `git status` | prose-derived; conditional by design | none; `NOT APPLICABLE` proposal (§6) |

### 3.2 State, dependencies and independence

"After X" means the same lab run, directly after case X (matrix "Setup" column).

| ID | Required initial state | Expected change | Depends on | Runs alone? |
| --- | --- | --- | --- | --- |
| G01 | Fresh container; outer shell; parent outside any repository | Child shell with five `GIT_*` names | none | Yes |
| G02 | Shell of G01 | None on disk; version line | G01 | No (same shell) |
| G03 | After G02 | None; nonzero status, no path printed | G02 | No |
| G04 | After G03; O-SNAP of the parent | `git-change-management-lab/` (mode 700) with `.lab-marker`; parent gains one entry; shell variables set | G03 | No |
| G05 | After G04 | `guided-repo/` with `.git`; three local config keys; no commits; no remote | G04 | No |
| G06 | After G05 | Two files; two commits | G05 | No |
| G07 | After G06 | One appended line; third commit | G06 | No |
| G19 | After G07; shell ended, new shell | No change in files or commits; variables restored | G07 | No |
| G08 | After G19 | `local.env` untracked; checklist gains a line; fourth commit (checklist only) | G19 (state of G07) | No |
| G09 | After G08 | `.gitignore`; fifth commit | G08 | No |
| G10 | After G09 | `legacy.env` added (commit 6), ignore line (commit 7), `legacy.env` modified uncommitted | G09 | No |
| G11 | After G10 | `legacy.env` removed from the index only; eighth commit; file stays on disk | G10 | No |
| G12 | After G11 | None (reads) | G11 | No |
| G13 | After G12 | One line appended to `service-notes.txt`, then discarded | G12 | No |
| G14 | After G13 | `step-4` line; ninth commit | G13 | No |
| G15 | After G14; tracked tree clean | Revert commit; tenth commit | G14 | No |
| G16 | After G15 | None | G15 | No |
| G18 | After G16 | None | G16 | No |
| C01 | After G18 | `challenge-repo/`: two commits, four pending changes | G18 (soft; hard need is only a lab root and shell variables) | No |
| C02 | After C01 | None | C01 | No |
| C03 | After C02 | Fix commit touching only `release-notes.txt` | C02 | No |
| C04 | After C03 | None (decision only) | C03 | No |
| C05 | After C04 | None | C04 | No |
| C06 | After C05 | `cache-settings.conf` removed from the index; commit; file keeps three lines | C05 | No |
| C07 | After C06 | None | C06 | No |
| C08 | After C07 | Edit appended and discarded | C07 | No |
| C09 | After C08; tracked tree clean | Revert commit on top | C08 | No |
| C10 | After C09 | None | C09 | No |
| C11 | After C10 | None | C10 | No |
| G21 | After C11; both repositories present | None (verification) | C11 | No |
| G22 | After G21; operator types the exact name | Lab directory removed | G21 | No |
| G20 | Fixture: ordinary shell, no isolation variables, a lab present | None; `STOP` before any `cd` | none (lab built with canonical setup as test setup) | Yes |
| G23 | Fixture: minimal verified lab built from the canonical setup and init blocks | None; three cancellations, tree identical | none (as G20) | Yes |
| G24 | Fixture: four variants built outside the real labs | None; four refusals | none | Yes |
| G25 | Fixture: four variants (changed identity, fake remote, unset variable, symlink) | None; refusals as stated | none | Yes |
| G26 | Fixture: shell function standing in for `git` | None | none | Yes |
| G17 | Needs a deliberately conflicting revert (OD-5) | If run: returns to the state before the revert | G15 context | Not by default |

### 3.3 Acceptance criteria and potential ambiguity

| ID | Acceptance (matrix, shortened) | Potential ambiguity (detail in §11) |
| --- | --- | --- |
| G01 | PASS: exactly `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_NOSYSTEM`, `GIT_TERMINAL_PROMPT`, `GIT_PAGER`, `GIT_EDITOR` remain among `GIT_*` names. FAIL: another remains | How names are listed without printing values (TH-2) |
| G02 | PASS: pass line plus recorded `git --version`. In `RUN-GCM-OLD` the expected result is `STOP` and PASS means the gate worked. FAIL: pass line on an old Git | One matrix row covers two environments (A-PL-1) |
| G03 | PASS: nonzero status, empty standard output. FAIL: a path is printed | Status `128` is not asserted |
| G04 | PASS: mode `700`, marker present, parent gained one entry. FAIL: `STOP` | none |
| G05 | PASS: non-empty config list, all origins `file:.git/config`, no remote, `.git/info/exclude` only comment lines. FAIL: other origin or an exclude pattern | Key list written by `git init` varies (D12); blank lines in `exclude` (TH-2) |
| G06 | PASS: messages and order match; synthetic identity as author and committer. FAIL: other identity | Log decorations (D11) |
| G07 | PASS: both diff states as stated, three commits. FAIL: reversed | none |
| G19 | PASS: Git's own record shows the same three commits and a clean tree. FAIL: any file or commit changed by resuming | How the shell ends is unspecified (A-PL-6) |
| G08 | PASS: committed diff has no marker line; `local.env` unchanged. FAIL: token staged at commit time | An omitted `--staged` would discard work; transcript is the only guard |
| G09 | PASS: `check-ignore` status `0`, nonzero refusal, empty staged list. FAIL: ignored file staged | The refusal message mentions an override option that must never be used |
| G10 | PASS: modified and tracked, `check-ignore` status `1`. FAIL: status `0` | Records an intentional marker commit (see SC-13) |
| G11 | PASS: working file present and absent from `git ls-files`. FAIL: file deleted or command refused (record the version) | A-GCM-2 |
| G12 | PASS: `HEAD~1` resolves to the "Ignore legacy settings file" commit and the token line prints. FAIL: wrong commit | A-GCM-1 |
| G13 | PASS: only that path changed; clean status; empty diff. FAIL: any other file changed | Irreversible by design |
| G14 | PASS: nine commits. FAIL: another count | none |
| G15 | PASS: ten commits, revert on top, content equals the earlier state. FAIL: conflict or editor opened | Editor behavior if `GIT_EDITOR` were lost (D18) |
| G16 | PASS: status `0` and `HEAD` is the revert and `HEAD~2` is "Stop tracking legacy settings file". FAIL: otherwise | FP-6 trivially true comparison |
| G18 | PASS: all five checks and the ten messages in order. FAIL: any deviation | none |
| C01 | PASS: ready message, two commits, `git status` lists four pending items. FAIL: `STOP` | none |
| C02 | PASS: every statement tied to a command output. FAIL: a statement from names only | Quality of the description is a reviewer judgment (R); not independent when assisted |
| C03 | PASS: the commit touches only `release-notes.txt`. FAIL: another path | Message wording not fixed by the module |
| C04 | PASS: both files exist with supplied content, untracked. FAIL: changed, staged or committed | Decision-only case; passes by non-action |
| C05 | PASS: tracked, modified, `check-ignore` status `1`. FAIL: any contradicts | FP-7 (path must exist inside the repository) |
| C06 | PASS: file present with three lines, absent from `git ls-files`. FAIL: file removed from disk | A-GCM-2 |
| C07 | PASS: key read from history and the real-credential response stated. FAIL: key unreadable | The real-credential response is a statement, reviewer evidence only |
| C08 | PASS: only that path affected. FAIL: any other file changed | Irreversible by design |
| C09 | PASS: all three verification forms from the canonical item, revert ID read from the log. FAIL: `HEAD~2` assumed | Identification of the fix and revert IDs |
| C10 | PASS: top level, no remote, all origins local. FAIL: any other origin | none |
| C11 | PASS: every acceptance bullet evidenced. FAIL: any bullet unevidenced | "Nothing staged with a form that selects everything" is proven only by transcript review |
| G21 | PASS: no `STOP`, two verified lines, empty symlink list. FAIL: otherwise | Needs both repositories (§11, A-PL-9) |
| G22 | PASS: absence confirmed from the parent, sentinels intact, removal targeted the literal path. FAIL: a sentinel changed | Real pty required (D17) |
| G20 | PASS: `STOP` before any `cd`. FAIL: the block proceeded | Content of "a lab present" unspecified (A-PL-5) |
| G23 | PASS: three cancellations and an identical tree listing. FAIL: any removal | End-of-input on a pty (TH-5) |
| G24 | PASS: all four refused, nothing removed. FAIL: any variant verified | How shell variables are set for fixtures (A-PL-4); teardown (A-PL-3) |
| G25 | PASS: first three refuse; symlink variant prints its link yet still ends `Verification passed`, recorded as A-GCM-4. FAIL: a refusal missing | Deliberately trips stop conditions 3 and 4 (A-PL-2) |
| G26 | PASS: ten outcomes as listed. FAIL: any wrong outcome | Stub technique; "missing command" simulation (TH-7) |
| G17 | Default `NOT APPLICABLE` (the module calls the state unexpected). If injected: PASS when the clean pre-revert state is restored | Conditional by design (BL-2) |

## 4. Risk classification

### 4.1 Distribution (matrix classification, recounted from the 37 rows)

| Class | Count | Cases |
| --- | ---: | --- |
| SAFE | 15 | G01, G02, G03, G12, G16, G18, G20, G21, G26, C02, C04, C05, C07, C10, C11 |
| CONTROLLED | 16 | G04, G05, G06, G07, G08, G09, G10, G14, G15, G17, G19, G24, G25, C01, C03, C09 |
| HIGH-RISK | 6 | G11, G13, G22, G23, C06, C08 |
| **Total** | **37** | Matches the matrix totals table (15 / 16 / 6); 1 conditional case (G17) |

The checklist §6 lists safeguards for `git revert --no-edit` (`G15`, `C09`) next to the high-risk operations although the matrix classes both cases `CONTROLLED`. This plan applies the matrix class and the §6 safeguards (A-PL-7). Revision 2026-11-17: as a controlled execution-policy decision (not a change to the matrix class, to any risk classification or to the module), `G15` and `C09` also use the two-phase approval workflow of §9.4 (separate safety review, then explicit maintainer approval that references that review).

### 4.2 Git operations that appear in the source material

Commands were collected by searching the module text and the matrix, not assumed. Operations marked *test-derived* appear only in validator fixtures.

| Operation (cases) | State changed | Real project repository at risk? | Disposable repository and dedicated container | Verification before | Observation after | Disposal |
| --- | --- | --- | --- | --- | --- | --- |
| `git init --initial-branch=main` (G05, C01; fixtures) | Creates `.git` and template files in a new directory | Only if run inside a repository; the canonical chain checks `rev-parse --show-toplevel` first | Yes, both: new repository in a disposable lab inside a throwaway container | G03 and the parent check in the G04 block; SG-1 shows no mounts | O-CFG, O-EXCL, toplevel equals `<lab root>/guided-repo` | Container removed; G22 removes the lab |
| `git config --local user.name/user.email/core.excludesFile` (G05, C01) | Writes the repository's `.git/config` | A local setting goes to whichever repository Git finds, hence the guarded chain | Yes | Toplevel equality inside the guarded chain | `config --list --show-origin`: every line `file:.git/config` | As above |
| `git config --list --show-origin`, `git remote -v`, `git remote` (G05, G18, C10, G21–G25) | None (read-only) | No | Not required, but run in the same container | Isolation variables confirmed (O-GITENV) | Output is the evidence | None |
| `git add <explicit path>` (G06–G10, G14, C03) | Staging area (index) | Same boundary rule as init | Yes | Toplevel known from the preceding block; no `add .`, `-A`, `-f` (SG-7) | `git status`, `git diff --staged`, O-STAGED | As above |
| `git commit -m '<message>'` (G06–G10, G11, G14, C03, C06) | Adds a commit, advances `main` | Same | Yes | `git diff --staged` read; identity expectation known; `GIT_EDITOR=true` | O-LOG, O-GITID | As above |
| `git status`, `git diff`, `git diff --staged`, `git log`, `git show`, `git ls-files`, `git check-ignore`, `git rev-parse`, `git diff --exit-code` | None (read-only) | No | Same container, no extra requirement | Pager disabled (`GIT_PAGER=cat`) | Output is the evidence | None |
| `git restore --staged <path>` (G08) | Index only; file unchanged | Same boundary rule | Yes | Toplevel; `--staged` present | `status`, `diff --staged --name-only`, content of `local.env` | As above |
| `git restore <path>` (G13, C08) | **Overwrites the working copy; the edit is unrecoverable** | Only the named path of the current repository | Yes, both | Toplevel equals the lab repository; `git diff <path>` read first; exactly one path; no `--staged` | Clean `status`, empty `diff`, content of the file, no other path changed | As above |
| `git rm --cached <path>` (G11, C06) | Index only; without `--cached` the working file would be deleted | Same | Yes | `--cached` present in the block (V: copy); `git status` before the commit | Working file present; absent from `git ls-files`; staged deletion shown | As above |
| `git revert --no-edit <id>` (G15, C09) | Adds a commit that applies the opposite change | Same | Yes | Clean tracked tree; target read from `git log --oneline`; `GIT_EDITOR=true` | `git log`, content, `git show --stat` | As above |
| `git revert --abort` (G17 only) | Discards an in-progress revert | Same | Needs an injected conflict, not approved (OD-5) | n/a | n/a | n/a |
| `rm -rf ./git-change-management-lab` (G22; G23 in the cancelled branch) | **Recursive forced removal** | Only the fixed literal relative path after Action 1 | Yes, both | Action 1 passed in the same shell; typed confirmation by the operator | Absence confirmed from the parent; sentinel snapshot | The lab itself |
| `git remote add <name> <url>.invalid`, `git config --local user.email <other>`, `git init` of an outer repository, `ln -s`, `unset GIT_CONFIG_GLOBAL`, a shell function named `git` (G24–G26, G20; *test-derived*) | Configuration or filesystem of the fixture only | None, provided they run inside a fixture container | Yes, a dedicated container per fixture batch | SG-1, fixture marker | Case-specific | Container removal (see A-PL-3) |

### 4.3 Operations the request lists that the source material does not contain

A search of `git-change-management.md` found no occurrence of: `git branch`, `git switch`, `git checkout`, `git reset`, `git clean`, `git merge`, `git rebase`, `git reflog`, `git push`, `git pull`, `git fetch`, `git clone`, `git stash`, `git tag`, `git remote add`, `git add -A`, `git add .`, `commit -a`, `--amend`, `git add -f`, `git gc`. The module states that branches, remotes and history rewriting are outside its scope, and that "commands that discard whole sets of changes or rewrite existing commits are not used or needed". `git config` appears only as `--local` writes and `--list --show-origin` reads. `git init` always carries `--initial-branch=main`. `git push` appears nowhere; the module has no remote.

Control: any command from this list in a block, other than `git remote add` inside the declared fixture of `G25`, is an immediate stop (SC-11), and the transcript of every batch is scanned for these words before the batch is closed.

## 5. Dependency graph

The guided chain is strictly sequential because each case builds on the commits of the previous one. Fixtures are independent of the chain except that they reuse its canonical lab-construction blocks.

```text
RUN-GCM-A (one lab, one container)
G01 → G02 → G03 → G04 → G05 → G06 → G07 → G19 → G08 → G09 → G10 → G11 → G12
    → G13 → G14 → G15 → G16 → G18 → C01 → C02 → C03 → C04 → C05 → C06 → C07
    → C08 → C09 → C10 → C11 → G21 → G22

Hard dependencies beyond "previous case":
  G12 needs the commit created by G11 ("HEAD~1" is valid only right after it, A-GCM-1)
  G15 needs a clean tracked tree (after G14, G13 discard)
  G16 needs the revert of G15 (HEAD~2 is "Stop tracking legacy settings file")
  C01 needs only the lab root and shell variables (soft: after G18)
  C09 needs the fix from C03 and a clean tracked tree (after C08)
  G21 needs both repositories verified (guided from the chain, challenge from C01)
  G22 needs G21 passed in the same shell

Fixtures (own containers, own sandboxes)
G26                  none
G20, G23, G24, G25   need the canonical G04 (and G05 for G23–G25) blocks to be
                     validated first, so they run after the chain
G17                  would need G15 context plus an injected conflict (not approved)
RUN-GCM-OLD          G02 only, needs an image with Git older than 2.32.0 (not available)
```

## 6. Execution batches

### 6.1 Strategy

- **One lab for the whole chain.** The guided history is cumulative and `G21` expects both repositories. Rebuilding it for each batch would re-execute earlier cases as "reconstruction", which earlier closures recorded but did not credit. The plan therefore keeps one container for `RUN-GCM-A` from batch B1 to B15, with an approval checkpoint between batches, and falls back to reconstruction from the canonical blocks (recorded as reconstruction, never as a pass) if the container is lost. Whether to keep the container between sessions is decision OD-G2.
- **Checkpoint at every batch end:** name-only listing of the lab, `git log --oneline` reduced to messages (O-LOG), `git status`, and the O-SNAP of the parent. The next batch starts from that record.
- **Fixtures get fresh containers.** Each fixture batch starts from the image, so no state can leak between fixtures or into the chain.
- **Ordering.** `SAFE` independent work goes first (B1, B2). The chain then runs in dependency order. Inside it, the `HIGH-RISK` cases (G11, G13, C06, C08, G22) are isolated in their own small batches or at the end of one, so each can be reviewed and approved alone. The `CONTROLLED` fixtures (G24, G25) and then the `HIGH-RISK` fixture (G23) follow the chain, as `TFO-P02` and `TFO-P03` followed `TFO-G13` and `TFO-G14`.
- **Deviation from the matrix run list.** The matrix lists the fixtures as a group after the chain and places `G19` between `G07` and `G08`. This plan keeps both. It adds only the batch boundaries and the placement of `G26` before the chain.

### 6.2 Batch summary

| Batch | Cases | Highest risk | Container | Initial state | Final state |
| --- | --- | --- | --- | --- | --- |
| B1 | G01, G02, G03 | SAFE | RUN-GCM-A (first part) | Fresh container, no lab | Lab shell active; no lab directory; nothing created |
| B2 | G26 | SAFE | Fixture container FX-VER | Fresh container | Stub shell discarded; nothing created |
| B3 | G04, G05 | CONTROLLED | RUN-GCM-A | B1 state | Lab with empty configured `guided-repo` |
| B4 | G06, G07 | CONTROLLED | RUN-GCM-A | B3 state | Three commits, clean tree |
| B5 | G19 | CONTROLLED | RUN-GCM-A | B4 state | New shell, same three commits, clean tree |
| B6 | G08, G09, G10 | CONTROLLED | RUN-GCM-A | B5 state | Seven commits; `local.env` ignored and untracked; `legacy.env` tracked and modified |
| B7 | G11, G12 | HIGH-RISK | RUN-GCM-A | B6 state | Eight commits; `legacy.env` untracked on disk |
| B8 | G13 | HIGH-RISK | RUN-GCM-A | B7 state | Clean tree; `service-notes.txt` has three lines |
| B9a | G14 | CONTROLLED | RUN-GCM-A | B8 state: `HEAD` `69b82e1d233e61f209b4ecdd6eb9eaf132f23997`, 8 commits, clean tracked tree | 9 commits; `Add shortcut step to checklist` on top |
| B9b | G15 | CONTROLLED (two-phase approval, §9.4) | RUN-GCM-A | B9a state: 9 commits, clean tracked tree | 10 commits; `Revert "Add shortcut step to checklist"` on top |
| B9c | G16, G18 | SAFE | RUN-GCM-A | B9b state: 10 commits, read-only cases | 10 commits, unchanged; ten messages in the canonical order verified |
| B10 | C01, C02 | CONTROLLED | RUN-GCM-A | B9c state | `challenge-repo` with two commits and four pending changes; inspected |
| B11 | C03, C04, C05 | CONTROLLED | RUN-GCM-A | B10 state | Three commits; two files untracked; claim tested |
| B12 | C06, C07 | HIGH-RISK | RUN-GCM-A | B11 state | Four commits; `cache-settings.conf` untracked on disk |
| B13 | C08 | HIGH-RISK | RUN-GCM-A | B12 state | `rollback-plan.txt` equals its two lines |
| B14 | C09, C10, C11 | CONTROLLED (`C09`: two-phase approval, §9.4) | RUN-GCM-A | B13 state | Five commits; acceptance evidenced |
| B15 | G21, G22 | HIGH-RISK | RUN-GCM-A | B14 state, both repositories present | Lab removed; container then removed by name |
| B16 | G20 | SAFE | Fixture container FX-RESUME | Fresh container; lab built from the canonical setup block | `STOP` before any `cd`; lab untouched |
| B17 | G24, G25 | CONTROLLED | Fixture container FX-VERIFY | Fresh container; one fresh sub-parent per variant | Eight variants observed; no Action 2 run |
| B18 | G23 | HIGH-RISK | Fixture container FX-CANCEL | Fresh container; minimal verified lab | Lab identical after three cancellations |
| — | G17 | — | none | — | `NOT APPLICABLE` proposal (OD-G3) |

Totals: B1 3 + B2 1 + B3 2 + B4 2 + B5 1 + B6 3 + B7 2 + B8 1 + B9a 1 + B9b 1 + B9c 2 + B10 2 + B11 3 + B12 2 + B13 1 + B14 3 + B15 2 + B16 1 + B17 2 + B18 1 = 36, plus `G17` = 37.

### 6.3 Batch gates, evidence and stop conditions

Common items are defined in §9 (`SG-*`), §10 (`ER-*`) and the stop list in §9.3 (`SC-*`). The table lists what each batch adds.

| Batch | Safety gates | Evidence requirements | Stop conditions (in addition to SC-1 to SC-14) |
| --- | --- | --- | --- |
| B1 | SG-0 to SG-4; confirm no `GIT_*` name before the lab shell starts | ER-1 to ER-5; O-GITENV, O-VER, O-FP; the exact version string | Any `GIT_*` name other than the five after the `unset` lines; a path printed by G03; version line below 2.32.0 (record, do not repair) |
| B2 | SG-0 to SG-4 | ER-1 to ER-4; ten recorded outcomes with the stubbed version line for each | Stub defined outside this batch's shell; any lab command run with the stub active |
| B3 | SG-0 to SG-5; O-SNAP of the parent | ER-1 to ER-5; O-MODE-STAT; O-CFG; O-EXCL | `STOP` in the setup or init blocks; lab path outside the sandbox; an origin other than `file:.git/config`; a non-comment line in `.git/info/exclude`; any remote |
| B4 | SG-5 | O-LOG, O-GITID | Any identity other than the synthetic one; an editor or pager opens; a commit count that differs |
| B5 | SG-5; the kill target is verified as the lab shell only (pid, parent, executable, working directory) before signalling; no `killall` or name matching | ER-1 to ER-5; process identity record; before and after snapshots equal; O-GITENV after resume | Target not exactly the lab shell; the container main process affected; any file or commit changed by resuming |
| B6 | SG-5; each `git add` read before it runs | O-STAGED before the G08 commit; O-IGN | A staged marker at commit time; `git add` with an override option; ignored file staged |
| B7 | SG-5, SG-6 for G11; checklist §6 `git rm --cached` safeguards | O-HIST; O-LOG; presence of the working file | `--cached` absent from the block; working file missing; refusal by Git (a finding, record the version) |
| B8 | SG-5, SG-6 for G13; checklist §6 `git restore` safeguards | `git diff` of the path before; status, diff, content after | Anything other than one explicit path; more than one changed file before the restore; toplevel mismatch |
| B9a | SG-5; §9.4 artifacts; shell reconstruction including the canonical version check; checkpoint equals the B8 checkpoint (`.git/index` prefix `cc9a4494`) | O-STAGED before the commit; exact commit contents after it (only `deploy-checklist.txt`, one added line, no marker); O-LOG | Any state other than the B8 checkpoint; staged set other than `deploy-checklist.txt`; commit count other than 9 |
| B9b | SG-5, SG-6-equivalent two-phase approval (§9.4); clean tracked tree before G15; `GIT_EDITOR=true` confirmed; target read from `git log --oneline` | O-LOG; revert content equals the earlier state | Editor opens; revert conflict or revert in progress (stop, preserve, ask; no automatic `git revert --abort`, A-PL-12); any state other than clean tracked tree |
| B9c | SG-5; §9.4 artifacts; `HEAD` confirmed to be the revert before `G16` | The guard for G16 (`HEAD` is the revert, `HEAD~2` is "Stop tracking legacy settings file"); O-LOG, O-CFG for G18 | `HEAD` is not the revert; any file or commit changed (both cases are read-only) |
| B10 | SG-5 | O-LOG; reviewer note R for the description (C02) | `STOP` on setup; setup rerun over an existing `challenge-repo` |
| B11 | SG-5 | O-STAGED before the C03 commit; O-IGN; O-CMP for the two untouched files | Another path in the fix commit; either file staged or changed |
| B12 | SG-5, SG-6 for C06 | O-HIST; file content after | File removed from disk; a marker line in an added line of any commit after the two supplied ones |
| B13 | SG-5, SG-6 for C08 | O-CMP of `rollback-plan.txt`; status | Any other file affected |
| B14 | SG-5; two-phase approval (§9.4) before C09; clean tracked tree before C09; IDs read from `git log --oneline` | O-HIST with base = "Ignore cache settings"; three verification forms for C09; reviewer note for C11 | Revert ID assumed instead of read; conflict |
| B15 | SG-5, SG-6 for G22; checklist §6 `rm -rf` safeguards; the operator, not a script, types the confirmation | O-SNAP before and after; absence confirmed from the parent shell | Any `STOP` from Action 1; the typed answer not exactly the lab name; a sentinel entry changed |
| B16 | SG-0 to SG-4 | ER-1 to ER-4; proof that the lab was untouched | Any `cd` happened; the block proceeded |
| B17 | SG-0 to SG-4; SG-8 (declared deviations) | Per-variant record; the nested-repository variant constructed inside the fixture only | A variant verified (a FAIL, record it); Action 2 typed; a variant path outside the fixture sandbox |
| B18 | SG-0 to SG-4, SG-6; the answers (wrong name, empty line, end of input) are typed or sent by the operator | O-TREE before and after each cancellation | Any removal; the third cancellation (end of input) consumed as a line of a script |

## 7. Isolation strategy

The model keeps the L1 baseline and adds Git-specific controls. Nothing here is built or run by this plan.

| Requirement | Control |
| --- | --- |
| No host bind mounts; no access to the real repository | `docker inspect` of every container must show zero mounts and no volumes. The image contains no repository. The Roadmap checkout is never mounted or copied in |
| No Docker socket, no devices, no network | `--network none`; no socket; no devices; confirmed from inside (loopback only, no route) as in the earlier runs |
| Non-root, no escalation | User `1000:1000`, `--cap-drop ALL`, `no-new-privileges`, default seccomp |
| Read-only root filesystem | `--read-only`; the only writable path is the tmpfs at `/home/ubuntu` (`rw,nosuid,nodev,noexec,size=64m,mode=0700,uid=1000,gid=1000`) |
| Existing limits | 256 MiB memory, no swap, 1 CPU, 64 processes. Git's own processes and the pty fit; a `df` and `ps` record is taken at start |
| Container lifecycle | Created from the recorded image ID with `--pull=never`; removed by its recorded name; one container per run or fixture batch |
| Git configuration isolation | The lab shell carries the five module variables (`GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_TERMINAL_PROMPT=0`, `GIT_PAGER=cat`, `GIT_EDITOR=true`). Before it starts, the container environment must contain no `GIT_*` name (SG-2). Names only are listed, never values (O-GITENV). The container has no personal Git configuration by construction: the home is an empty tmpfs, and no host environment is passed |
| Host Git configuration and credentials | Never reachable: nothing is mounted and no environment is passed through. No credential helper, SSH agent or token exists in the image |
| Synthetic identity | `Lab Learner <learner@example.invalid>` is the module's own value; `.invalid` is a reserved name that cannot belong to a mailbox. It is the only identity allowed in any record. Fixture variants that need a different value use a clearly marked fixture value such as `fixture-other@example.invalid`, declared in the run header (SG-8) |
| Remote behavior | None of the 37 cases tests remote behavior. No local bare repository is planned. The `G25` fake remote is a configuration entry at an `.invalid` host inside a fixture; no command that could resolve or contact it is allowed (`fetch`, `pull`, `push`, `ls-remote`, `clone`, `remote update`) |
| `git push` | Never executed. It is absent from the module; it is a stop condition (SC-11); the container has no network |
| Pager, editor, prompts | `GIT_PAGER=cat`, `GIT_EDITOR=true`, `GIT_TERMINAL_PROMPT=0` confirmed after each shell start and resume (D18) |
| Evidence extraction | Transcripts are captured on the host side of the pty. Files leave the container by one explicit extraction step, never by a shared mount |
| Host protection | The host-side integrity record compares the Roadmap checkout before and after with `git --no-optional-locks status --short`, so that the read cannot take an index lock or refresh the index |
| Discard | The lab is removed by G22 inside the container; the container is removed by its recorded name. Fixture containers are removed the same way. Checklist §4 non-recursive teardown applies to anything else, except where A-PL-3 applies |

Environment assumptions to confirm at pre-flight, because they decide whether Git runs cleanly on this tmpfs: the lab parent is owned by uid 1000 (avoids the "dubious ownership" refusal of newer Git, A-GCM-5); `/dev/null` is available for `GIT_CONFIG_GLOBAL` and `core.excludesFile`; the template directory used by `git init` contains only the usual sample hooks and an `info/exclude` with comment lines (O-EXCL); `/` and `/home` are not repositories.

## 8. Git version compatibility

### 8.1 What the requirement is

| Question | Finding |
| --- | --- |
| Is 2.32.0 a minimum? | Yes. The module's [Git versions](../modules/git-change-management.md#git-versions) table calls 2.32.0 the "Minimum supported". Its basis is `GIT_CONFIG_GLOBAL`, first available in 2.32.0, which the lab shell needs to ignore personal configuration. Older Git "does not recognize `GIT_CONFIG_GLOBAL` and would read your personal configuration despite the setting", so the module's version-check block stops below 2.32 |
| Does 2.43.0 satisfy it? | Yes. The check block compares major and minor: 2 and 43 are at least 2 and 32 |
| Other feature minimums in the module | `git restore` 2.23.0; `git init --initial-branch` 2.28.0; `GIT_TERMINAL_PROMPT` 2.3.0; `git config --show-origin` 2.8.0. All are below 2.32.0, so the gate covers them |
| Practically tested versions | The module says none. After a run, 2.43.0 would be the first, only for Linux L1 on arm64 |

### 8.2 Cases that depend on the gate

| Cases | Dependency |
| --- | --- |
| G02 | Is the gate; must show `Git check passed:` on the real 2.43.0 binary (FP-8 requires the real binary here) |
| G26 | Tests the gate's logic with stubs; proves arithmetic, not the real gate |
| G11, C06 | The matrix flags divergence D13 on Linux because they rely on `git rm --cached` accepting a file with an uncommitted edit; a refusal on a version is a finding (A-GCM-2) |
| G01, G05, C01, G19 and all later cases | Indirectly: the isolation they rely on exists only because the gate passed |
| G19 | Reruns the version check after the interruption |

### 8.3 Behavior that could differ between versions

These items come from the module text and Git's documented behavior. They are expectations, not observations from this task.

- **`git rm --cached` with a modified working file (G11, C06).** Git's manual describes `--cached` as requiring the staged content to match either the branch tip or the file on disk. Here the index matches `HEAD`, so acceptance is expected; this is the unverified A-GCM-2 and is confirmed only by running G11.
- **Messages and hints.** Wording of status, refusal and advice lines changes between releases; the module says not to treat a particular message as guaranteed. Checks use status, state and set membership.
- **Log decorations and colour.** `(HEAD -> main)` and ANSI colour appear only on a terminal (D11); compare messages and order only.
- **Ownership check.** Newer Git refuses repositories owned by another user; satisfied when the lab is owned by the test user (A-GCM-5).
- **Keys written by `git init`** (D12) and the content of the init template (D15).
- **Newer releases.** The module lists 2.56.1 as the latest release at review time. Behavior on releases newer than 2.43.0 is not tested by this plan.

### 8.4 Is another environment needed?

| Option | Purpose | Status |
| --- | --- | --- |
| **L1 only (2.43.0)** | Closes 36 of 37 cases for Linux L1 with the real gate accepting | Sufficient, with the documented limitation below |
| **`RUN-GCM-OLD` (L3, Git older than 2.32.0)** | Shows the real gate refusing; the matrix expects `STOP` and PASS means the gate worked | Not available. The current image has only 2.43.0. Needs a different base image or package source, a provenance review (OD-7) and network access to fetch packages during a build, none authorized. This task did not rebuild or create any image |
| **A release near the minimum (optional)** | Acceptance at a version close to 2.32.0 | Optional coverage. Exact 2.32.0 acceptance needs a source build (gap G-2) and is not planned |

Recommendation: run L1 first; treat L3 as a separately approved follow-up; record the absence of an old-Git run as a limitation (OD-G4 decides whether `G02` can be `PASSED` without it).

## 9. Safety gates

### 9.1 Pre-flight gates (every container)

| Gate | Check |
| --- | --- |
| SG-0 | Checklist P1–P13 (authorization, disposable environment, parent mode 700 outside any repository, non-root, no credentials, no mounts, no network, sentinel, `LC_ALL=C` and `TZ=UTC`, host status record, module hash, real pty, approval for `HIGH-RISK` blocks, carried out as the two-phase approval of §9.4, which also applies to `G15` and `C09`) |
| SG-1 | The image ID equals `sha256:922a342b0606fe9a4036e7062ee97e39c79597814a0f91addab3abd9e02e1d38`; `git --version` inside is 2.43.0; `docker inspect` saved before the first command and showing user 1000:1000, network none, CapDrop ALL, no-new-privileges, read-only root, the tmpfs options, zero mounts, no socket, the three limits |
| SG-2 | Names of `GIT_*` variables in the container environment: none. No `~/.gitconfig`, no `~/.config/git`; `/etc/gitconfig` presence recorded |
| SG-3 | Host `git --no-optional-locks status --short` of the Roadmap checkout recorded (expected empty at `c2738a5`); module hash equals the pin; `docker` counts before (containers, networks, volumes, images) recorded |
| SG-4 | O-SNAP baseline of the lab parent and the sentinel file |
| SG-5 | Before any state-changing Git block: `git rev-parse --show-toplevel` equals the expected repository, read by the operator. The guarded canonical chains already include this for init and config |
| SG-6 | `HIGH-RISK` blocks: the operator reads the block, names the target, and obtains explicit approval for that block (OD-2) |
| SG-7 | Forbidden-form scan before each block: none of the commands in §4.3, none of `-f`, `--force`, `git add .`, `git add -A`, `sudo` |
| SG-8 | Fixture deviations (G24, G25) are declared in the run header before the batch starts, so that expected trips of stop conditions 3 and 4 are not mistaken for isolation failures |

### 9.2 Post-run gates

Checklist T1–T7, plus: the `docker` counts after equal those before (the lab container removed by name, no new volumes); `integrity-before` equals `integrity-after` for the Roadmap checkout; the transcript scan for §4.3 commands is clean; no real-looking token anywhere; every executed case has a final status, and every case not run is still `PLANNED`.

### 9.3 Stop conditions

| ID | Condition |
| --- | --- |
| SC-1 to SC-9 | The nine conditions of checklist §2 (path outside the sandbox; root; repository above the parent, a remote, or an origin other than `file:.git/config`; identity other than `Lab Learner <learner@example.invalid>`; real-looking credential; write outside the lab; unexpected prompt, `STOP` or status; removal target not exactly the named artifact; pty feeding a pasted line to `read`) |
| SC-10 | A pager, editor or credential prompt appears |
| SC-11 | A forbidden command (§4.3) appears in a block or transcript, other than the declared `G25` fixture entry |
| SC-12 | `git status` after a recovery shows a path changed that the case does not name |
| SC-13 | A marker line (`SYNTHETIC-NOT-A-CREDENTIAL-`) appears in an added line of a commit other than the single sanctioned commit "Add legacy settings (intentional lab mistake)" of G10. Printing markers on screen is expected; the stop applies to commits |
| SC-14 | Added 2026-11-17. An unresolved conflict in the authority cross-check (§9.4); a state that differs from the reviewed expected state; a command that is not in the approved review; a revert conflict or a revert in progress (stop and preserve state; no automatic `git revert --abort`; see A-PL-12) |

SC-1 to SC-9 use the numbers 1–9 of the checklist list. On a stop: no further blocks, no repair outside the lab, record names only, and clean the lab per checklist §4.

### 9.4 Governance requirements for batches B9a onward (added 2026-11-17)

These are controlled execution-policy requirements adopted after the independent audit of B1–B8. They change no module text, no matrix row and no risk classification. The detailed procedure is kept outside this repository with the evidence (`GOVERNANCE-GCM-batches.md` in `.project-evidence/foundations-lab-validation/phase-4.8a-gcm-post-audit-remediation/`).

- **Mandatory artifacts per batch:** the maintainer's literal instruction (`authorization.txt`) and its SHA-256; `authority-crosscheck.txt`; preflight evidence including the raw `docker inspect`; canonical blocks with the full SHA-256 of each; transcript; input-byte log (the exact bytes sent, not the PTY echo); before and after snapshots; the final report; the updated checkpoint.
- **Authority cross-check before any mutation:** authorization, module, matrix, this plan and the safety checklist are compared for the authorized cases, scope, initial and final state, commit count, allowed mutations and prohibited operations. An unresolved conflict stops the batch before mutation; the executor never resolves it unilaterally and never runs a conflicting block "as authorized".
- **Two-phase approval for `HIGH-RISK` cases and, by this policy, for `G15` and `C09`:** Phase A prepares the safety review, verifies targets and expected transitions, records the required approval and stops. Phase B starts only after explicit maintainer approval that references the completed review (name and full SHA-256), archives that approval, re-runs the checkpoint and safety gate, and executes only the approved operation. A general batch authorization does not replace this approval.
- **Shell reconstruction** always includes the G01 block, the `unset` lines, the canonical version check and the canonical resume block.
- **Evidence addenda** are separate files that cite the original report path and its full SHA-256; historical reports are not edited.
- **Verification controls:** immediate exit statuses without altering canonical text; `grep` oracles record the real exit status (a bare count of `0` is not proof of absence); for blocks that combine staging and a commit, O-STAGED before the block, and, if the maintainer authorizes it and the canonical order is kept, a split before the commit line with a separate staged-content verification; exact commit contents verified afterwards; metadata changes reported separately from semantic Git state; object reachability treated as an inference unless verified directly.

## 10. Evidence requirements

Evidence stays outside the repository in `.project-evidence/foundations-lab-validation/` (OD-6) and follows the [template](foundations-evidence-template.md). Nothing is recorded for a case that has not run. This plan adds no evidence file and does not touch the external index.

| ID | Requirement |
| --- | --- |
| ER-1 | Run header per container: run ID, plan pin, module hash, environment class L1, fingerprint (O-FP), shell, controlled variables (`LC_ALL=C`, `TZ=UTC`), full `git --version`, role-only operator, declared deviations |
| ER-2 | One case record per case with exact commands, immediate exit codes, sanitized output, oracle values, expected and actual result, verdict basis |
| ER-3 | Extracted blocks saved with the provenance suffix `canonical`, `prose-derived`, `reference-derived` or `test-derived`; any substitution (for example the real path in the restoration block) recorded as a deviation |
| ER-4 | Isolation record (`docker inspect`), `integrity.sh` outputs before and after, parent snapshots, sanitized transcript |
| ER-5 | Reconstruction records kept separate: state rebuilt from canonical blocks is never credited as a pass of the cases that produce it |
| ER-6 | Sanitization of Git output: absolute paths from `git init`, `rev-parse`, `pwd -P` become `<LAB_ROOT>` or `<LAB_PARENT>`; commit short IDs are kept only where the case reads them; ANSI colour sequences stripped (TH-1); names, never values, for `GIT_*` variables |
| ER-7 | Naming: batch directories continue the earlier numbering as a proposal, for example `phase-4.1-gcm-pilot-g01-g03/RUN-GCM-A1-linux-001.md` (OD-G8) |
| ER-8 | A case is `PASSED` only when its matrix pass criteria are evidenced; a recovered, repaired or retried case is a new record citing the failed one |

## 11. Blockers, ambiguities, harness decisions and optional coverage

### 11.1 Confirmed blockers

| ID | Blocker | Effect |
| --- | --- | --- |
| BL-1 | No image with Git older than 2.32.0 exists, and building one needs a provenance review and network access, neither approved or done | `RUN-GCM-OLD` cannot run; G02 can be evidenced only on the accepting side (see A-PL-1) |
| BL-2 | `G17` needs a deliberately conflicting revert; OD-5 says no conditional failure is injected in this round | G17 cannot run; proposed `NOT APPLICABLE`, as `TFO-G09`, `LAS-G08` and `LAS-C07` were |
| BL-3 | No approval existed at planning time | Every batch needs its own written authorization (checklist P1); B1–B8 were authorized and executed, and later batches are blocked until their own authorization is archived |

No scenario was found that cannot run under the L1 restrictions (read-only root, tmpfs home, no network, non-root, limited processes). That statement rests on reading the module and the environment document; it is confirmed only by running B1.

### 11.2 Documentation ambiguities and source mismatches (not resolved here)

| ID | Observation | Proposed handling |
| --- | --- | --- |
| A-GCM-1 to A-GCM-5 | Already recorded in the validation plan (order-dependent `HEAD~1`; `git rm --cached` on a modified file; `.git/info/exclude`; symlink inside the lab still verifies; dubious ownership) | Handled by the guards and oracles named there |
| A-PL-1 | `GCM-G02` is one matrix row but its pass criterion differs by environment (`RUN-GCM-OLD` expects `STOP`) | Maintainer decision OD-G4 |
| A-PL-2 | `GCM-G25` deliberately changes the identity and adds a remote, which are stop conditions 4 and 3 of the checklist; the evidence template says to remove any non-synthetic identity and stop the run | Declare in the run header (SG-8); use an obviously fixture value; the stop rules apply to the real chain, not to the declared fixture |
| A-PL-3 | Checklist §4 item 4 says a nested lab is removed by "the Git module's verified Action 2", but in `GCM-G24` the nested variant fails Action 1 by design, so Action 2 cannot run on it. Item 1 of §4 also assumes non-recursive removal of directories that contain `.git` internals | Tear down fixtures by removing the container, which discards the tmpfs, and add nothing recursive. Needs approval (OD-G5) |
| A-PL-4 | Action 1 requires `git_lab_root` and `git_lab_parent` in the shell; the matrix does not say how fixtures obtain them (a symlinked lab cannot be created by the canonical setup block, because `mkdir` refuses an existing name) | Test-derived assignments, recorded as such |
| A-PL-5 | `GCM-G20` says "a lab present" without content | Minimum: the directory created by the canonical setup block and its marker; no repository needed. Test-derived |
| A-PL-6 | `GCM-G19` says "end the shell" without a method | Follow the `LAS-G10` precedent (verified SIGKILL of the lab shell from a separate exec session); the module does not prescribe a method |
| A-PL-7 | Checklist §6 lists `git revert --no-edit` (`G15`, `C09`) among the safeguards for high-risk operations, but the matrix classes both `CONTROLLED` | Matrix class used; safeguards applied |
| A-PL-8 | Plan item D11 asks for a "piped run" in addition to the pty run, while D17 forbids piping lab lines into the shell | Interpreted as piping one read-only command's output (for example into `cat`) in one case; optional |
| A-PL-9 | `GCM-G21` expects two verified repositories, but `C01` depends on `G18` only softly. A separate challenge lab would avoid the long chain, but would then not satisfy `G21` | Keep one lab (§6.1) |
| A-PL-10 | `core.excludesFile` is written in camel case by the module and listed in lower case by `git config --list` | The matrix already uses `core.excludesfile`; confirm in G05 |
| A-PL-11 | Several checks are reviewer judgments (`C02` description, `C07` real-credential statement, `C11` "nothing staged with a form that selects everything") | Evidence kind R; stated as not independent when assisted, as in `LAS-C04` |
| A-PL-12 | Added 2026-11-17. The module tells the learner to run `git revert --abort` when `git status` reports a revert in progress (step 11 closing sentence and the resume table), while this plan makes a revert conflict a stop condition (§6.3 B9b, SC-14) and `G17` is `NOT APPLICABLE` by default because no conflict is injected (OD-5) | Controlled execution-policy decision, not a module change: if an unexpected revert conflict appears, stop, preserve the state, do not run `git revert --abort` automatically, and request maintainer authorization. `G17` applicability is unchanged |
| A-PL-13 | Added 2026-11-17. Canonical blocks that combine the staged-content review and the commit (`G14`; earlier `G08`, `G09`, `G10`, `G11`) give no pause between the review and the commit | O-STAGED before the block; optionally a split before the commit line, canonical order kept, declared in the authority cross-check and authorized by the maintainer; exact commit contents verified after the commit |

### 11.3 Test-harness decisions

| ID | Decision needed | Proposal |
| --- | --- | --- |
| TH-1 | Git colours output when attached to a terminal | Keep the canonical conditions, and strip escape sequences when sanitizing; record the `TERM` value used |
| TH-2 | Oracle command forms | `GIT_*` names via `env` piped through `cut -d= -f1` and `grep '^GIT_'` (names only); O-EXCL ignores comment and blank lines; O-LOG reduces `git log --oneline` to messages |
| TH-3 | Persistent container for B1–B15 | As §6.1; checkpoint between batches |
| TH-4 | Fixture sandboxes in B17 | One fresh sub-parent per variant inside one fixture container, each with its own canonical lab, so a variant cannot contaminate the next |
| TH-5 | End of input for `G23` | Send an end-of-file from the pty, not a closed pipe |
| TH-6 | Host-side command for the Roadmap record | `git --no-optional-locks status --short`, read-only |
| TH-7 | `G26` stub | A shell function named `git` printing each version line, defined only in that shell; "missing command" is simulated by making `git` resolve to nothing in that shell; the real binary stays out of reach only for that case |
| TH-8 | Extra read-only observation `git log --oneline -2` before `G12` | Already in the matrix for G12; also used before G16 |

### 11.4 Optional coverage (not required for L1 closure)

- A near-minimum Git release and the exact 2.32.0 acceptance (gap G-2).
- An amd64 variant of the image (the current image is arm64 only).
- Cancellation of Action 2 with the lab name surrounded by whitespace, which the module says cancels.
- `git revert --abort` on an injected conflict (`G17`), only if OD-5 changes.
- Non-English locale (gap G-8) and the BusyBox environment L2.

## 12. Open decisions

| ID | Decision | Recommendation |
| --- | --- | --- |
| OD-G1 | Approve this plan and the batch structure, batch by batch | Approve B1 first; approve each later batch after reviewing the previous one |
| OD-G2 | Keep one container alive across B1–B15, or rebuild per batch | Keep it, with checkpoints; fall back to recorded reconstruction |
| OD-G3 | `GCM-G17`: record `NOT APPLICABLE` under OD-5, written into the external index by maintainer instruction when the closure is prepared | Yes, as for `TFO-G09`, `LAS-G08`, `LAS-C07` |
| OD-G4 | Can `GCM-G02` be `PASSED` from L1 alone? | Yes for the accepting side, with the missing refusal run recorded as a limitation, unless the maintainer approves an old-Git image. **Status 2026-11-17: still open.** The Git 2.43.0 accepting path was demonstrated in B1; the rejection path was not. `GCM-G02` therefore stays `PLANNED` in the external index, annotated as partially executed, until the maintainer decides OD-G4 or the rejection path is run (`RUN-GCM-OLD`); the recommendation in this cell is not applied |
| OD-G5 | Fixture teardown by container removal, and declared deviations for `G25` | Approve (A-PL-2, A-PL-3) |
| OD-G6 | Provenance review and network use for an old-Git image (`RUN-GCM-OLD`) | Defer; separate approval |
| OD-G7 | Interruption method for `G19` | Verified SIGKILL, as in `LAS-G10` |
| OD-G8 | Evidence directory naming (`phase-4.x`) | As ER-7 |
| OD-G9 | Whether any optional coverage in §11.4 is wanted | None for the first closure |
| OD-G10 | Approval procedure for the six `HIGH-RISK` cases (and, by execution policy, `G15` and `C09`) | Two-phase approval (§9.4): a separate safety review is prepared and hashed (Phase A), and the operation runs only after an actual maintainer message, written after reviewing that artifact, that names the review file and its full SHA-256 (Phase B). A safety-review document is not an approval, an executor cannot approve its own proposed mutation, and a general batch authorization does not replace Phase B. The matrix classes of `G15` and `C09` (`CONTROLLED`) are unchanged. Revision 2026-11-18: replaces the earlier wording "one explicit approval per named block" |

## 13. Recommended first batch

**B1 — pilot (G01, G02, G03), `SAFE`, one fresh L1 container, no lab and no repository created.**

Why first: all three cases are `SAFE`, they validate the baseline the other 34 depend on (pty handling, the five isolation variables, the real version gate on 2.43.0, and the outside-repository check), and they create nothing that must be cleaned.

| Item | Plan |
| --- | --- |
| Pre-flight | SG-0 to SG-4 |
| Commands | The canonical step 1 `env … /bin/sh` command, the five `unset` lines, the version-check block, and the two-line `rev-parse` block, each copied byte for byte, one at a time |
| Extra read-only observations | `GIT_*` names only (O-GITENV); `git --version`; O-FP |
| Expected | Five `GIT_*` names remain; `Git check passed: git version 2.43.0`; nonzero status and no path for `rev-parse` |
| Stop | Any condition of §6.3 B1 or SC-1 to SC-13 |
| After | If clean, keep the container as the start of `RUN-GCM-A` or remove it and rebuild the shell state in B3 (the shell state holds no repository, so reconstruction costs nothing). Then close the batch record; B2 (G26) is the natural next batch in a separate container |

This section is historical: B1 through B8 have since been executed (see the status line). The next batch is B9a (`G14` only), which starts only after its own written authorization is archived (§9.4).
