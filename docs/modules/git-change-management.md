# Local Git Change Management

## Overview

**Competency:** `git-change-management` · **Level:** Foundations · **Assessment revision:** 1

You maintain a few notes for a fictional `demo-service`. You need to record selected changes, check exactly what each record will contain, undo three ordinary mistakes, and keep a fake credential out of new records. You also investigate a claim that an ignore rule made an already recorded file safe.

Everything happens in a disposable directory on your own computer. No remote repository, account, network access, or real credential is involved. Branches, remotes, and history rewriting are deliberately outside this module.

Follow **Learn → Practice → Build → Validate**: read the concepts, complete the guided lab in `guided-repo`, solve a different situation in `challenge-repo`, then review your evidence against every completion criterion before cleanup. The goal is to predict and verify what Git will do, not to memorize commands.

**Verification status:** the resources listed below were opened and their relevant content inspected on **2026-11-13**. **Validation is partial, and this module is not fully validated.** An earlier revision of this module was executed on **Linux only**, in a disposable container (Ubuntu 24.04, Git 2.43.0, `dash`); the [execution plan](../validation/git-change-management-linux-l1-execution-plan.md), last revised on 2026-11-17, describes that partial run and the cases still pending. Its authoritative results record is kept outside this repository, so exact case counts are not repeated here. The module was **revised afterwards** (corrected Git safety guidance and recovery instructions, 2026-11-23). A follow-up **targeted check** then ran on the same Linux setup and Git version, covering only the behaviors that revision changed: the lab shell's variable cleanup and its check for unexpected `GIT_*` variables, the same cleanup when resuming a session, unstaging with `git restore --staged`, and recovery before the first commit. Those checks passed, and they led to one wording correction (an error message). They were recorded in the maintainer's separate evidence files (P46 Batch A and Batch B, P47 for the cleanup check and P48 for the challenge check, both described below), which are not part of this repository, and they ran before this status note and that wording correction were added. They did **not** execute the rest of the current text. A second targeted check (P47) then exercised the **cleanup procedure** on the same Linux setup: the verification action, its refusals of unsafe or altered laboratories, cancelling the removal prompt in three ways, and one removal of a disposable laboratory, followed by a refused repeat. These P47 runs used laboratories **rebuilt for the test** rather than produced by completing the challenge, and a script typed the answers through a pseudo-terminal; a person did not. The removal check was accepted after its automated checker misread its own output; the saved transcript shows nothing unintended was removed. One finding stays open: a symbolic link inside the laboratory is listed but does not stop the verification, so the checkpoint after it is what stops you. A third check (P48) then ran the challenge from its supplied setup to its last item, using a documented reference solution rather than a learner's own work, in a new laboratory on the same setup (the guided lab was not run first). The reference-derived steps and the acceptance criteria were met. The quality of written answers (the description in item 1 and the real-credential statement in item 4) was not assessed. The cleanup procedure was then run on a verified copy of that completed laboratory and passed; a script typed the confirmation through a pseudo-terminal, not a person. **Not yet validated:** the complete current text (most of the guided lab, as currently written, has not been re-run), the challenge as solved by a learner and a learner's written answers, cleanup typed by a person or in the same shell session as the challenge, macOS, other Linux environments and Git versions, and the knowledge questions. Checkpoints describe expected results, not recorded transcripts. A shell syntax check does not establish that a Git command behaves as described.

## Why It Matters

Infrastructure and delivery work is mostly changes to text: configuration, scripts, checklists, and documentation. Git records such changes as a history that other people and automated systems later rely on. A record is useful when it contains one understandable change and nothing else.

Two ordinary mistakes cause most early trouble. The first is recording more than you intended, such as an unrelated draft or a credential that happened to be in the same directory. The second is assuming that a later correction erased the earlier record. Git is designed to keep history; that is what makes recovery possible, and also why a recorded secret must be treated as exposed.

The habit to build is short: **inspect, select, review, record, verify.** It applies to every Git workflow you will meet later, including shared repositories.

## Prerequisites

Required competency: [Safe Terminal File Operations](terminal-file-operations.md). Before starting, be able to identify your location with `pwd -P`, quote a path, create and append to synthetic text files, read an exit status immediately with `$?`, and remove only known lab artifacts. Use that module's [starting-directory guidance](terminal-file-operations.md#find-a-starting-directory) if needed.

