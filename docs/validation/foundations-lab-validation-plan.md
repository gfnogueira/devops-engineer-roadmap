# Foundations Laboratory Validation Plan

**Status: PLANNED. Phase 1 (planning and safety review) only.** No laboratory command from the three Foundations modules has been executed for this plan. Nothing here is a test result. Execution requires a separate, explicit maintainer authorization (see [Phase 2 entry criteria](#phase-2-entry-criteria-and-open-decisions)).

Companion documents:

- [Validation matrix](foundations-validation-matrix.md): the 85 cases.
- [Evidence template](foundations-evidence-template.md): the record format and sanitization rules.
- [Execution safety and cleanup checklist](foundations-execution-safety-checklist.md): environment gates, stop conditions, and bounded teardown.

## Purpose and scope

The three Foundations modules state that their laboratories and challenges have not been executed. This plan prepares a reproducible way to execute them in isolated Linux and macOS environments and to record trustworthy evidence, so that a later phase can replace "documentation reviewed" with "executed on these versions, with these results".

In scope (canonical English, pinned at repository commit `d7bc4805a145d78ab5886a377e8508d417c65349`):

| Module | Source SHA-256 |
| --- | --- |
| [Safe Terminal File Operations](../modules/terminal-file-operations.md) | `bda3b7ca60692ecaa54d0a9167221e515b84baeb891621e4541a409c23cfc965` |
| [Local Access and Synthetic Secrets](../modules/local-access-and-secrets.md) | `b4ac72d923ac025c4af567d7003991118aa9346535315467f0bfcefae8a556b8` |
| [Local Git Change Management](../modules/git-change-management.md) | `7453d657abced420d2416d94de7073b0e5a4355132f3956e3662c3e8019ce775` |

Out of scope: changing any module, competency record, schema, validator, or the Skill Tree; building a test harness or any script that executes laboratory commands; executing anything; promoting a translation. If a canonical file changes after this pin, every affected case must be re-reviewed before execution.

### Relationship to the formal C07 process

The maintainer runs a separate, private, gate-controlled laboratory validation process called C07, kept outside this repository, with its own harness, plans, and evidence. This plan is **not** part of it and does not replace it.

| | This plan | C07 |
| --- | --- | --- |
| Nature | Documented, human-readable case matrix and procedures, kept with the canonical content | Automated, gate-controlled harness with its own authorization gates |
| Evidence | New records created by this plan's executions | Its own records; earlier macOS records belong to an older module text and are historical |
| Authority | Plans an execution; authorizes none | Authorizes its own phases through its own gates |
| Reuse | **No C07 result may be copied into this plan's evidence, and no result from this plan counts as C07 evidence**, unless the maintainer decides so through C07's own process | Same, in reverse |

Where this plan resembles C07 (container-first Linux, a separate macOS account or VM, fail-closed cleanup), it follows the same safety direction but states its own requirements so that this repository stays usable without the workspace.

## Inventory of the canonical laboratories

The structure of every module is Learn → Practice → Build → Validate. The matrix preserves it: guided cases (`G`) are the Practice phase, challenge cases (`C`) are Build, and acceptance cases plus completion-criteria traceability are Validate. Cases `P` probe a safety claim made by the module text; they are not learner exercises (see [Probes](#probes-of-canonical-safety-claims)).

### Safe Terminal File Operations

| Item | Content |
| --- | --- |
| Objectives | O1 locate, O2 preserve, O3 diagnose, O4 protect, O5 clean up |
| Prerequisites | None. Open a terminal, type commands one at a time |
| Tools | `/bin/sh`, `env`, `pwd`, `ls`, `mkdir`, `cat`, `printf`, `cp`, `mv`, `cmp`, `rm`, `rmdir`, `test`; built-ins `cd`, `umask`, `set` |
| OS capabilities | Local Linux or macOS, ordinary user, writable personal local directory, Unix permissions, no ACL interference |
| Exercises | Starting directory; step 1 workspace; 2 synthetic input; 3 copy, rename, append, compare; 4 missing-file diagnosis and recovery; 5 overwrite protection; 6 retain; resume; cleanup |
| Challenge | Handoff for a pending deployment: two sources, backup, working copy, safe missing-file read, permission and overwrite checks |
| Validation commands | `pwd -P`, `ls -ld`, `cmp` with `$?`, `cat` status, `test`, final absence check |
| Expected outcomes | Mode `drwx------` and `-rw-------`; `cmp` status `0`; nonzero status for the missing path and for the noclobber refusal; lab absent |
| Learner evidence | Working-directory observations, comparisons, statuses, diagnoses, modes, cleanup observations (completion table O1–O5) |
| Cleanup | Named `rm -i` and `rmdir` only; final helper removes the empty lab with `rmdir`; no recursion, force, or wildcard |
| Destructive operations | `rm -i`, `rmdir`, intentional overwrite attempt, `cp -i` or `mv -i` replacement |
| Platform behavior | `ls` suffixes, shell implementation and statuses, prompt wording, `cmp` wording |

### Local Access and Synthetic Secrets

| Item | Content |
| --- | --- |
| Objectives | O1 interpret, O2 restrict, O3 diagnose, O4 separate, O5 clean up |
| Prerequisites | Terminal File Operations. No Git |
| Tools | The prerequisite's tools plus `id`, `chmod`, `grep` |
| OS capabilities | Ordinary non-administrative session, local filesystem with Unix modes, no ACL or policy that changes the outcome |
| Exercises | Step 1 identity and workspace; 2 configuration and inspection; 3 read-only policy; 4 controlled fault and recovery; 5 minimal report; resume; cleanup |
| Challenge | Support response: three supplied inputs, permission plan, controlled fault, three-fact response, marker check |
| Validation commands | `id`, `id -u`, `ls -l`, `umask`, `cat file > /dev/null` with `$?`, `grep -F -c` with `$?` |
| Expected outcomes | Modes `700`, `600`, `400`; read denied at mode `000` for a non-root user; marker count `0` with status `1` |
| Learner evidence | Before/attempt/after read record, modes, response content, marker result, cleanup (completion table) |
| Cleanup | Named `rm -i` and `rmdir`; final helper |
| Destructive operations | `chmod 400`, `chmod u-r` (intentional denial), `chmod u+r`, `rm -i` of a read-only file |
| Platform behavior | Group ownership, `ls` suffixes, root bypass, shell, `rm -i` prompts |

### Local Git Change Management

| Item | Content |
| --- | --- |
| Objectives | O1 record, O2 inspect, O3 recover, O4 protect, O5 clean up |
| Prerequisites | Terminal File Operations; Git 2.32.0 or later already installed |
| Tools | The prerequisite's tools plus `find`, `read`, and Git |
| OS capabilities | Ordinary session; local filesystem outside any repository; no network |
| Exercises | Steps 1 shell and version; 2 workspace; 3 init; 4 first records; 5 inspect; 6 staged secret and unstaging; 7 ignore rule; 8 diagnose ignore on tracked file; 9 stop tracking and history; 10 discard edit; 11 revert; 12 boundaries; resume; cleanup (two actions) |
| Challenge | `challenge-repo` with four pending changes: record the fix, protect, test the ignore claim, stop tracking, two recoveries, boundaries |
| Validation commands | `git rev-parse --show-toplevel`, `git config --list --show-origin`, `git remote -v`, `git status`, `git diff`, `git diff --staged`, `git log --oneline`, `git ls-files`, `git check-ignore -v`, `git show`, `git diff --exit-code` |
| Expected outcomes | Ten-commit guided history in the canonical order; three tracked files; no remote; only local configuration; lab removed after typed confirmation |
| Learner evidence | Version, top level, no-remote and origin observations, staged reviews, before/after observations, cleanup (completion table) |
| Cleanup | Action 1 verification, Action 2 typed confirmation and one `rm -rf` of a fixed literal directory |
| Destructive operations | `git restore <path>` (irreversible), `git rm --cached`, `git revert`, and the single recursive forced removal |
| Platform behavior | Git version and vendor build, tty-dependent log decorations, config keys written by `git init`, ownership checks, `/var` symlink on macOS |

## Platform divergence register

Each entry names where a platform difference could cause a **false pass** (the check succeeds without proving the claim) or a **false failure** (a correct run is judged wrong). The matrix cites these IDs.

| ID | Divergence | Risk | Mitigation |
| --- | --- | --- | --- |
| D01 | `/bin/sh` differs: dash (Debian family), bash 3.2 in POSIX mode (macOS), BusyBox ash (Alpine). Failed-redirection status is `2` in dash and `1` in bash | False failure if an exact status is expected | Assert only "nonzero"; record the actual value and the shell identity |
| D02 | Noclobber wording differs (`cannot create ...: File exists`, `cannot overwrite existing file`). `> /dev/null` must stay allowed under `set -C` | False failure on wording; false pass if a refusal has another cause | Classify the diagnostic (O-DIAG) and run control TFO-P04; verify `/dev/null` redirection in LAS-G03 |
| D03 | `ls -l` appends `@` (extended attributes) or `+` (ACL) on macOS and `.` (SELinux context) or `+` on Linux | False failure with an exact string compare of the mode | Compare the first ten characters only, and confirm with O-MODE-STAT |
| D04 | New files take the parent's group on BSD/macOS; on Linux they take the primary group unless the directory is setgid | False failure if a group name is assumed | Never assert a group name; record it sanitized as `<GROUP>` |
| D05 | `cmp` difference wording is `byte` on GNU and `char` on BSD; status is `1` for a difference and `2` for an error on both | False pass if only "no output" is checked | Assert the printed status and content with O-CMP; never match wording |
| D06 | Error wording and quoting differ by tool and locale. The statuses of `cat` failures are `1` on GNU and BSD | False pass if any nonzero status is accepted as the intended cause | Use `LC_ALL=C`, classify with O-DIAG, and require the same-path baseline read; control LAS-P02 |
| D07 | A root user (default capabilities) reads a mode `000` file. Docker root with `--cap-drop=ALL` loses that bypass and is denied. macOS root also bypasses | False pass for O3 if run as root; or an inverted result from a cap-dropped root | Run the guided cases as a non-root user; run LAS-P01 only in a disposable VM; the canonical text says to stop at effective ID `0` |
| D08 | `rm -i` prompt wording differs; a `0400` file may add a write-protected prompt on GNU | False failure when an automation matches exact text | Match only the trailing `?`, answer `y` manually after reading the target |
| D09 | macOS `/var` and `/tmp` are symlinks into `/private`. `pwd` and `pwd -P` differ, Git reports the physical path | False failure if a path recorded with `pwd` is compared with `pwd -P` | Record paths only from `pwd -P`, as the modules do |
| D10 | macOS attaches `com.apple.provenance` or similar attributes and may show `@` | False failure in mode compares | Same as D03; record the suffix as an observation |
| D11 | `git log --oneline` shows `(HEAD -> main)` decorations only on a terminal; `git revert` and `git commit` can open an editor if `GIT_EDITOR` is lost | False failure on format | Compare message text and order only; run through a real pseudo-terminal and also record a piped run |
| D12 | `git init` writes platform-specific keys (`core.ignorecase` and `core.precomposeunicode` on macOS filesystems, `core.filemode`) | False failure if the exact key list is expected | Assert origin only (`file:.git/config`) and a non-empty list |
| D13 | Git versions: Apple Git adds a suffix such as `(Apple Git-nnn)`; a distribution can ship a Git older than 2.32.0; `/usr/bin/git` on macOS may open an installation dialog | False failure of the gate; false pass of the gate if stubbed | Real binary in G02, stubs only in G26; record the exact string; the old-Git variant expects `STOP` |
| D14 | Git refuses a repository owned by another user ("dubious ownership"); the isolation prevents setting `safe.directory` | False failure in containers with bind mounts or `sudo` | Never bind-mount; run as the owner of the lab |
| D15 | `core.excludesFile /dev/null` does not remove `.git/info/exclude` from the init template, and a distribution template could add patterns | False pass or failure of ignore cases | Oracle O-EXCL after every `git init` |
| D16 | Git and utility messages are localized by locale | False failure on wording | `LC_ALL=C` for execution; PT-BR locale is a separate optional variant (gap G-8) |
| D17 | `read -r` in the cleanup reads from standard input; a harness that pipes lab lines into the shell lets `read` consume the next script line | Catastrophic false result, or an unintended answer to the confirmation | Drive every block through a real pseudo-terminal, one block at a time; never feed a multi-line script to the lab shell |
| D18 | Pagers and editors: the modules set `GIT_PAGER=cat` and `GIT_EDITOR=true` | Hang or editor launch if lost | Verify with O-GITENV in G01 and after each resume |
| D19 | `ls -l` timestamps and times differ in every run | Noise | Do not compare timestamps; sanitize or omit |
| D20 | `stat` flags differ (`stat -c '%a'` GNU, `stat -f '%Lp'` BSD); hash tool is `sha256sum` or `shasum -a 256` | Wrong oracle on one platform | Use the per-platform forms in O-MODE-STAT and keep them read-only |
| D21 | `/tmp` is sticky and world-writable; `$TMPDIR` on macOS is per user | Lab parent shared or predictable | Create the parent with mode `700`, owned by the test user, never directly in a shared directory |
| D22 | Default macOS filesystems are case-insensitive | None expected (all names are lowercase and distinct) | Recorded for completeness |
| D23 | Bind mounts and network or virtualization filesystems (virtiofs, 9p, NFS, FAT) alter modes, ownership, or symlink behavior | False failure or false pass on every permission case | No bind mounts: the lab lives on the container's own filesystem or tmpfs |
| D24 | `umask` prints `0077` or `077` depending on shell | False failure on exact text | Compare numerically |
| D25 | `ls -a` ordering depends on locale; with some locales dot-names sort among others | False failure on an ordered compare | Compare as a set, not a sequence |

## Oracle recipes

Oracles are **independent, read-only** checks the validator adds so that a pass does not rest on the command under test alone. They are not canonical commands and never modify the lab. They are recorded with the case.

| ID | Recipe |
| --- | --- |
| O-FP | Environment fingerprint, once per run: OS name and release (`uname -sr`, never `uname -a` because it prints the host name); macOS `sw_vers -productVersion`; Linux the `PRETTY_NAME` line of `/etc/os-release`; the architecture (`uname -m`); the resolved `/bin/sh` implementation and version when obtainable; versions of Git and the userland (`cmp --version` and `ls --version` on GNU, the OS version on BSD) |
| O-CMP | Content equality with no helper file: `printf '%s\n' <expected lines> \| cmp - <path>` and record the status. Used to prove an "unchanged" input against its *specified text*, not only against a backup that could itself have changed |
| O-MODE-STAT | Numeric mode and class: Linux `stat -c '%a' <path>`; macOS `stat -f '%Lp' <path>`. Owner and group names are never recorded |
| O-ID | Record only whether the effective user ID is zero (`id -u`) |
| O-SNAP | Parent-directory snapshot before and after a lab run: the names from `ls -A <parent>`, plus the content of a sentinel file placed next to the lab by the validator. Detects out-of-lab writes and wrong deletions |
| O-TREE | Name-only recursive listing of a fixture before and after a cancelled removal (`find <fixture> -print`), compared for equality |
| O-DIAG | Classify captured error text under `LC_ALL=C` as `MISSING` ("No such file or directory"), `DENIED` ("Permission denied"), or `NOCLOBBER` ("File exists", "cannot overwrite", "cannot create"). Supporting evidence only; the status and the state are primary |
| O-GITENV | List only the **names** of environment variables beginning `GIT_` (never their values, which could hold a real identity) |
| O-VER | Record the full `git --version` string and the parsed major and minor |
| O-CFG | `git config --list --show-origin` captured; assert a non-empty list and that every line starts with `file:.git/config`; values of identity keys sanitized |
| O-EXCL | After every `git init`: the non-comment lines of `.git/info/exclude` must be empty |
| O-LOG | `git log --oneline` reduced to messages in order (short IDs and decorations dropped) and compared with the expected list |
| O-GITID | `git log --format='%an <%ae> %cn <%ce>'` shows only the synthetic identity |
| O-STAGED | `git diff --staged` immediately before a commit contains no line with `SYNTHETIC-NOT-A-CREDENTIAL-` added by that commit, and `git diff --staged --name-only` lists only the intended paths |
| O-IGN | `git check-ignore -v <path>` printed output and status, taken for a path that exists inside the repository |
| O-HIST | History reads: `git log --oneline -- <path>`, `git show <commit>:<path>`, and an added-line scan `git log -p <base>..HEAD` reduced to lines beginning `+` that contain the marker (expected zero for commits the learner made after the supplied ones) |

## Reference solutions for the challenges

The canonical challenges deliberately give no command recipe. For reproducible validation the validator needs **one** feasible solution. The sequences below are derived by this plan, are **not canonical content**, and must be reviewed before use. The acceptance checks in the matrix are independent of the commands used, so a learner's different valid solution can be judged by the same criteria. Each command is run manually, one at a time, in the lab shell (`umask 077` and `set -C` active), after predicting the result. Placeholders in angle brackets are read from earlier output.

**R-TFO** (from the lab root):

```text
R-TFO-1  mkdir ./challenge && mkdir ./challenge/source ./challenge/backup ./challenge/output
         printf '%s\n' 'package=demo' 'check=pending' > './challenge/source/release checklist.txt'
         printf '%s\n' 'package=demo' 'check=obsolete' > './challenge/source/earlier draft.txt'
R-TFO-2  cat './challenge/source/release checklist.txt' './challenge/source/earlier draft.txt'
         cp -i './challenge/source/release checklist.txt' './challenge/backup/release checklist.txt'
         cmp './challenge/source/release checklist.txt' './challenge/backup/release checklist.txt'
R-TFO-3  cp -i './challenge/source/release checklist.txt' ./challenge/output/draft.txt
         mv -i ./challenge/output/draft.txt './challenge/output/release ready.txt'
         printf '%s\n' 'review=approved' >> './challenge/output/release ready.txt'
         cat './challenge/output/release ready.txt'; ls -a ./challenge/output
R-TFO-4  cd ./challenge/output
         cat './source/release checklist.txt'; printf 'Read status: %s\n' "$?"
         pwd -P; ls -a ..
         cat '../source/release checklist.txt'; cat "$lab_root/challenge/source/release checklist.txt"
         (then the guarded return to "$lab_root" from the canonical recovery block)
R-TFO-5  ls -l './challenge/source/release checklist.txt' './challenge/output/release ready.txt'
         printf '%s\n' 'wrong replacement' > './challenge/source/release checklist.txt'; printf 'Overwrite status: %s\n' "$?"
         cmp './challenge/source/release checklist.txt' './challenge/backup/release checklist.txt'
         cat './challenge/source/earlier draft.txt'
```

**R-LAS** (from the lab root; the supplied-input block has already run):

```text
R-LAS-1  id; ls -ld ./challenge ./challenge/private ./challenge/reports
         ls -l ./challenge/private/service.conf ./challenge/private/request.txt ./challenge/private/diagnostic-draft.txt
         chmod 400 ./challenge/private/service.conf
         ls -l ./challenge/private/service.conf
R-LAS-2  cat ./challenge/private/service.conf > /dev/null; printf 'Baseline read status: %s\n' "$?"
         chmod u-r ./challenge/private/service.conf
         ls -l ./challenge/private/service.conf
         cat ./challenge/private/service.conf > /dev/null; printf 'Restricted read status: %s\n' "$?"
         chmod u+r ./challenge/private/service.conf
         ls -l ./challenge/private/service.conf
         cat ./challenge/private/service.conf > /dev/null; printf 'Recovered read status: %s\n' "$?"
R-LAS-3  printf '%s\n' 'service=demo-worker' 'check=config-readable' 'credential=omitted' > ./challenge/reports/response.txt
R-LAS-4  ls -ld ./challenge ./challenge/private ./challenge/reports; ls -l ./challenge/reports/response.txt
         cat ./challenge/reports/response.txt
         grep -F -c 'SYNTHETIC-NOT-A-CREDENTIAL-' ./challenge/reports/response.txt; printf 'Marker-search status: %s\n' "$?"
         (then O-CMP of the three inputs against their supplied text)
```

**R-GCM** (inside `challenge-repo`; the supplied setup block has already run; `<id>` values come from `git log --oneline`):

```text
R-GCM-1  git log --oneline; git ls-files; git status; git diff
         cat ./onboarding-draft.txt ./deploy-summary.txt
R-GCM-2  git diff ./release-notes.txt
         git add ./release-notes.txt
         git diff --staged
         git commit -m 'Fix health-check path in release notes'
R-GCM-3  git status; cat ./deploy-summary.txt      (no staging of deploy-summary.txt or onboarding-draft.txt)
R-GCM-4a git ls-files; git status
         git check-ignore -v ./cache-settings.conf; printf 'check-ignore status: %s\n' "$?"
R-GCM-4b git rm --cached ./cache-settings.conf
         git status; git diff --staged --stat
         git commit -m 'Stop tracking cache settings file'
         git ls-files; cat ./cache-settings.conf
R-GCM-4c git log --oneline -- ./cache-settings.conf
         git show <import-id>:cache-settings.conf
R-GCM-5a printf '%s\n' 'step-3=untested-idea' >> ./rollback-plan.txt
         git diff ./rollback-plan.txt
         git restore ./rollback-plan.txt
         git status; cat ./rollback-plan.txt
R-GCM-5b git status                                  (no tracked file may have pending changes)
         git revert --no-edit <fix-id>
         git log --oneline
         cat ./release-notes.txt
         git log --oneline -- ./release-notes.txt
         git show <revert-id>
         git diff --exit-code <id-before-fix> HEAD -- ./release-notes.txt; printf 'Comparison status: %s\n' "$?"
R-GCM-6  git rev-parse --show-toplevel; git remote -v; git config --list --show-origin
R-GCM-7  git ls-files; cat each remaining file; git log --oneline; O-HIST with <base> = the "Ignore cache settings" commit
```

`<id-before-fix>` is the "Ignore cache settings" commit, the one recorded just before the fix.

## Probes of canonical safety claims

Cases with `P` in the matrix verify claims the modules make about their own safety controls (for example "the final helper removes nothing when the recorded path is empty"). They are not new learner exercises and do not extend the curriculum. They run only in separate fixture sandboxes, never in a lab that is needed for a later case, and use the canonical blocks verbatim. They exist because a safety guard that was never shown to refuse is not validated by a run in which it was never triggered. Each needs the same approval as the rest of Phase 2. Four conditional cases (`TFO-G09`, `LAS-G08`, `LAS-C07`, `GCM-G17`) describe recovery paths that a correct run never takes; they are executed only if the maintainer approves a deliberate, lab-owned fault injection (decision OD-5), otherwise they are recorded `NOT APPLICABLE` with the reason.

## Execution environments

### Shared requirements (all environments)

- No production resource, no real credential, no network need, no access to unrelated repositories, and no write outside a designated disposable laboratory directory.
- The lab parent is created by the validator, owned by the test user, mode `700`, outside any Git repository, and **never** inside the Roadmap repository or any workspace directory.
- Only the synthetic values defined by the modules are used. No real name, email, host name, or token enters a command, a fixture, or an evidence record.
- No privileged operation, except the single approved probe `LAS-P01`, which runs in a disposable VM.
- Recursive deletion occurs in exactly one canonical place: `rm -rf ./git-change-management-lab`, after the module's verification and typed confirmation. All other removals are named, non-recursive removals. Environment teardown follows the [checklist](foundations-execution-safety-checklist.md) and also avoids recursion.
- The lab is driven through a real pseudo-terminal, one block at a time, by a human or by an operator following this plan. No script is written that replays lab commands (D17).
- `LC_ALL=C` and a fixed `TZ` are set in the outer environment before the lab shell starts, and are recorded as controlled variables.

### Linux

| Option | Use | Assessment |
| --- | --- | --- |
| **L1 container** (recommended primary) | Every case except `LAS-P01` | Faithful for the filesystem, permission, `chmod`, noclobber, utility, and Git behavior the modules exercise, provided the lab lives on the container's own writable layer or a tmpfs, with no bind mount (D23). A container shares the host kernel, so it is acceptable for a non-root user with no secrets and no network, and it is **not** a boundary for privileged tests |
| **L2 second image** (optional) | Portability claims of POSIX syntax | A BusyBox/musl image (BusyBox `ash`, `cmp`, `ls`) tests the claim of no GNU-only flags. Run the same cases; divergences are recorded, not fixed |
| **L3 old-Git image** (recommended, narrow) | `GCM-G02` only | An image whose packaged Git is older than 2.32.0 shows the real version gate refusing. Acceptance of exactly 2.32.0 cannot be shown without building that release from source, which needs a provenance review (gap G-2) |
| **VM** (required for one case) | `LAS-P01` | A disposable Linux VM isolates the uid-0 probe at the hypervisor boundary. A rootless user-namespace container is an acceptable alternative if the maintainer approves it. Root inside a default container with default capabilities is not recommended even without mounts |

Container controls (illustrative; to be finalized and reviewed at the Phase 2 gate, not executed now): an image pinned by digest after a provenance review; a non-root user; no network; all capabilities dropped; no new privileges; a read-only root filesystem with a tmpfs home owned by the test user and mode `700`; no volume or bind mounts; no container socket; no host environment or credential passed through; resource and process limits; a throwaway container removed after evidence extraction. Evidence leaves through one extraction step, not a shared mount. A fresh container is started for each run in the matrix, so no state leaks between runs. Docker Desktop on macOS runs containers in a Linux VM; that is acceptable for L1 because the lab stays inside the container, and it demonstrates nothing about macOS.

Is a container sufficient? For all 84 non-VM cases, yes, under the controls above; the container's ext4 or tmpfs filesystem honors modes, ownership, and the Git behavior studied. It is insufficient only for the root-bypass probe (D07), which needs a VM, and it says nothing about ACL, SELinux, or organization-policy interference (gap G-4).

### macOS

A Linux container does **not** validate macOS: the shell (bash 3.2 as `/bin/sh`), BSD utilities, Apple Git, and the filesystem all differ. macOS cases run on macOS.

| Option | Description | Assessment |
| --- | --- | --- |
| **M2 macOS VM** (preferred) | A disposable macOS guest with snapshot reset | Strongest isolation and a pristine, repeatable state. The home directory is itself disposable, so the canonical "go to your home directory" step can be followed verbatim. Tooling and licensing are candidates only and need review before use |
| **M1 dedicated user account** (minimum for all cases) | A new standard (non-administrator) macOS account used only for the validation, with its own home | An ordinary account cannot modify other users' private files, so the damage a wrong deletion could do is bounded to its own home. Satisfies the canonical home-directory step. Requires deleting the account afterwards, an administrative act outside the lab by the maintainer |
| **M0 temporary directory** (limited) | A `mktemp -d` parent in the maintainer's account, created with mode `700` | Acceptable only for `SAFE` and `CONTROLLED` cases, as rehearsal or recorded evidence flagged `env=M0` with the deviation (the starting directory is the temporary parent, not the home). **Not acceptable for `HIGH-RISK` cases** and never for the Git cleanup removal or the `chmod` cases without explicit per-block supervision, because the maintainer's real files share the account and the filesystem |

Eligibility by classification:

| Classification | M0 temp dir | M1 account | M2 VM | Supervision |
| --- | --- | --- | --- | --- |
| SAFE | allowed | allowed | allowed | None beyond the checklist |
| CONTROLLED | allowed with sentinel snapshots | allowed | allowed | The operator reads each block before running it |
| HIGH-RISK | not allowed | allowed with per-block approval | allowed with per-block approval | Explicit approval of every destructive or permission-changing block; the checklist's pre-checks recorded first |

Other macOS notes: the first `git` call on a machine without developer tools can open an installation dialog (D13); no network cut is available at the account level, so the network is not isolated on M1 (gap G-10), which is acceptable because no lab command uses the network and `GIT_TERMINAL_PROMPT=0`; Desktop, Documents, and removable volumes trigger privacy prompts and must not be used as lab parents; extended attributes may add `@` (D10).

## Risk analysis by module

### Terminal File Operations

| Topic | Concern | Where it could mislead | Cases |
| --- | --- | --- | --- |
| Path resolution; relative versus absolute | The failure in step 4 is a wrong starting directory, not a missing file | False pass if the diagnosis is not tied to `pwd -P` and a directory listing | G06, G07, C04 |
| Quoting and spaces | Unquoted spaced names split into arguments | False pass when the spaced file merely exists; assert intact names and content | G04, C01, C05 |
| Creation, removal, recursive cleanup | Cleanup uses named removals only | A wildcard or recursive form would pass a check of "absent" while deleting more; O-SNAP catches collateral loss | G13, G14, C07 |
| `ls` behavior | Suffixes, ordering, columns | Exact-string mode compares fail (D03); ordered compares fail (D25) | G03, G04, C05 |
| `cmp` behavior and exit codes | Silent `0` also holds for two empty files | False pass; always add O-CMP against the specified text (FP-4) | G05, G08, C02, C05 |
| GNU versus BSD utilities | Wording and flags differ | The modules use POSIX forms; the L2 image tests that claim | D01, D05, D06 |

### Local Access and Secrets

| Topic | Concern | Where it could mislead | Cases |
| --- | --- | --- | --- |
| Modes and `chmod` | Numeric modes cannot be read from `ls` letters | Mode letters decoded wrongly; add O-MODE-STAT | G03, G04, G06 |
| Denial after removing read | The denial is only real for a non-root user on a mode-enforcing filesystem | False pass when a read fails for another reason (missing path, wrong cwd); false failure on wording | G05, C03, P02 |
| Linux versus macOS | Same bits, different group inheritance, suffixes, and root behavior | Group assumptions (D04); suffixes (D03) | G03, G05 |
| Root versus non-root | Root bypasses the mode | The expected denial would be absent; this is the canonical environment-limited branch and must not be reported as a pass | G01, P01 |
| Ownership | The owner may restore their own read bit | A different owner (bind mount) breaks recovery (D23) | G06, G10 |
| Secret redaction | A synthetic token is printed on purpose by some commands | Evidence must keep the synthetic marker, but never a real-looking token; see the template's rules | all LAS evidence |
| Disclosure | The marker check proves one literal absent, nothing more | A `0` count with a non-`1` status is an error, not a pass (FP-5); a full-content review is also required | G07, C04, C05, P03 |

### Git Change Management

| Topic | Concern | Where it could mislead | Cases |
| --- | --- | --- | --- |
| Git version | 2.32.0 minimum; distribution and Apple builds vary | Stub-only checks prove logic, not the real gate (FP-8) | G02, G26 |
| Repository boundary | Commands act on whichever repository Git finds upward | A lab created inside a repository (even the Roadmap) would commit into it; the parent check and the checklist forbid it | G03, G04, G05, G24 |
| Staging and unstaging | `git restore --staged` versus `git restore` | A mistyped omission of `--staged` destroys work silently | G08, G13 |
| `git rm --cached` | A missing `--cached` deletes the working file; relies on Git accepting a modified working copy | A refusal on one Git version is a real finding (A-GCM-2) | G11, C06 |
| Local modifications, history, `HEAD~1`, `HEAD~2` | Positional references are only valid at one moment | A trivially true comparison; guard by checking the log first (FP-6) | G12, G16, C09 |
| `git revert` | Clean tracked tree needed, commit added not removed | An editor opening or a conflict | G15, C09 |
| Working-tree cleanup | The one recursive forced removal | Wrong target or unintended answer to the prompt (D17) | G21–G25 |
| The real Roadmap repository | Must never be touched | The sandbox is not under it; the checklist records a pre- and post-run status of the Roadmap checkout as read-only evidence |  every Git case |

### Explicit false-pass and false-failure register

| ID | Kind | Situation | Guard |
| --- | --- | --- | --- |
| FP-1 | False pass | A permission-denial read "fails" for a different reason | Same-path baseline success, `000` mode, O-DIAG `DENIED`, LAS-P02 control |
| FP-2 | False pass | Run as root; the read succeeds and is mistaken for success of the guard | O-ID gate; BLOCKED when uid is `0`; LAS-P01 only as an environment-limited demonstration |
| FP-3 | False pass | Noclobber "refuses" only because the file or directory is not writable | TFO-P04 control; the lab file is mode `600` and owned by the user |
| FP-4 | False pass | `cmp` status `0` on two empty files | O-CMP against the specified text |
| FP-5 | False pass | Marker count `0` printed but `grep` status `2` | Require status `1`; control LAS-P03 |
| FP-6 | False pass | `git diff --exit-code` status `0` because the two sides are the same commit | Check `git log --oneline` and the identity of `HEAD` and `HEAD~2` first |
| FP-7 | False pass | `git check-ignore` status `1` for a path outside the repository | Run only for a path inside the repository that exists |
| FP-8 | False pass | The version gate "passes" through a stub | Stubs only in G26; G02 uses the real binary |
| FP-9 | False pass | `--show-origin` prints nothing and the "all lines local" test passes vacuously | Require a non-empty list and the top level |
| FP-10 | False pass | Cleanup "succeeds" because the path is absent after a wrong removal | O-SNAP of the parent and sentinel intact |
| FF-1 | False failure | `@`, `+`, or `.` suffix on a mode | D03 handling |
| FF-2 | False failure | Packaged Git older than 2.32.0 | Choose an image with a suitable Git, or use the old-Git variant deliberately |
| FF-3 | False failure | "Dubious ownership" from a mounted or foreign-owned directory | D14, no bind mounts |
| FF-4 | False failure | `read -r` consumed an automated line | D17, real pseudo-terminal |
| FF-5 | False failure | Log decorations differ off a terminal | D11 |
| FF-6 | False failure | A localized message | `LC_ALL=C` |
| FF-7 | False failure | `rm -i` prompt wording | D08 |
| FF-8 | False failure | Directory ordering | D25 |

## Evidence strategy

Evidence follows the [evidence template](foundations-evidence-template.md): one record per case with the case ID, operating system and version, shell, tool versions, UTC timestamp, exact command, exit status, sanitized output, expected result, actual result, status, and notes. The status vocabulary is `PLANNED`, `EXECUTED`, `PASSED`, `FAILED`, `BLOCKED`, and `NOT APPLICABLE`; all 85 cases are `PLANNED` in Phase 1. Records are stored outside this repository in a private location chosen by the maintainer (decision OD-6), because they derive from machines that have personal information. Only a reviewed, sanitized summary may later be added to the repository, by a separate authorized change.

## Translation parity

The three PT-BR modules at `docs/locales/pt-BR/modules/` are machine-assisted drafts, recorded as `draft` in their overlays, and **remain draft**. This plan does not review, edit, or promote them. At the pin above, the fenced code blocks of each PT-BR module are byte-identical to its canonical module (checked by hashing the concatenated fenced blocks of each pair), and the counts of lines beginning with `#` match (30, 31, and 39). One execution of the canonical commands therefore covers both languages for commands and expected output text. Prose claims in the PT-BR drafts, such as checkpoints worded in Portuguese, are not executed and are not validated by this plan.

After a future execution, a human reviewer should compare each PT-BR checkpoint statement with the recorded evidence before any promotion is even considered. One sequencing hazard: the overlays record a hash of the canonical file, so any later canonical edit (for example, updating the "not executed" banners with real results) makes all three translations report as outdated until they are refreshed. Plan that change, and the translation refresh, together.

## Coverage review

### Traceability from canonical elements to cases

| Canonical element | Cases |
| --- | --- |
| TFO starting directory; steps 1–5; guided cleanup | G01; G02, G03; G04; G05; G06, G07; G08; G12–G14 |
| TFO step 5 recovery guidance | G09 (conditional) |
| TFO step 6 retain | No command; nothing to validate |
| TFO resume (placeholder, state table) | G10, G11 (state rows "original and backup exist" and "draft or handoff exists" only; see G-1) |
| TFO challenge items 1–5, deliverables and acceptance, challenge cleanup | C01–C05, C06, C07 |
| TFO questions Q1–Q6 and completion rows O1–O5 | Not executable; rows trace to the cases above, see below |
| LAS steps 1–5; guided cleanup | G01, G02; G03; G04; G05, G06; G07; G11–G13 |
| LAS step 5 repair guidance | G08 (conditional) |
| LAS resume and state table | G09, G10 (row "000 after the controlled fault"), C07 (row "challenge `000` or `200`"); other rows see G-1 |
| LAS challenge inputs, items 1–5 | C01; C02; C03; C04; C05; C06 |
| GCM steps 1–12; resume; cleanup actions 1 and 2 | G01–G02; G03–G04; G05; G06; G07; G08; G09; G10; G11–G12; G13; G14–G16 (G17 conditional); G18; G19, G20; G21, G22 |
| GCM challenge setup, items 1–6, acceptance | C01; C02; C03; C04; C05–C07; C08, C09; C10; C11 |
| GCM version table (feature versions) | G02, G26; features proven by running (`restore`, `--initial-branch`, `GIT_CONFIG_GLOBAL`, `--show-origin`) |

Completion-criteria traceability (module, objective → cases whose evidence feeds it): TFO O1 G01, G06, G07, C04; O2 G04, G05, C01–C03, C05; O3 G06, G07, C04; O4 G03, G04, G08, C05; O5 G12–G14, C07. LAS O1 G01, G03, C02; O2 G02–G04, C02; O3 G05, G06, C03; O4 G07, C04, C05; O5 G11–G13, C06. GCM O1 G05–G07, C03; O2 G06, G07, C02; O3 G08, G13, G15, C08, C09; O4 G08–G12, C04–C07; O5 G01–G05, G18, G21, G22, C10.

### Coverage gaps

| ID | Gap | Treatment |
| --- | --- | --- |
| G-1 | Only one interruption point per module is simulated; most rows of the three "resume" state tables are not exercised | Accept for the first execution, or add variants in Phase 2 (decision OD-3) |
| G-2 | Acceptance exactly at Git 2.32.0 is not testable without a source build | Rejection is covered by L3; acceptance is covered at the versions shipped by the chosen images and macOS |
| G-3 | macOS root behavior is not covered (needs administrator rights) | `LAS-P01` is Linux-VM-only; stated as not applicable on macOS |
| G-4 | ACL, SELinux, and organization-policy interference, named by the modules as stop conditions, are not exercised | Recorded; would need a dedicated environment |
| G-5 | Knowledge-assessment questions and the self-assessed completion tables are not machine-executable | The cases produce the evidence those tables require; the answers are not validated |
| G-6 | One macOS version and one image family per run | Versions are recorded; other versions are future work |
| G-7 | PT-BR prose checkpoints are not executed | See translation parity |
| G-8 | Non-English locale behavior (Git and utility messages for PT-BR learners) is not covered | Optional variant; `LC_ALL=C` is used for the controlled run |
| G-9 | Challenge validation uses one reference solution | Acceptance checks are solution-independent |
| G-10 | No network isolation on macOS M1 | Labs use no network; observed |

### Canonical-source issues (reported separately, not corrected)

These are observations about the canonical English modules. None has been edited. Each is a candidate for a separate, reviewed curriculum change.

| ID | Module | Observation | Effect on validation |
| --- | --- | --- | --- |
| A-TFO-1 | Terminal | Step 4 says to run `cd` separately before the remaining lines, but they appear in one fenced block | A copy-paste of the block changes behavior; the plan runs `cd` alone |
| A-TFO-2 | Terminal | Challenge item 4 requires "a relative path you choose" and gives no failing command, so the exact failing path is learner-defined | Acceptance can only be checked by evidence review, not by an exact expected string |
| A-TFO-3 | Terminal | The conditional recovery guidance (step 5) and the resume state table give actions without observable acceptance criteria and cannot be exercised without a fault | Cases are conditional (G09) or partially covered (G-1) |
| A-LAS-1 | Local access | Challenge item 2 says to change "only that file's owner read bit", but the resume table says the chosen fault may leave the file at `000` or `200`; `200` also changes other bits | A learner can follow the table's own wording and leave the stated rule; `LAS-C07` reflects the table |
| A-LAS-2 | Local access | Challenge item 3 does not fix the response lines, only the "three authorized facts" | The expected result is not mechanically testable; the plan uses the guided report's three lines as the reference and a content review for others |
| A-LAS-3 | Local access | Checkpoints and acceptance use numeric modes (`700`, `600`, `400`), but the only inspection commands taught print letters | The numeric claim needs `stat`, which is outside the modules' toolset; the plan adds it as an oracle |
| A-LAS-4 | Local access | The module says to stop if the effective ID is `0`, but default container images run as root | A learner in a container is told to stop with no guidance on obtaining an ordinary user |
| A-GCM-1 | Git | `git show HEAD~1:legacy.env` is valid only immediately after the "Stop tracking" commit | Order-dependent; guarded in G12 by checking the log |
| A-GCM-2 | Git | Steps 9 and the challenge rely on `git rm --cached` accepting a file that has an uncommitted working-tree change, without stating that Git permits it | Needs confirmation on the minimum version and the current one |
| A-GCM-3 | Git | The text says `core.excludesFile /dev/null` leaves "only the rules you write", but `.git/info/exclude` from the init template is not neutralized | A distribution template could add patterns; the plan adds O-EXCL |
| A-GCM-4 | Git | Cleanup Action 1 still reports "Verification passed" when a symbolic link exists inside the lab; only the human checkpoint says to stop | G25 documents this; removal does not follow links, so the risk is low |
| A-GCM-5 | Git | "Dubious ownership" checks (Git 2.35.2 and later) are not mentioned; the isolation prevents setting `safe.directory` | A learner in a shared or container setup can be blocked without an explanation |
| A-X-1 | All | Every module's "not executed" banner, the Git version table's "Practically tested: None", and the learning path wording will become stale after execution | A later authorized change must update them, together with the translation refresh (see Translation parity) |

## Phase 2 entry criteria and open decisions

Phase 2 may begin only after the maintainer reviews this plan and decides the items below. Nothing here is decided by this document.

| ID | Decision | Recommendation |
| --- | --- | --- |
| OD-1 | macOS environment | M1 dedicated account at minimum; M2 VM if licensing and tooling pass review; M0 for rehearsal of SAFE/CONTROLLED cases only |
| OD-2 | Who drives the pseudo-terminal | A human operator, or an assisted manual session, one block at a time; no replay script |
| OD-3 | Interruption and resume coverage | One interruption point per module, extended later |
| OD-4 | The root-bypass probe `LAS-P01` | Approve only in a disposable VM or rootless user-namespace container |
| OD-5 | Deliberate fault injection for the four conditional cases | Do not inject by default; record `NOT APPLICABLE` |
| OD-6 | Where evidence is stored | A private location outside the repository; sanitized summary only later |
| OD-7 | Provenance of images and (optionally) a source-built Git 2.32.0 | Pin by digest after review; skip the source build unless needed |
| OD-8 | Link to the formal C07 process | None unless C07's own gate decides to adopt results |

Recommended Phase 2 sequence: (1) maintainer review and decisions; (2) environment preparation and a fingerprint-only smoke run on Linux L1, with no lab command; (3) Linux execution of `SAFE`, then `CONTROLLED`, then supervised `HIGH-RISK` cases, each run in a fresh container; (4) the L3 old-Git gate and, if approved, `LAS-P01` in a VM; (5) macOS environment preparation and a fingerprint-only smoke run; (6) macOS execution in the same order; (7) review of evidence, the divergence register, and the canonical issues, and a separate authorized proposal for any curriculum or banner change. Each step needs its own authorization; completion of one does not authorize the next.