No other competency is required. The minimum security ideas you need are introduced in [Secrets and durable records](#secrets-and-durable-records). [Local Access and Synthetic Secrets](local-access-and-secrets.md) is related optional study, not a prerequisite.

Required environment:

- A local Linux or macOS terminal with `/bin/sh` and the standard utilities from the prerequisite, plus `find` and the shell's `read`, which appear only in safety helpers explained here.
- **Git already installed**, version **2.32.0 or later**. The lab checks this and stops if the requirement is not met. This lesson does not install or upgrade Git; see [Git versions](#git-versions).
- An ordinary, non-administrative session and an existing writable personal directory on a local filesystem **that is not inside any Git repository**. Avoid shared, synchronized, production, and project directories.

There are no cloud accounts, external services, charges, or administrative steps. Do not use `sudo`. Do not use real names, email addresses, credentials, or existing project files. The lab never changes your personal or system Git configuration and never contacts a network.

On macOS, typing `git` on a computer without Apple's developer tools can open an installation dialog. Treat that as "Git is not installed": dismiss it and stop until you have decided how to install Git outside this lesson.

Run blocks in order and inspect each checkpoint. Do not paste the whole module as a script: some commands fail on purpose, and cleanup asks for typed confirmation. Stop on any **unexpected** failure. Diagnostic wording and output layout vary between Git versions; do not treat a particular message as guaranteed.

### Git versions

| Category | Version | Basis |
| --- | --- | --- |
| Minimum supported | Git 2.32.0 | Determined from the features this lab requires, checked against official Git documentation |
| Recommended | The current stable release provided by your operating system vendor or the Git project | Git has no long-term-support channel; the Git project listed 2.56.1 (2026-10-26) as its latest release when reviewed |
| Practically tested | Git 2.43.0, Linux L1 only, partial | An earlier revision of the laboratory was executed with this version, and later targeted checks covered the changes since then, the cleanup procedure and the challenge (with a reference solution). The complete current text has not been run, and no other Git version or macOS run has been tested |

| Required feature | First available | Documentation inspected |
| --- | --- | --- |
| `git restore` | 2.23.0 | 2.23.0 release notes. The manual labeled the command experimental through 2.50.x; the label is absent from the 2.51.0 manual onward |
| `git init --initial-branch` | 2.28.0 | Present in the 2.28.0 `git init` manual, absent from the 2.27.0 manual |
| `GIT_CONFIG_GLOBAL` | 2.32.0 | 2.32.0 release notes and manual. **This sets the minimum** |
| `GIT_CONFIG_NOSYSTEM` | Before 2.32.0 | Documented in the 2.32.0 manual; its first release was not determined and does not affect the minimum |
| `GIT_TERMINAL_PROMPT` | 2.3.0 | 2.3.0 release notes |
| `git config --show-origin` | 2.8.0 | 2.8.0 release notes |

Which Git version each Linux distribution or macOS release ships was not audited for this lesson. Check your own installation rather than assuming. A version at or above the minimum is a documentation-based expectation, not a tested guarantee.

## Learning Objectives

By the end, you can:

- **O1 — Record:** create a local repository, explain the working tree, staging area, and commits, and record selected changes by staging explicit paths and writing descriptive commit messages.
- **O2 — Inspect:** inspect working tree changes, staged changes, and commit history before and after recording, and predict what a commit will contain from that evidence.
- **O3 — Recover:** recover from unintended staging, an unwanted uncommitted edit, and a recorded change that must be withdrawn, choosing the matching operation and stating what each one cannot recover.
- **O4 — Protect:** keep synthetic secrets out of new commits by reviewing staged content, and demonstrate that an ignore rule neither stops tracking an already recorded file nor removes its content from history.
- **O5 — Clean up:** verify which repository a command will affect, confirm that no remote and no personal or system Git configuration change was introduced, and remove only the disposable laboratory after its safety checks pass.

## Core Concepts

### A repository is a directory with a recorded history

A Git **repository** is an ordinary directory, called the **working tree**, plus a hidden `.git` directory in which Git stores recorded history and settings. `git init` creates that `.git` directory. See [git init](https://git-scm.com/docs/git-init).

Git decides which repository a command affects by looking for `.git` in your current directory and then in each parent directory. This matters for safety: if you run a Git command in a plain directory that happens to sit inside someone's project, Git operates on that project. `git rev-parse --show-toplevel` prints the top-level directory of the repository your command would affect, or fails when you are not inside one. See [git rev-parse](https://git-scm.com/docs/git-rev-parse). In this lab you check it before recording anything.

A repository placed inside another repository's working tree is called nested, and causes confusing results. This lab avoids it: one plain directory holds two separate sibling repositories.

### Three places a change can be

Git distinguishes three places. Keeping them apart explains almost every command in this lesson.

| Place | What it holds | How content gets there |
| --- | --- | --- |
| Working tree | The files you see and edit | You create or edit files |
| Staging area (also called the index) | The exact content selected for the next commit | `git add <path>` copies a file's current content there |
| Commits | Recorded snapshots, each with a message, author, date, and parent | `git commit` records what is in the staging area |

A file Git has been told about is **tracked**; a file Git merely sees in the directory is **untracked**. Staging selects *content at that moment*, not a file name: if you stage a file and then edit it again, the commit contains the staged version, not the later edit.

A **commit** is identified by a long hexadecimal ID; `git log --oneline` shows a short form. IDs depend on content, author, and time, so yours will differ from anyone else's and from any example. `HEAD` names the commit your work currently builds on. `HEAD~1` means the commit before it, and `HEAD~2` the one before that. See the [Git glossary](https://git-scm.com/docs/gitglossary).

Three names are used precisely in this lesson. **HEAD** is the latest commit. The **index** is the staging area. The **working tree** is the files you edit. A path can hold a different version in each. A repository with no commits yet has an **unborn HEAD**: `HEAD` names nothing, `git status` reports `No commits yet`, and `git log` fails with a message that the branch does not have any commits yet.

The staging area is a simplification here: the glossary describes further uses during merges, which are outside this lesson.

### Inspect before and after you record

Each question has its own command. Use the one that answers what you need to know.

| Question | Command |
| --- | --- |
| What is changed, staged, or untracked right now? | [`git status`](https://git-scm.com/docs/git-status) |
| What did I change in **tracked** files that is not staged? | [`git diff`](https://git-scm.com/docs/git-diff) |
| Which untracked files exist, and what do they contain? | `git status` lists them; read each one with an ordinary file viewer, or list them with `git ls-files --others --exclude-standard` (ignored files are omitted) |
| What exactly would the next commit record? | `git diff --staged` |
| Which commits exist, newest first? | [`git log --oneline`](https://git-scm.com/docs/git-log) |
| What did one commit change? | [`git show`](https://git-scm.com/docs/git-show) |
| Which files are tracked? | [`git ls-files`](https://git-scm.com/docs/git-ls-files) |

A diff marks added lines with `+` and removed lines with `-`. `git diff` compares the working tree with the index for **tracked** files only; it never lists untracked files. An empty `git diff` therefore does not mean nothing will be committed, and it does not prove that every change is staged: it can also be empty while a new file is still untracked. Read `git status` for untracked files, `git diff` for unstaged edits, and `git diff --staged` for what the next commit will record. `git diff --staged` is the review that matters before a commit, and it is the security control of this module.

Stage **explicit paths** such as `git add ./service-notes.txt`. Forms that stage everything at once select by location rather than by decision, and are how unrelated drafts and credentials enter history. This lesson never uses them. See [git add](https://git-scm.com/docs/git-add).

A commit message states what changed and why in a short line, for example `Add deployment checklist`. Messages like `update` or `fix` force the next reader to open the diff. Every commit also records an author name and email. That is personal information in a real repository, so this lab sets a synthetic identity that applies to the lab repository only. See [git commit](https://git-scm.com/docs/git-commit).

### Recovery depends on where the mistake is

| Situation | Operation | What it changes | What it cannot recover |
| --- | --- | --- | --- |
| Something is staged that should not be | `git restore --staged <path>` | Only the index. If the path exists in `HEAD`, the staged version is replaced by the `HEAD` version. If the path does **not** exist in `HEAD` (for example, a file you just created and staged), the path is removed from the index and becomes untracked again. In both cases the file in the working tree keeps its content | A **staged version that exists nowhere else**: if you staged a file and then edited it again, the staged version differs from both `HEAD` and the working tree, and unstaging discards it. It does not hide content already shown on screen or already committed |
| A tracked file has an uncommitted edit you do not want | `git restore <path>` | Overwrites that file in the working tree with the staged version | **The discarded edit is gone.** It was never committed, so Git has no copy |
| A recorded commit must be withdrawn | `git revert <commit>` | Adds a **new** commit that applies the opposite change | It does not delete the original commit, which stays in history with its content |

`git restore <path>` is the operation in this lesson that most plainly destroys work, so name one explicit path and inspect `git diff` for that path first. See [git restore](https://git-scm.com/docs/git-restore).

**Unstaging and recoverability.** Before unstaging, compare the three versions of the path: `git diff --staged -- <path>` (index against `HEAD`) and `git diff -- <path>` (working tree against index). If the second is empty, the working file already holds the staged content, so unstaging loses nothing. If it is not empty, the staged version is not in your file or in any commit. When Git staged it, it stored that content as an internal object, and such an object may remain for some time. That does not make recovery guaranteed: nothing in a commit or branch refers to it, Git's cleanup may remove it, and this lesson does not teach how to search for it. If that version matters, save it before unstaging: `git show :./<path>` prints the staged content, which you can redirect to a new file with a different name.

**Recovery before the first commit.** With an unborn `HEAD`, `git restore --staged <path>` fails, with an error such as `fatal: could not resolve HEAD` (this is the wording observed with Git 2.43.0; the exact text can differ between Git versions), because `HEAD` does not yet refer to any commit, so there is no version to reset to. The command does not succeed and leaves the index unchanged. Recognize this state by `No commits yet` in `git status`. To unstage a path, use `git rm --cached -- <path>`, which removes it from the index only and leaves the working file in place. If Git refuses because the staged content differs from both the file and `HEAD`, **do not add `-f`**; first run `git add -- <path>` so that the index matches the file you want to keep, then run `git rm --cached -- <path>` again. Check with `git status` that the file is untracked and still present. If `git rm --cached` instead reports `fatal: pathspec '<path>' did not match any files`, Git found no such entry in the index: the path is not staged (or is misspelled), so there is nothing to undo. Run `git status` and `git ls-files` to confirm, check the spelling of the path, and do not add `-f` or recreate anything to make the message go away. Do not delete `.git` or recreate the repository to start over: that removes Git's records of the lab, not only the mistake.

Git may refuse a revert when pending changes to tracked files would be overwritten, but not every pending modification blocks it. This laboratory applies the more conservative rule: begin with a clean working tree, with no pending changes to tracked files, so the result of the revert is easy to interpret. Git normally opens an editor for the message; `--no-edit` accepts the generated message. Reverting a commit that later commits built upon can produce conflicts, which need skills beyond this lesson. Here you only revert a small change that nothing else depends on. See [git revert](https://git-scm.com/docs/git-revert).

Commands that discard whole sets of changes or rewrite existing commits are not used or needed in this module.

### Secrets and durable records

A **secret** is information whose disclosure enables access or another sensitive action: a password, token, or private key. In this module every such value is fake and begins `SYNTHETIC-NOT-A-CREDENTIAL-`. It cannot authenticate to anything. Never substitute a real value.

Commits are durable and are meant to be copied. Once a repository is shared, each full copy (for example, a clone) normally contains the commits that existed when it was made, and later copies receive the history that is shared with them. Shallow or partial copies may hold less, and a branch that was never shared is not in other people's copies. A secret in a commit is therefore readable by everyone who has, or later obtains, a copy that includes it, including in old commits that no current file shows. You cannot tell from your own repository who holds such a copy.

Two consequences follow. First, prevention happens at staging time: read `git diff --staged` and judge the **content**, because a file called `deploy-summary.txt` can hold a token as easily as one called `secrets.env`. Second, if a real credential was recorded or shared, deleting or hiding it is not the response. The response is to tell the credential's owner and have it revoked or replaced through their process, so the exposed value stops working. The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) describes revocation as part of a secret's lifecycle. GitHub's guidance on [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) likewise names revoking or rotating the secret as the first step, and notes that rewriting history has side effects and may not be warranted afterwards.

Review has limits. It catches what you read and recognize; it does not detect an unfamiliar secret format, and anything displayed in a terminal may be kept in scrollback or recordings.

### Ignore rules affect only untracked files

A `.gitignore` file lists patterns for files Git should leave untracked. A matching untracked file disappears from `git status`, and `git add` refuses it when named exactly. A pattern without a slash, such as `local.env`, matches that name at any directory level below the file. See [gitignore](https://git-scm.com/docs/gitignore).

The official description states the limit directly: files already tracked are not affected. An ignore rule added after a file was committed changes nothing about that file. Git keeps reporting its modifications and would record them if staged.

Three separate facts are easy to merge into one false belief:

1. **Ignoring** prevents an untracked file from being staged by accident.
2. **Stopping tracking** with `git rm --cached <path>` removes the file from the staging area and from future commits, while leaving your working copy in place. See [git rm](https://git-scm.com/docs/git-rm).
3. **History** still contains every version that was ever committed. Neither of the first two changes that.

[`git check-ignore -v <path>`](https://git-scm.com/docs/git-check-ignore) reports which rule ignores a path. By default it reports nothing for a tracked file, because ignore rules do not apply to it. That silence is evidence you will use.

Removing content from existing history is a specialized, disruptive operation that this module does not teach, and it cannot recall copies that already exist elsewhere.

### Configuration scopes and lab isolation

Git reads settings from several scopes: **system** (the whole computer), **global** (your user account), and **local** (one repository, stored in its `.git/config`). See [git config](https://git-scm.com/docs/git-config). Your own global settings may include your real identity, command aliases, or a personal ignore file, any of which could change what this lab shows.

The lab therefore starts a child shell with environment variables that affect only that shell and the programs it starts. They are described in the [Git environment variables reference](https://git-scm.com/docs/git#_environment_variables):

| Setting | Effect in the lab shell |
| --- | --- |
| `GIT_CONFIG_GLOBAL=/dev/null` | Git reads an empty file instead of your global configuration; your file is neither read nor changed |
| `GIT_CONFIG_NOSYSTEM=1` | Git skips the system-wide configuration file |
| `GIT_TERMINAL_PROMPT=0` | Git does not prompt for credentials on the terminal; none are needed here |
| `GIT_PAGER=cat` | Output prints directly instead of opening a pager |
| `GIT_EDITOR=true` | No text editor opens. A commit attempted without `-m` receives an empty message and is expected to be refused |

Environment variables can also work against the lab. **Tracing variables** are one case: `GIT_TRACE` and its relatives (`GIT_TRACE2`, `GIT_TRACE2_EVENT`, `GIT_TRACE2_PERF`, `GIT_TRACE_SETUP`, `GIT_TRACE_PACKET`, `GIT_TRACE_PERFORMANCE` and others) can name a file path, and Git then appends diagnostic lines about every command to it. If your environment sets one, lab commands would write outside the lab directory, and the output can include paths and command arguments. Because the lab shell inherits your environment, it removes them before the first Git command.

Other variables change behavior instead. `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, and `GIT_COMMITTER_EMAIL` override the identity stored in configuration, so setting `user.name` and `user.email` is not sufficient on its own. Others add configuration values (`GIT_CONFIG_COUNT`), change the template used by `git init` (`GIT_TEMPLATE_DIR`), point Git at a different repository (`GIT_DIR`), change how Git searches parent directories for a repository (`GIT_CEILING_DIRECTORIES`, `GIT_DISCOVERY_ACROSS_FILESYSTEM`), or alter how differences are displayed (`GIT_EXTERNAL_DIFF`, `GIT_DIFF_OPTS`). Most shells have none of these set, but a development environment can define them. The lab shell therefore removes them with `unset` before the first Git command. `unset` affects only the lab shell; removing a variable that was never set is harmless. You then run a check that prints the name of any other `GIT_*` variable still set (never its value); the lab expects it to print nothing. A name-based check is used rather than counting variables, because a count would still pass if one expected setting went missing while an unexpected one appeared. Later you confirm the identity recorded in your first commit. The names removed are a reviewed selection, not a complete inventory of every variable Git reads, so this check shows that the known variables are cleared; it does not prove complete isolation.

All identity and behavior settings in the lab use `git config --local`. One of them, `core.excludesFile`, points the lab repositories away from any personal ignore file, so that only the rules you write are in effect. These measures make the lesson predictable; they are not a security sandbox, and they do not protect a real secret.

## Recommended Resources

Use these selectively while working. All were opened and their relevant content inspected on **2026-11-13**. They are free to read without an account, and the laboratory needs no paid infrastructure. Reference pages are the Git project's manual at git-scm.com, which showed its latest version as 2.56.1 when reviewed; your installed manual (`git help <command>`) describes your own version.

| Resource and publisher | Read for | Scope and limits |
| --- | --- | --- |
| [What is Git?](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F) — *Pro Git*, Scott Chacon and Ben Straub, published by the Git project site | "The Three States" section; O1 | Book explanation, not a version-specific reference. Linked, not reproduced |
| [Recording Changes to the Repository](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository) — *Pro Git* | Status, staging, diffs, and ignoring files; O1, O2, O4 | Also covers shortcuts this lesson avoids, such as staging everything at once |
| [Undoing Things](https://git-scm.com/book/en/v2/Git-Basics-Undoing-Things) — *Pro Git* | The `git restore` sections; O3 | Read the restore sections only; commit amending and reset are outside this module |
| [git status](https://git-scm.com/docs/git-status), [git diff](https://git-scm.com/docs/git-diff), [git log](https://git-scm.com/docs/git-log), [git show](https://git-scm.com/docs/git-show), [git ls-files](https://git-scm.com/docs/git-ls-files) — Git project manual | Inspection commands; O2 | Complete references with many options; only the forms used here are required |
| [git add](https://git-scm.com/docs/git-add), [git commit](https://git-scm.com/docs/git-commit), [git restore](https://git-scm.com/docs/git-restore), [git revert](https://git-scm.com/docs/git-revert), [git rm](https://git-scm.com/docs/git-rm) — Git project manual | Recording and recovery; O1, O3, O4 | `git restore` carried an experimental label in manuals through 2.50.x |
| [gitignore](https://git-scm.com/docs/gitignore) and [git check-ignore](https://git-scm.com/docs/git-check-ignore) — Git project manual | Pattern rules, the tracked-file limit, and rule diagnosis; O4 | Pattern syntax beyond exact names is optional here |
| [git init](https://git-scm.com/docs/git-init), [git rev-parse](https://git-scm.com/docs/git-rev-parse), [git config](https://git-scm.com/docs/git-config), [environment variables](https://git-scm.com/docs/git#_environment_variables) — Git project manual | Repository boundaries, scopes, and lab isolation; O5 | Only the listed options and variables are used |
| [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — OWASP | Section 2.7.3 on revocation; O4 | Living guidance for organizations; most of it is beyond this lab |
| [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) — GitHub | The statement that revoking or rotating comes first, and the side effects of rewriting history; O4 | Vendor documentation about a hosted service. Read the opening sections only; **do not perform its procedure** |

Release notes for Git [2.23.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.23.0.adoc), [2.32.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.32.0.adoc), [2.3.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.3.0.adoc), and [2.8.0](https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.8.0.adoc) were inspected as raw files from the Git project's source repository to establish the [version table](#git-versions). The first release of `GIT_CONFIG_NOSYSTEM` and the Git versions packaged by individual operating systems were **not verified**. Source review is distinct from executing the exercise.

## Hands-on Labs

### Practice: record, inspect, and recover changes for a fictional service

**Goal:** a ten-commit local history in `guided-repo` that you can explain commit by commit, with a fake credential kept out of new commits and evidence of what an ignore rule does and does not do. Objectives: O1–O5.

The laboratory layout is one plain directory holding two independent repositories. Neither repository contains the other.

```text
git-change-management-lab/
  .lab-marker
  guided-repo/
  challenge-repo/
```

#### 1. Start the lab shell and check Git

Use the prerequisite's [starting-directory guidance](terminal-file-operations.md#find-a-starting-directory) to enter an existing personal local directory, and confirm it with `pwd -P`. Then start a child shell with the isolation settings explained in [Configuration scopes and lab isolation](#configuration-scopes-and-lab-isolation):

```sh
env ENV= HISTFILE= GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat GIT_EDITOR=true /bin/sh
```

These values exist only in that shell. They do not edit any configuration file. In the new shell, first clear any Git variables inherited from your environment, for the reasons given in the same concept section:

```sh
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_COMMON_DIR
unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_AUTHOR_DATE
unset GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL GIT_COMMITTER_DATE
unset GIT_CONFIG GIT_CONFIG_SYSTEM GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS GIT_TEMPLATE_DIR
unset GIT_EXTERNAL_DIFF GIT_DIFF_OPTS GIT_CEILING_DIRECTORIES GIT_DISCOVERY_ACROSS_FILESYSTEM
unset GIT_TRACE GIT_TRACE2 GIT_TRACE2_EVENT GIT_TRACE2_PERF GIT_TRACE2_CONFIG_PARAMS GIT_TRACE2_ENV_VARS
unset GIT_TRACE2_BRIEF GIT_TRACE2_EVENT_BRIEF GIT_TRACE2_PERF_BRIEF GIT_TRACE2_EVENT_NESTING GIT_TRACE2_DST_DEBUG
unset GIT_TRACE_PACKET GIT_TRACE_PERFORMANCE GIT_TRACE_SETUP GIT_TRACE_SHALLOW GIT_TRACE_CURL GIT_TRACE_CURL_NO_DATA
unset GIT_TRACE_PACK_ACCESS GIT_TRACE_PACKFILE GIT_TRACE_FSMONITOR GIT_TRACE_REFS GIT_TRACE_REDACT
```

These lines print nothing. Then run the check below. It lists the **names** (never the values, which could contain paths or secrets) of any Git variable in this shell that is **not** one of the five lab settings. The five lab settings are filtered out on purpose, so the expected result is that **nothing is printed**:

```sh
env | sed -n 's/^\(GIT_[A-Za-z0-9_]*\)=.*/\1/p' | grep -v -x -e GIT_CONFIG_GLOBAL -e GIT_CONFIG_NOSYSTEM -e GIT_TERMINAL_PROMPT -e GIT_PAGER -e GIT_EDITOR
```

**Checkpoint:** nothing is printed. The check hides only the five names this lab sets itself (`GIT_CONFIG_GLOBAL`, `GIT_CONFIG_NOSYSTEM`, `GIT_TERMINAL_PROMPT`, `GIT_PAGER`, and `GIT_EDITOR`) and prints every other `GIT_*` name found in the environment. Its exit status is `1` when nothing is printed, because `grep -v` reports that no line was selected; that is the expected result here, not a failure. If a name is printed, especially one containing `TRACE`, `CONFIG`, `DIR`, or `ASKPASS`, run `unset NAME` for it and run the check again until nothing is printed. If you cannot explain a name, type `exit` and ask for help before running Git: a variable you did not choose can send output outside the lab or change behavior. The `unset` lines above cannot name variables that future Git versions add, or whose names vary (such as `GIT_CONFIG_KEY_0`), which is why this check reads the actual environment instead of trusting a fixed list or a count.

Then run the version check. It is a safety helper: it reads the text printed by `git --version`, extracts the first two numbers, and compares them with the minimum. You do not need to memorize its syntax.

```sh
git_version_text=$(git --version)
git_version_number=${git_version_text#git version }
git_major=${git_version_number%%.*}
git_minor=${git_version_number#*.}
git_minor=${git_minor%%.*}
case "$git_major.$git_minor" in
  *[!0-9.]* | .* | *.)
    printf '%s\n' 'STOP: the Git version could not be determined. Git may not be installed.'
    ;;
  *)
    if test "$git_major" -gt 2 ||
       { test "$git_major" -eq 2 && test "$git_minor" -ge 32; }; then
      printf 'Git check passed: %s\n' "$git_version_text"
    else
      printf 'STOP: %s is older than the required 2.32.0.\n' "$git_version_text"
    fi
    ;;
esac
```

**Checkpoint:** the output is `Git check passed:` followed by your version. Record that version in your assessment notes. Keep those notes **outside the lab directory**, on paper or in a file in another personal directory: cleanup deletes everything inside the lab, including any notes stored there. On either `STOP` message, do not continue: type `exit` to leave the lab shell. Installing or upgrading Git is a decision about your own computer, made outside this lesson with your operating system's or organization's guidance; nothing here does it for you. A Git older than 2.32.0 does not recognize `GIT_CONFIG_GLOBAL` and would read your personal configuration despite the setting, which is why the lab refuses to proceed.

#### 2. Create the disposable workspace

First confirm that your current directory is **not** inside a repository:

```sh
git rev-parse --show-toplevel
printf 'Repository check status: %s\n' "$?"
```

**Expected failure:** Git reports that this is not a repository and the status is nonzero. If a path is printed instead, you are inside an existing repository: **stop**, leave with `exit`, and choose a different parent directory.

Now create the lab directory. `> /dev/null 2>&1` discards both normal and error output of the repeated check, because only its status matters here. The helper records two paths only after every step succeeds.

```sh
umask 077
set -C
unset git_lab_root git_lab_parent
if git rev-parse --git-dir > /dev/null 2>&1; then
  printf '%s\n' 'STOP: this directory is inside a Git repository. Choose another parent.'
elif git_lab_parent=$(pwd -P) &&
     mkdir ./git-change-management-lab &&
     cd ./git-change-management-lab &&
     git_lab_root=$(pwd -P) &&
     printf '%s\n' 'git-change-management-lab synthetic marker; not a secret' > ./.lab-marker; then
  printf 'Lab parent: %s\n' "$git_lab_parent"
  printf 'Lab root: %s\n' "$git_lab_root"
  ls -ld .
else
  unset git_lab_root git_lab_parent
  printf '%s\n' 'STOP: setup failed. Inspect before continuing.'
fi
```

**Checkpoint:** the lab root ends in `/git-change-management-lab` and its mode begins `drwx------`. Record both printed paths privately, in your notes outside the lab directory; resuming and cleanup depend on them, and a record kept inside the lab cannot help you find it. `mkdir` without `-p` refuses an existing name. Do not delete an existing directory to make room: choose another parent, or [resume your own recorded lab](#resume-an-interrupted-session).

#### 3. Initialize and verify the first repository

Create `guided-repo` as a new directory, initialize it, and confirm that Git's idea of the repository's top level is exactly the directory you expect.

```sh
if test -n "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_root" &&
   mkdir ./guided-repo &&
   cd ./guided-repo &&
   git init --initial-branch=main &&
   test "$(git rev-parse --show-toplevel)" = "$git_lab_root/guided-repo" &&
   git config --local user.name 'Lab Learner' &&
   git config --local user.email 'learner@example.invalid' &&
   git config --local core.excludesFile /dev/null; then
  printf '%s\n' 'Repository boundary verified and configured: guided-repo'
else
  printf '%s\n' 'STOP: repository setup failed. Do not configure or record anything.'
fi
```

`--initial-branch=main` gives the single line of history a predictable name. You will not create or switch branches in this module.

The three `git config --local` lines set the synthetic identity and the lab-only ignore setting. They sit inside the guarded chain on purpose: a local setting is written into whichever repository Git finds from the current directory, so nothing is written unless the top level has just been confirmed to be `guided-repo` inside your lab. On `STOP`, do not run the configuration lines by hand; inspect with `pwd -P` and `ls -a`, then use the [resume guidance](#resume-an-interrupted-session).

After the success message, inspect the result. These commands only read:

```sh
git config --list --show-origin
git remote -v
git status
```

**Checkpoint:** every line of the configuration listing starts with `file:.git/config`, showing that only this repository's local settings are in effect. `git remote -v` prints nothing: this repository has no connection to any other. `git status` reports no commits yet and nothing to commit. If the listing shows any other origin, or an identity that is not the synthetic one, stop and inspect; do not adjust settings outside this repository.

`example.invalid` is a reserved name that cannot belong to a real mailbox. Every command from here to step 12 is run inside `guided-repo`. If you are ever unsure, run `git rev-parse --show-toplevel` and compare it with your recorded lab root.

#### 4. Record the first changes

Create two synthetic files and look at the working tree:

```sh
printf '%s\n' 'service=demo-service' 'owner=platform-training' > ./service-notes.txt
printf '%s\n' 'step-1=review-notes' 'step-2=record-change' > ./deploy-checklist.txt
git status
```

**Checkpoint:** both files are listed as untracked. Nothing is staged.

Select only the notes, review the selection, and record it:

```sh
git add ./service-notes.txt
git status
git diff --staged
```

**Checkpoint:** `service-notes.txt` is listed as a change to be committed; `deploy-checklist.txt` is still untracked. The staged diff shows exactly two added lines. Say which of the [three places](#three-places-a-change-can-be) each file is in before continuing.

```sh
git commit -m 'Add demo service notes'
git log --oneline
git log -1 --format='author: %an <%ae> | committer: %cn <%ce>'
git status
```

**Checkpoint:** the log shows one commit with your message. Depending on your Git version and configuration, `git log --oneline` may also show optional decorations such as `(HEAD -> main)` after the short ID, and the branch name may differ; compare the commit message and the order, not the exact formatting. The formatted line shows `Lab Learner <learner@example.invalid>` as both author and committer. If either shows any other identity, something in your environment is overriding the lab settings: **stop**, make no further commits, and use [cleanup](#cleanup-after-assessment) before starting again in a fresh lab shell. The checklist is still untracked: a commit records the staging area, not the whole directory.

Record the checklist as its own commit, reviewing it first:

```sh
git add ./deploy-checklist.txt
git diff --staged
git commit -m 'Add deployment checklist'
git log --oneline
git status
```

**Checkpoint:** two commits, newest first. `git status` now reports a clean working tree.

#### 5. Inspect a change before and after recording it

Append one line to a tracked file and compare the two diffs at each stage:

```sh
printf '%s\n' 'status=ready-for-review' >> ./service-notes.txt
git status
git diff
git diff --staged
```

**Checkpoint:** `git diff` shows one added line; `git diff --staged` prints nothing, because nothing is selected yet.

```sh
git add ./service-notes.txt
git diff
git diff --staged
```

**Checkpoint:** the results swap. `git diff` is now empty and `git diff --staged` shows the added line. Explain why an empty `git diff` at this moment does not mean "nothing will be committed," and why, in the other direction, it would not prove that everything is staged: it never lists untracked files, so you also read `git status`.

```sh
git commit -m 'Mark service notes ready for review'
git log --oneline
git show --stat HEAD
git show HEAD
```

**Checkpoint:** three commits. `git show --stat HEAD` names one changed file; `git show HEAD` shows the author as the synthetic identity and the single added line. You have now inspected the same change before staging, after staging, and after recording.

#### 6. Detect and unstage a synthetic secret

A local settings file with a fake token appears next to a legitimate checklist change. A teammate suggests staging both pending files together.

```sh
printf '%s\n' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-GUIDED' > ./local.env
printf '%s\n' 'step-3=inspect-staged-changes' >> ./deploy-checklist.txt
git add ./deploy-checklist.txt ./local.env
git status
git diff --staged --name-only
git diff --staged
```

**Checkpoint — this is the intended mistake:** two paths are staged, and the staged diff shows the line containing `SYNTHETIC-NOT-A-CREDENTIAL-GUIDED`. The review caught it **before** a commit existed. Note what the review could not prevent: the value has now been printed on your screen. With a real secret that alone can matter.

Remove only that file from the staging area and verify:

```sh
git restore --staged ./local.env
git status
git diff --staged --name-only
cat ./local.env
```

**Checkpoint:** only `deploy-checklist.txt` remains staged; `local.env` is untracked again and its content is unchanged. Unstaging altered the index, not your file. Nothing was lost here because the staged content of `local.env` was identical to the file you still have. That would not be true for a file edited after staging (see [Unstaging and recoverability](#recovery-depends-on-where-the-mistake-is)). The internal copy Git made while the file was staged is not part of any commit; this lesson does not verify when, or whether, Git removes it.

Review once more and record the legitimate change:

```sh
git diff --staged
git commit -m 'Add staged-change review step to checklist'
git log --oneline
```

**Checkpoint:** four commits. The staged diff you reviewed contained one added checklist line and no token.

#### 7. Add an ignore rule

`local.env` is still untracked and would be offered again by every `git status`. Tell Git to leave it untracked:

```sh
printf '%s\n' 'local.env' > ./.gitignore
git status
git check-ignore -v ./local.env
printf 'check-ignore status: %s\n' "$?"
```

**Checkpoint:** `git status` lists `.gitignore` as untracked and no longer lists `local.env`. `git check-ignore -v` names the rule's file, line number, and pattern, with status `0`.

Now confirm that the rule protects against staging the file by its exact name:

```sh
git add ./local.env
printf 'Add status: %s\n' "$?"
git diff --staged --name-only
```

**Expected refusal:** Git reports that the path is ignored, the status is nonzero, and nothing is staged. Git's message mentions an option that overrides the rule. Do not use it; the refusal is the control working.

The rule itself is a project file worth recording:

```sh
git add ./.gitignore
git diff --staged
git commit -m 'Ignore local settings file'
git log --oneline
```

**Checkpoint:** five commits. The staged diff showed one added line in `.gitignore`.

#### 8. Diagnose an ignore rule that appears not to work

This step creates a fault on purpose. Imagine that a settings file with a fake token was recorded some time ago, before anyone thought about ignore rules. Reproduce that history. The commit message labels it as a lab mistake:

```sh
printf '%s\n' 'service=demo-service' 'legacy_token=SYNTHETIC-NOT-A-CREDENTIAL-LEGACY' > ./legacy.env
git add ./legacy.env
git diff --staged
git commit -m 'Add legacy settings (intentional lab mistake)'
```

Later, someone adds an ignore rule and reports the problem solved:

```sh
printf '%s\n' 'legacy.env' >> ./.gitignore
git add ./.gitignore
git diff --staged
git commit -m 'Ignore legacy settings file'
git log --oneline
```

**Checkpoint:** seven commits. Before running the next block, **predict**: if `legacy.env` changes now, will Git notice?

```sh
printf '%s\n' 'note=changed-after-ignore-rule' >> ./legacy.env
git status
git ls-files
git check-ignore -v ./legacy.env
printf 'check-ignore status: %s\n' "$?"
```

**Expected result, contrary to the report:** `git status` lists `legacy.env` as modified. `git ls-files` includes it, so it is tracked. `git check-ignore` prints nothing and returns status `1`, even though `.gitignore` contains a matching line.

State your diagnosis before reading on. Compare with step 7: the same kind of rule hid `local.env`, which was untracked. `legacy.env` was already tracked when its rule was added, and ignore rules do not apply to tracked files. The rule did not fail; it never applied.

#### 9. Stop tracking the file and inspect its history

Remove the file from the staging area while keeping your working copy. `--cached` limits the operation to the staging area:

```sh
git rm --cached ./legacy.env
git status
git diff --staged --stat
git commit -m 'Stop tracking legacy settings file'
```

**Checkpoint:** before the commit, `git status` shows `legacy.env` as a staged deletion, and the file is not offered as untracked because the ignore rule now applies to it.

Verify the present state:

```sh
git ls-files
ls -a .
git check-ignore -v ./legacy.env
printf 'check-ignore status: %s\n' "$?"
```

**Checkpoint:** `git ls-files` no longer lists `legacy.env`. `ls -a` shows the file still in your directory. `git check-ignore` now reports the rule, with status `0`. New commits will not include this file.

Now ask the question the report skipped: is the recorded content gone?

```sh
git log --oneline -- ./legacy.env
git show HEAD~1:legacy.env
```

**Expected result:** the log lists two commits that touched the path: the one that added it and the one that stopped tracking it. `git show HEAD~1:legacy.env` prints the file as recorded one commit before the current one, including the line with `SYNTHETIC-NOT-A-CREDENTIAL-LEGACY`. `<commit>:<path>` reads a file from a recorded snapshot; the path is given from the repository's top level.

**This is the central evidence of the module.** The ignore rule did not stop tracking. Stopping tracking did not remove history. Anyone holding a copy of this repository could run the same command. For a real credential, none of these steps would make it safe: the owner must revoke or replace it. Nothing further is done to the history here.

#### 10. Discard an unwanted uncommitted edit

Make an accidental edit to a tracked file and inspect it:

```sh
printf '%s\n' 'status=accidental-edit' >> ./service-notes.txt
git status
git diff ./service-notes.txt
```

**Checkpoint:** one added line in one file. Confirm that this is the only change you are about to discard. The next command overwrites the working copy of that one path with the staged version. **The discarded line cannot be recovered from Git**, because it was never committed.

```sh
git restore ./service-notes.txt
git status
git diff
cat ./service-notes.txt
```

**Checkpoint:** the working tree is clean, `git diff` prints nothing, and the notes have their three recorded lines. Compare with step 6: `--staged` changed only the index, and nothing was lost because the file still held the same content; without it, the same command changed your file and lost the edit.

#### 11. Withdraw a recorded change with a revert

Record a small change that will turn out to be wrong:

```sh
printf '%s\n' 'step-4=skip-review-when-busy' >> ./deploy-checklist.txt
git diff
git add ./deploy-checklist.txt
git diff --staged
git commit -m 'Add shortcut step to checklist'
git log --oneline
```

**Checkpoint:** nine commits. A reviewer rejects the shortcut. The change is already recorded, so the previous two recovery operations do not apply. Confirm there are no pending changes, then add a commit that applies the opposite change:

```sh
git status
git revert --no-edit HEAD
git log --oneline
cat ./deploy-checklist.txt
git show --stat HEAD
```

**Checkpoint:** ten commits. The newest message begins `Revert` and quotes the rejected message. The checklist has three steps again. Both the rejected commit and its revert remain visible in the log.

Verify that the recorded content now equals the content from before the rejected commit. `--exit-code` makes `git diff` report differences through its status:

```sh
git diff --exit-code HEAD~2 HEAD
printf 'Comparison status: %s\n' "$?"
```

**Checkpoint:** no output and status `0`. Explain why a revert would not have been an answer to the token in step 9: it adds a commit, and the earlier commit with the token would still be there.

If `git status` ever reports that a revert is in progress, something unexpected happened. Run `git revert --abort` to return to the state before the revert, and inspect before retrying.

#### 12. Verify boundaries and keep the workspace

```sh
git rev-parse --show-toplevel
git remote -v
git config --list --show-origin
git ls-files
git log --oneline
```

**Checkpoint:** the top level is your recorded lab root followed by `/guided-repo`. There is no remote. Every configuration line still originates from `file:.git/config`. Three files are tracked: `.gitignore`, `deploy-checklist.txt`, and `service-notes.txt`. The history has these ten messages, newest first:

```text
Revert "Add shortcut step to checklist"
Add shortcut step to checklist
Stop tracking legacy settings file
Ignore legacy settings file
Add legacy settings (intentional lab mistake)
Ignore local settings file
Add staged-change review step to checklist
Mark service notes ready for review
Add deployment checklist
Add demo service notes
```

Each line in your output is preceded by a short commit ID that differs from anyone else's.

Keep the same shell and workspace. Continue to the [independent challenge](#practical-challenges), answer the [questions](#questions), and review the [completion criteria](#completion-criteria) while both repositories still exist. Then perform [cleanup](#cleanup-after-assessment). You may clean up an incomplete attempt at any time; that does not establish completion.

#### Resume an interrupted session

Do not rerun setup, `git init`, or any block that creates files or commits over an existing lab. Repeating an append adds a duplicate line; repeating a commit block records a second commit.

If the lab shell is still open and `git_lab_root` is set, return with `cd "$git_lab_root"` and inspect. If the shell closed, start a new one with the `env ... /bin/sh` command from [step 1](#1-start-the-lab-shell-and-check-git) and **rerun its `unset` lines and the version check block**, because the isolation settings belong to the shell, not to the lab directory. The restoration block below repeats the `unset` lines, including the tracing variables, as a safeguard. Do not run any Git command in a resumed shell until you have also repeated the name check from step 1 and it prints nothing. Do not nest shells unnecessarily.

Then replace the quoted placeholder with the **exact lab root you recorded**. The placeholder is deliberately unusable. If you cannot identify your lab, stop rather than guessing.

The block first confirms that the isolation settings are active in this shell: `GIT_CONFIG_GLOBAL` must be `/dev/null` and `GIT_CONFIG_NOSYSTEM` must be `1`. If either differs, it stops before changing directory. That means you are in an ordinary shell, where Git would use your personal configuration and identity. Do not set the variables by hand; start the lab shell with the `env ... /bin/sh` command from step 1 and return here.

```sh
unset git_lab_root git_lab_parent
if test "$GIT_CONFIG_GLOBAL" != /dev/null ||
   test "$GIT_CONFIG_NOSYSTEM" != 1; then
  printf '%s\n' 'STOP: this shell does not have the lab isolation settings.'
  printf '%s\n' 'Git would read your personal configuration here. Start the lab shell from step 1.'
elif cd '/replace-with-your-recorded-path/git-change-management-lab' &&
   git_lab_root=$(pwd -P) &&
   test -f ./.lab-marker &&
   git_lab_parent=$(cd .. && pwd -P); then
  umask 077
  set -C
  unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE GIT_OBJECT_DIRECTORY GIT_COMMON_DIR
  unset GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_AUTHOR_DATE
  unset GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL GIT_COMMITTER_DATE
  unset GIT_CONFIG GIT_CONFIG_SYSTEM GIT_CONFIG_COUNT GIT_CONFIG_PARAMETERS GIT_TEMPLATE_DIR
  unset GIT_EXTERNAL_DIFF GIT_DIFF_OPTS GIT_CEILING_DIRECTORIES GIT_DISCOVERY_ACROSS_FILESYSTEM
  unset GIT_TRACE GIT_TRACE2 GIT_TRACE2_EVENT GIT_TRACE2_PERF GIT_TRACE2_CONFIG_PARAMS GIT_TRACE2_ENV_VARS
  unset GIT_TRACE2_BRIEF GIT_TRACE2_EVENT_BRIEF GIT_TRACE2_PERF_BRIEF GIT_TRACE2_EVENT_NESTING GIT_TRACE2_DST_DEBUG
  unset GIT_TRACE_PACKET GIT_TRACE_PERFORMANCE GIT_TRACE_SETUP GIT_TRACE_SHALLOW GIT_TRACE_CURL GIT_TRACE_CURL_NO_DATA
  unset GIT_TRACE_PACK_ACCESS GIT_TRACE_PACKFILE GIT_TRACE_FSMONITOR GIT_TRACE_REFS GIT_TRACE_REDACT
  printf 'Resumed lab root: %s\n' "$git_lab_root"
  printf 'Lab parent: %s\n' "$git_lab_parent"
  ls -a .
else
  unset git_lab_root git_lab_parent
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

Run the name check from step 1 and confirm that it prints nothing. Then compare both paths with your records and confirm the entries are ones you created. Enter the repository you were working in with `cd ./guided-repo` or `cd ./challenge-repo`, then run `git rev-parse --show-toplevel`, `git status`, and `git log --oneline`. Git's own record tells you where you stopped.

| State you observe | Safe next action |
| --- | --- |
| Repository directory exists but `git rev-parse --show-toplevel` fails or prints a different path | Initialization did not complete. Stop and inspect with `ls -a`. If the directory is empty, remove it by name with `rmdir` from the lab root and repeat step 3 |
| Top level is correct but the identity is not the synthetic one | Only after `git rev-parse --show-toplevel` prints the expected repository inside your lab, run `git config --local user.name 'Lab Learner'` and `git config --local user.email 'learner@example.invalid'`, plus `git config --local core.excludesFile /dev/null` if that setting is missing. Then inspect the listing |
| Fewer commits than a step expects | Compare the log with the list in step 12 and continue from the first missing message. Inspect files before appending; do not append a line that is already present |
| Changes are staged but not committed | Read `git diff --staged`, and `git diff` for the same path. Commit only if the staged diff matches the step you were on. Otherwise unstage the path with `git restore --staged <path>`, but only after `git diff <path>` is empty or you have saved the staged version (see [Unstaging and recoverability](#recovery-depends-on-where-the-mistake-is)); then redo that step's review |
| `git status` says `No commits yet` and a wrong path is staged | `git restore --staged` fails here because `HEAD` does not exist. Follow [Recovery before the first commit](#recovery-depends-on-where-the-mistake-is); if `git rm --cached` says `pathspec ... did not match any files`, the path is not staged and there is nothing to undo. Never delete `.git` to start over |
| A tracked file has an edit you do not recognize | Inspect it with `git diff <path>`. Decide from its content whether it belongs to the current step before discarding anything |
| `git status` reports a revert in progress | Run `git revert --abort`, confirm a clean status, and redo step 11 from its `git status` line |
| The challenge repository already exists | Inspect its status and log. Do not rerun its setup block; continue from the first unfinished requirement |
| You cannot establish a trustworthy state | Use [cleanup](#cleanup-after-assessment) and start a fresh lab. Do not invent evidence for steps you cannot show |

Resuming restores the session. It does not establish that any criterion passed; repeat any observation you did not retain.

#### Cleanup after assessment

Review your evidence first. **Laboratory artifacts** are temporary and live inside the lab directory: the repositories, their files, and `.lab-marker`. **Your notes** are yours to keep and must live outside it, as the guided steps told you. This procedure permanently deletes everything inside the lab directory, so confirm that every note you want to keep is already outside it. Use this section after the [challenge](#practical-challenges), [questions](#questions), and [completion criteria](#completion-criteria), or to abandon an incomplete attempt.

**Why this cleanup differs from the other Foundations modules.** Those modules remove each file by name and never delete recursively. That is not practical here: Git stores history as many internal files under `.git`, with names you did not choose and without write permission. This module therefore permits **one** recursive, forced removal of the entire disposable lab directory, and surrounds it with checks. The exception applies to this laboratory only. It is not a general technique: recursive removal is permanent, has no undo, and deletes everything below its target.

The procedure has two deliberate actions. The first only inspects. The second removes, and only after you type the directory's name. Nothing in setup ever runs it for you.

**Action 1 — verify.** The helper first requires the lab's isolation settings (`GIT_CONFIG_GLOBAL` is `/dev/null` and `GIT_CONFIG_NOSYSTEM` is `1`), because its identity checks run Git and must not be influenced by your personal configuration. If that check stops, nothing has been inspected or removed: start the lab shell from step 1, use the [resume procedure](#resume-an-interrupted-session), and verify again. It then moves to the lab's parent and requires all of the following: both recorded paths are set and consistent; the lab is not your home directory; the lab is a real directory, not a symbolic link; it contains the marker file created in step 2; its physical location equals the recorded path; and the parent is not inside any Git repository. Each repository that exists must then prove its identity: its top level is inside the lab, it uses the synthetic identity, and it has no remote. `for ... do ... done` repeats the same checks for both repository names. Symbolic links inside the lab are listed, not automatically rejected. If any appear, stop here and do not run the cleanup action.

```sh
unset cleanup_verified_root
if test "$GIT_CONFIG_GLOBAL" != /dev/null ||
   test "$GIT_CONFIG_NOSYSTEM" != 1; then
  printf '%s\n' 'STOP: this shell does not have the lab isolation settings.'
  printf '%s\n' 'Git would read your personal configuration here. Start the lab shell from step 1.'
elif test -n "$git_lab_root" &&
   test -n "$git_lab_parent" &&
   test "$git_lab_root" = "$git_lab_parent/git-change-management-lab" &&
   test "$git_lab_root" != "$HOME" &&
   cd "$git_lab_parent" &&
   test "$(pwd -P)" = "$git_lab_parent" &&
   test -d ./git-change-management-lab &&
   test ! -L ./git-change-management-lab &&
   test -f ./git-change-management-lab/.lab-marker &&
   test ! -L ./git-change-management-lab/.lab-marker &&
   test "$(cd ./git-change-management-lab && pwd -P)" = "$git_lab_root" &&
   ! git rev-parse --git-dir > /dev/null 2>&1; then
  cleanup_verified_root=$git_lab_root
  for lab_repo in guided-repo challenge-repo; do
    if test ! -e "./git-change-management-lab/$lab_repo"; then
      printf 'Not present: %s\n' "$lab_repo"
    elif test ! -L "./git-change-management-lab/$lab_repo" &&
         test "$(git -C "./git-change-management-lab/$lab_repo" rev-parse --show-toplevel)" = "$git_lab_root/$lab_repo" &&
         test "$(git -C "./git-change-management-lab/$lab_repo" config --local user.email)" = 'learner@example.invalid' &&
         test -z "$(git -C "./git-change-management-lab/$lab_repo" remote)"; then
      printf 'Verified lab repository: %s\n' "$lab_repo"
    else
      unset cleanup_verified_root
      printf 'STOP: %s failed its identity checks.\n' "$lab_repo"
    fi
  done
  printf '%s\n' 'Top-level entries:'
  ls -a ./git-change-management-lab
  printf '%s\n' 'Symbolic links inside the lab (expected: none listed):'
  find ./git-change-management-lab -type l
else
  printf '%s\n' 'STOP: workspace verification failed. Do not remove anything.'
fi
if test -n "$cleanup_verified_root"; then
  printf 'Verification passed for: %s\n' "$cleanup_verified_root"
else
  printf '%s\n' 'Verification did NOT pass. Inspect manually.'
fi
```

**Checkpoint — inspect before deciding.** Continue only if **all** of these hold:

- The final line is `Verification passed for:` followed by your recorded lab root, and no `STOP` line appears.
- The top-level entries are only `.`, `..`, `.lab-marker`, `guided-repo`, `challenge-repo` (if you created it), and files you recognize as your own. Any of them will be deleted.
- No symbolic link is listed.
- The path is not your home directory, not a project, and not a directory you need.

If any check is inconclusive, **stop and inspect manually.** Do not edit the helper to make it pass, do not type the removal command by hand, and do not broaden its target. A repository directory left empty by a failed setup can be removed by name with `rmdir` from the lab root, after which you can verify again. If you cannot explain a discrepancy, leave the directory in place and ask for help. An unremoved lab is a small problem; a wrong removal is not.

**Action 2 — remove.** Run this only after the checkpoint above. It repeats the essential checks, including that the marker file still exists as a regular file and not a symbolic link, then asks you to type the directory name. The removal command names a fixed, literal directory relative to the verified parent. It never receives a path from a variable, so an empty or altered variable cannot redirect it.

```sh
if test -n "$cleanup_verified_root" &&
   test "$cleanup_verified_root" = "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_parent" &&
   test -d ./git-change-management-lab &&
   test ! -L ./git-change-management-lab &&
   test -f ./git-change-management-lab/.lab-marker &&
   test ! -L ./git-change-management-lab/.lab-marker &&
   test "$(cd ./git-change-management-lab && pwd -P)" = "$cleanup_verified_root"; then
  printf '%s' 'Type the lab directory name to confirm permanent removal: '
  cleanup_answer=
  if IFS= read -r cleanup_answer &&
     test "$cleanup_answer" = 'git-change-management-lab'; then
    if rm -rf ./git-change-management-lab &&
       test ! -e ./git-change-management-lab; then
      unset cleanup_verified_root git_lab_root
      printf '%s\n' 'Lab directory removed.'
    else
      printf '%s\n' 'STOP: removal is incomplete. Inspect before retrying.'
    fi
  else
    printf '%s\n' 'Cleanup cancelled. Nothing was removed.'
  fi
else
  printf '%s\n' 'STOP: verification is missing or stale. Run the verification action again.'
fi
```

`rm -r` removes a directory and everything below it; `-f` suppresses the per-file questions that Git's read-only internal files would otherwise trigger. The command removes a symbolic link itself rather than what it points to, and the checks above already refuse to proceed when the lab directory is a link. `IFS= read -r` keeps the typed line exactly as entered, including leading or trailing spaces and tabs, and a failed `read` (for example, end of input) cancels as well. Typing anything other than the exact name, including the name with surrounding whitespace, or an empty line, cancels.

**Checkpoint:** `Lab directory removed.` appears only after the removal succeeded and the path no longer exists. Your current directory is the parent, which was never a removal target. Type `exit` to leave the lab shell; the isolation settings end with it and your own Git configuration was never changed. On any `STOP`, the shell stays open: run `pwd -P` and `ls -a`, and repeat the verification action rather than improvising.

**If cleanup is interrupted.** Three cases, none of which allows skipping a check:

- *The shell closed, or you cancelled, before the confirmation:* nothing was removed. Start the lab shell, use the [resume procedure](#resume-an-interrupted-session), and run Action 1 again.
- *`STOP: removal is incomplete`, or the removal was interrupted while running:* part of the lab may now be gone, including `.lab-marker`, in which case verification will rightly stop. Do not recreate the marker, edit the helper, or type a removal command by hand to get past it. Open a shell in the recorded parent, run `pwd -P` and `ls -a ./git-change-management-lab`, and compare what remains with your records. Leftovers are synthetic and harmless; leaving them is acceptable.
- *You want the leftovers gone:* ask a maintainer or mentor to review the recorded path with you. Remove them only once the target is unambiguous, and do not widen it.

**When cleanup cannot be completed safely, stopping is a correct outcome.** Do not bypass or edit a safety check, do not recreate `.lab-marker` or any other file so that verification passes, and do not improvise a recursive or forced deletion (including `rm -r`, `rm -rf`, `find ... -delete`, or wildcards) outside the one verified Action 2 block. Leaving the identified laboratory remnants untouched until a maintainer or mentor can help is acceptable: they are synthetic, you have recorded where they are, and they affect nothing else. Keep the recorded path and the `ls -a` output so the person helping you can review the same facts.

Removal is not secure erasure, and it does not affect backups or terminal recordings. With synthetic data that does not matter. Record the cleanup observation, then finish O5 in the [completion criteria](#completion-criteria).

## Practical Challenges

### Build: decide what belongs in the record

A fictional colleague hands over a second repository for `demo-service` in the middle of their work. Several changes are pending. They ask you to "commit the health-check fix" and add: "The cache settings file has a key in it, but that's fine, it's in `.gitignore`."

Decide what belongs in the record, keep fake credentials out of new commits, test the colleague's claim with evidence, and carry out two recoveries. No command recipe is provided. Use only what you practiced, in an order you choose and can justify.

The following block **supplies the starting state**; it is not part of the solution. Run it once in the lab shell. It returns to the lab root, creates `challenge-repo` beside `guided-repo`, verifies its boundary, and builds two commits plus four pending changes.

```sh
if test -n "$git_lab_root" &&
   cd "$git_lab_root" &&
   test "$(pwd -P)" = "$git_lab_root" &&
   mkdir ./challenge-repo &&
   cd ./challenge-repo &&
   git init --initial-branch=main &&
   test "$(git rev-parse --show-toplevel)" = "$git_lab_root/challenge-repo" &&
   git config --local user.name 'Lab Learner' &&
   git config --local user.email 'learner@example.invalid' &&
   git config --local core.excludesFile /dev/null &&
   printf '%s\n' 'service=demo-service' 'release=1.4.0' 'status=draft' > ./release-notes.txt &&
   printf '%s\n' 'step-1=announce-rollback' 'step-2=restore-previous-release' > ./rollback-plan.txt &&
   printf '%s\n' 'cache_ttl=300' 'upstream_key=SYNTHETIC-NOT-A-CREDENTIAL-CHALLENGE-OLD' > ./cache-settings.conf &&
   git add ./release-notes.txt ./rollback-plan.txt ./cache-settings.conf &&
   git commit -m 'Import demo service release files' &&
   printf '%s\n' 'cache-settings.conf' > ./.gitignore &&
   git add ./.gitignore &&
   git commit -m 'Ignore cache settings' &&
   printf '%s\n' 'fix=correct-health-check-path' >> ./release-notes.txt &&
   printf '%s\n' 'draft=unfinished-onboarding-ideas' > ./onboarding-draft.txt &&
   printf '%s\n' 'service=demo-service' 'result=pending' 'debug_context=SYNTHETIC-NOT-A-CREDENTIAL-CHALLENGE-NEW' > ./deploy-summary.txt &&
   printf '%s\n' 'cache_ttl_note=tuned-locally' >> ./cache-settings.conf; then
  printf '%s\n' 'Challenge repository is ready.'
  git status
else
  printf '%s\n' 'STOP: challenge setup failed. Inspect before continuing.'
fi
```

**Input checkpoint:** the message `Challenge repository is ready.` appears, followed by a status listing. If setup stops partway, inspect with `git status` and `git log --oneline`; do not rerun the block over an existing `challenge-repo`. All values are fake.

Provide these results:

1. **Inspect (O2).** Before staging anything, describe the repository: which commits exist and what each changed, which files are tracked, and what each of the four pending changes is. Base every statement on a command's output, and read the *content* of each pending change, not only its name. `git diff` does not display the contents of untracked files, so inspect those files explicitly (for example with `cat`).
2. **Record (O1).** Record the health-check fix as its own commit with a descriptive message. Show the staged review you performed immediately before committing, and justify why each other pending change was left out of that commit.
3. **Protect (O4).** The two **supplied commits** (`Import demo service release files` and `Ignore cache settings`, created by the setup block) are the starting state, and the first one contains a synthetic marker by design. Every commit **you create** after them is a **learner commit**. No learner commit may **add** a line containing a `SYNTHETIC-NOT-A-CREDENTIAL-` marker. Decide what to do with `deploy-summary.txt` and with the unrelated draft, and justify the decision from their content. Whatever you choose, both files must still exist, unchanged, in the working directory at assessment time.
4. **Test the claim (O4).** Gather evidence showing whether the ignore rule protects `cache-settings.conf`. Then make sure future commits will not include that file, without deleting your local copy or its pending local line, and record that as a separate commit. Finally, demonstrate whether the old fake key can still be read from the repository, and state what would have to happen if it were a real credential. A commit that stops tracking a file displays its old lines as removed; that is expected and is not a new exposure. Once the file is no longer tracked and matches an ignore rule, `git status` stops listing it even though it is still on disk, so verify directly that the file exists and what it contains instead of relying on `git status`.
5. **Recover (O3).** Carry out both situations, choosing the operation for each and explaining what it can and cannot recover:
   - Append the line `step-3=untested-idea` to `rollback-plan.txt`, then decide it was a mistake before recording it. Discard that edit so the file matches its recorded content. No other pending or local file may be affected.
   - After the fix from item 2 is recorded, a reviewer reports that the health-check path was wrong and the fix must be withdrawn **without removing anything from history**. Withdraw it. **Before you revert, check that no tracked file has pending changes** (staged or unstaged; untracked files do not count). This lab applies the conservative rule from the concepts section, so plan the order of your work accordingly. Then verify the withdrawal with evidence that does not depend on where the fix sits in the history: read `release-notes.txt` and confirm it has exactly its three imported lines; use `git log --oneline -- ./release-notes.txt` to confirm that the import, the fix, and a newer commit withdrawing the fix are all present; and inspect the withdrawing commit itself with `git show <revert-commit-id>` to confirm it removes only the fix line, in only that file. Identify that commit from the log output rather than assuming it is the most recent one: it is the line whose message begins `Revert` and quotes the message of your fix, and its ID is the short hexadecimal value at the start of that line. Replace `<revert-commit-id>`, including the angle brackets, with that value. The guided lab compared `HEAD~2` with `HEAD`. That was valid there because the reverted commit was the newest one; here another commit may sit between the fix and its withdrawal, and the same comparison would also report that commit's changes. If you want a comparison, limit it to the one file and name the commit recorded just before the fix, using its ID from `git log --oneline`: `git diff --exit-code <id-before-fix> HEAD -- ./release-notes.txt`.
6. **Verify boundaries (O5).** Show which directory is this repository's top level, that it has no remote, and where every active configuration value comes from.

**Deliverables:** your description from item 1; the staged review and message for each commit you created; the reasons for every inclusion and exclusion; the evidence for and against the colleague's claim; the demonstration that the old key remains readable, with your statement of the real-world response; before-and-after observations for both recoveries; the boundary observations; and the cleanup result. Keep your notes outside the lab directory, as in the guided lab, or explain them orally; the lab's files are temporary artifacts and are deleted during cleanup, while notes you keep outside it are not. Notes need observations and reasons, not copies of the fake values. Evidence stays local.

**Acceptance:** all of the following hold when you finish.

- `git ls-files` lists exactly `.gitignore`, `release-notes.txt`, and `rollback-plan.txt`.
- `release-notes.txt` has its three imported lines; `rollback-plan.txt` has its two imported lines.
- `cache-settings.conf` (three lines, including your colleague's local note), `deploy-summary.txt`, and `onboarding-draft.txt` still exist in the working directory with their supplied content.
- The history keeps the two supplied commits and adds at least: the fix, the commit that stops tracking the settings file, and the withdrawal of the fix. Every commit you created has a message that describes its change.
- No **learner commit** (any commit after the supplied `Ignore cache settings`) adds a marker line, and nothing was staged with a form that selects everything at once. The marker inside the supplied import commit is part of the starting state and does not fail this criterion; a learner commit that **removes** that line is expected and also does not fail it. To check, find the ID of `Ignore cache settings` in `git log --oneline`, then run `git log -p <that-id>..HEAD` and confirm that no line shown with a leading `+` (other than the `+++` file headers) contains the marker text.
- The repository has no remote and only local configuration.

A working result cannot compensate for a marker added by a learner commit, a missing justification, an affected unrelated file, or a claim you did not support with evidence. Any of those means **not yet passed**: resolve it and repeat the affected checks.

**Optional hints:** write down the state you want before running anything. A file's name describes someone's intention, not its content. Ask of each recovery: is the mistake in the working tree, in the staging area, or already recorded? `git revert` accepts any commit ID shown by `git log --oneline`, not only `HEAD`. If a command would affect more than one path, look for a narrower one.

Continue to the [questions](#questions) and [completion criteria](#completion-criteria) before removing anything.

### Challenge Cleanup

The challenge repository lives inside the same lab directory and is removed with it. After your evidence has been reviewed, follow [cleanup after assessment](#cleanup-after-assessment); its verification step checks `challenge-repo` together with `guided-repo`. Do not remove either repository separately, and do not delete a `.git` directory on its own.

## Knowledge Assessment

### Questions

Answer all ten before opening the [answer guidance](#answer-guidance). Explain the mechanism and the safe next action, not only a command name.

1. **Q1 — O1:** You edit a tracked file, stage it, then edit it again and commit without staging again. Which version does the commit contain, and where is the other version?
2. **Q2 — O1/O2:** Why does this lesson stage explicit paths and review `git diff --staged` before every commit? Why is an empty `git diff` not evidence that the next commit is empty?
3. **Q3 — O2:** Name the inspection that answers each question: what would the next commit record; what did the most recent commit change; which files are tracked; which commits touched one path.
4. **Q4 — O3:** For each situation, choose the operation and state what is lost: a file staged by mistake; an unwanted uncommitted edit to a tracked file; a recorded commit that must be withdrawn.
5. **Q5 — O3:** After a revert, why are there more commits than before rather than fewer? Why is a revert not a response to a recorded secret?
6. **Q6 — O4:** A teammate says: "I added the settings file to `.gitignore`, so the token in it is safe." The file was committed last month. Which observations would you collect, and what do they show?
7. **Q7 — O4:** After stopping tracking of that file and committing, where can its old content still be found? What must happen if the token is real, and who decides?
8. **Q8 — O4:** A pending file is named `deploy-summary.txt`. Why is the name not evidence that it is safe to record? What does a staged review catch, and what are two of its limits?
9. **Q9 — O5:** How can you tell which repository a Git command will affect? Why must the lab directory not be created inside an existing repository?
10. **Q10 — O5:** Why does this lab's cleanup use a recursive removal when the other Foundations modules forbid one? Name four conditions verified before it runs, and say what to do if one cannot be confirmed. How do you know the lab did not change your own Git configuration?

### Answer Guidance

Compare your explanations after answering. Equivalent correct reasoning is acceptable; a command name without its effect is not.

- **Q1:** The commit contains the staged version. Staging copies content at that moment. The later edit remains in the working tree as an unstaged change, visible with `git diff`.
- **Q2:** Explicit paths make each inclusion a decision; the staged diff is the last point at which unwanted content can be stopped before it becomes durable. `git diff` compares the working tree with the index for tracked files only. An empty result means no tracked file has an unstaged edit. It says nothing about the next commit (that is `git diff --staged`), and it does not prove everything is staged, because untracked files do not appear in it. A safe review combines `git status` (including untracked files), `git diff` (unstaged edits), `git diff --staged` (what will be recorded), and reading the content of any untracked file you are unsure about.
- **Q3:** `git diff --staged`; `git show HEAD` (or `git show --stat HEAD`); `git ls-files`; `git log --oneline -- <path>`.
- **Q4:** `git restore --staged <path>` changes only the index: a path that exists in `HEAD` is reset to its `HEAD` version, and a path absent from `HEAD` is removed from the index and becomes untracked (before the first commit, use `git rm --cached -- <path>` instead; if it reports that the pathspec did not match, nothing was staged under that path). It loses nothing when the working file already holds the staged content; if you edited the file after staging, the earlier staged version is lost as far as you can rely on, because it is in no commit and Git's internal copy is not guaranteed to be recoverable. `git restore <path>` overwrites the working copy and the discarded edit is unrecoverable, so inspect its diff and name one path. `git revert <commit>` adds an opposite commit and loses nothing; the original remains.
- **Q5:** A revert records a new commit rather than deleting one, which keeps history truthful and is safe for anyone who already has the original. The commit containing the secret is still present and readable, so the secret is still exposed.
- **Q6:** `git ls-files` shows the file is tracked; `git status` still reports its modifications; `git check-ignore -v` prints nothing for it. Ignore rules apply only to untracked files, so the rule never applied. The claim confuses an ignore rule with protection of recorded content.
- **Q7:** In every earlier commit that included it, readable with `git show <commit>:<path>` or `git log -p -- <path>`, in this repository and in every copy. A real token must be treated as exposed: report it to its owner and have it revoked or replaced through their process. Rewriting history is a separate, specialized decision that does not recall existing copies and is not made here.
- **Q8:** A name records an intention, not content; the fake token here sat under a field called `debug_context`. Reading the staged diff catches content you recognize before it is committed. It does not catch what you do not recognize or do not read, and it cannot undo display on screen or in recordings.
- **Q9:** `git rev-parse --show-toplevel` prints the repository that commands in the current directory affect, because Git searches the current directory and then its parents for `.git`. Inside an existing repository, lab commands could act on that project, and the new repositories would be nested.
- **Q10:** Git's internal storage consists of many read-only files with names the learner did not choose, so removal by individual name is impractical. Conditions include: recorded paths set and consistent; not the home directory; a real directory rather than a symbolic link; marker file present; physical location equal to the record; parent not inside a repository; each repository's top level, synthetic identity, and absence of a remote; typed confirmation. If any is inconclusive, stop and inspect manually without modifying the helper. The lab shell read an empty file in place of the global configuration, every setting used `--local`, and the configuration listing showed only `file:.git/config` origins.

Retry the [questions](#questions) where an explanation is missing, then review the criteria below.

## Completion Criteria

Completion is **self-assessed**, or a peer may review the same evidence. It is not certification, a security audit, or independently verified professional competence. Reading the page or reproducing commands without explaining the results does not count.

| Objective | Practice | Assessment | Required evidence | Pass criterion |
| --- | --- | --- | --- | --- |
| O1 — Record | Guided steps 3–5 | Challenge item 2; Q1, Q2 | Verified repository top level, the commit list with messages, and an explanation of the three places | Each commit you created records one selected change, was staged by explicit path, and has a descriptive message; the learner correctly states where a change is at each stage |
| O2 — Inspect | Guided steps 4–5 and 12 | Challenge item 1; Q2, Q3 | Unstaged and staged diffs before recording, log and commit inspection after, and the challenge's evidence-based description | Predictions agree with observed diffs; every statement in the description is supported by a named command's output |
| O3 — Recover | Guided steps 6, 10, and 11 | Challenge item 5; Q4, Q5 | Before-and-after observations for an unstaging, a discarded edit, and a revert, with a statement of what each cannot recover | Only the intended path is affected each time; the reverted content equals the earlier recorded content; the original commit remains in the log; limits are stated correctly |
| O4 — Protect | Guided steps 6–9 | Challenge items 3 and 4; Q6, Q7, Q8 | Staged review that caught the fake token; refused staging of an ignored file; tracked-file evidence against the ignore claim; old content read from history after tracking stopped; the real-exposure response | No commit the learner created adds a marker line. The guided commit labeled as an intentional mistake and the challenge's supplied import commit are starting states, not learner commits; the learner separates ignoring, stopping tracking, and history, and names revocation by the owner as the response |
| O5 — Clean up | Guided steps 1–3 and 12; cleanup | Challenge item 6; cleanup review; Q9, Q10 | Git version noted, top-level and no-remote observations for both repositories, configuration origins, passed verification action, typed confirmation, and final absence observation | Both repositories are inside the lab and independent; no remote exists; only local configuration is in effect; the lab directory is absent after a verified, confirmed removal; nothing outside it was touched |

**Pass:** every row and every assessment answer satisfies its criterion. Security and cleanup are mandatory; no compensating score applies. **Not yet passed:** any row lacks evidence, a marker line was added by a learner commit (the labeled guided mistake and the challenge's supplied commits are not learner commits), a staging form that selects everything was used, an unrelated file was changed or removed, or cleanup was run without a passed verification.

**Environment-limited attempt:** if the version check stops the lab, or a checkpoint cannot be reproduced in your environment, record the actual observation and your Git version, label the affected criterion **unverified**, and clean up safely. A correct explanation is conceptual evidence, but it does not replace the practical requirement. Do not invent a passing result, and do not install, upgrade, or reconfigure software only to obtain one.

Review O1–O4 and the boundary observations for O5 while both repositories exist. Then perform [cleanup](#cleanup-after-assessment) and use its result to finish O5. For remediation, use the [resume procedure](#resume-an-interrupted-session) for a known state, or clean up and start a fresh lab. Report documentation review, syntax checks, and actual execution separately.

## Next Steps

If locations, quoting, or exit statuses were uncertain, revisit [Safe Terminal File Operations](terminal-file-operations.md). For a fuller treatment of who can read a file and what belongs in shareable evidence, continue with [Local Access and Synthetic Secrets](local-access-and-secrets.md); it requires the same prerequisite as this module and neither module requires the other. The [Foundations learning path](../learning-paths/foundations.md) shows all three current modules and a suggested order.

Working with other people introduces topics that this module deliberately left out: remote repositories and authentication, cloning and exchanging commits, branches and merging, conflict resolution, and review workflows. Modules for these are **planned and not yet available**; no links exist yet. Rewriting history, hooks, and commit signing are later, more specialized subjects.

To improve this module, use the [curriculum authoring guide](../curriculum-authoring-guide.md).
