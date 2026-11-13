# Safe Terminal File Operations

## Overview

**Competency:** `terminal-file-operations` · **Level:** Foundations · **Assessment revision:** 2

You are preparing a small handoff folder for a fictional service. You need to preserve the original notes, organize a working copy, recover when a file appears to be missing, and remove your temporary work without touching anything else.

Follow **Learn → Practice → Build → Validate**: read the concepts, work through the guided lab, solve a different handoff challenge, then inspect the evidence against every completion criterion. The goal is to explain and verify your actions, not memorize commands.

**Verification status:** documentation and linked sources reviewed on 2026-11-12. The laboratory and challenge have **not been executed** as part of this delivery. Linux/macOS execution and cleanup verification remain pending; the outputs below are expected results, not recorded test results.

## Why It Matters

Operational work often starts with ordinary files: logs, configuration drafts, deployment notes, and incident evidence. A command run in the wrong directory can inspect the wrong artifact or overwrite useful evidence. A successful copy command alone does not establish that you copied the intended file.

Use a repeatable habit: establish your location, identify the source and destination, predict the change, perform it, and inspect the result. This habit transfers to later Git and access-control work. A local backup helps recover a lab mistake; it is not a production backup strategy.

## Prerequisites

There are no prerequisite competencies. You should be able to open a terminal application and type or paste one command at a time. A terminal is the window that carries your input and output; a shell is the program interpreting the commands.

Required environment:

- A local Linux or macOS computer with `/bin/sh` and standard utilities: `env`, `pwd`, `ls`, `mkdir`, `cat`, `printf`, `cp`, `mv`, `cmp`, `rm`, `rmdir`, and `test`. `cd`, `umask`, and `set` may be shell built-ins.
- An ordinary user account and a writable, personal local directory in which to create the lab. The [starting-directory walkthrough](#find-a-starting-directory) shows how to locate one without a file-manager shortcut. Avoid shared, synchronized, production, or repository directories.
- A filesystem supporting ordinary Unix permissions. If organizational policies or inherited access-control lists affect permissions, stop at the security checkpoint and seek environment-specific guidance; do not change system policy.

No cloud account, paid service, Docker, package installation, or elevated privilege is needed. Commands use POSIX-compatible syntax and options, without GNU-only flags. Exact prompts, diagnostic wording, listing layout, and permission suffixes can differ between systems. These portability choices still need execution testing on both platforms.

Run blocks in order and inspect each result. Do not paste the whole lesson as a script: some commands deliberately fail, and deletion prompts need your answer. Stop on any **unexpected** failure. All exercise writes belong inside the newly created lab directory; do not use existing personal files, credentials, symlinks, or imported directory trees.

## Learning Objectives

By the end, you can:

- **O1 — Locate:** from the lab root and a child directory, identify the current directory and resolve a relative path to the same file, explaining how it differs from an absolute path.
- **O2 — Preserve:** create synthetic text, copy it, rename a working copy, append a note, and demonstrate that the original and its backup remain byte-for-byte identical.
- **O3 — Diagnose:** explain an intentional missing-file error using the current directory, path, and exit status, then recover access to the existing file without recreating it.
- **O4 — Protect:** handle a filename containing spaces as one argument, verify restrictive creation permissions, and demonstrate that an attempted redirection overwrite leaves the original unchanged.
- **O5 — Clean up:** identify and remove only lab-owned files, remove empty directories, and verify removal of the lab while explaining the limits of deletion recovery.

## Core Concepts

### Location gives a path its meaning

A directory contains named entries. An absolute path starts at `/`; a relative path starts at your current working directory. `.` means that directory and `..` its parent. `pwd -P` shows the physical working-directory path; `cd` changes your shell's working directory. Neither moves your files. See the POSIX definitions of [pwd](https://man7.org/linux/man-pages/man1/pwd.1p.html) and [cd](https://man7.org/linux/man-pages/man1/cd.1p.html).

From the lab root, `./inbox/service notes.txt` selects the notes. From `./work`, the same file is `../inbox/service notes.txt`. Predict both before trying them. An error about a missing path can mean the starting directory is wrong, not that the file was deleted.

`ls` lists entries; `ls -a` includes names beginning with a dot. `ls -l` adds details, and `ls -ld .` describes the current directory itself. A hidden name is a display convention, not a security boundary. We inspect listings as humans rather than writing code that depends on their formatting. See [ls](https://man7.org/linux/man-pages/man1/ls.1p.html).

### The shell interprets your input before a utility runs

In `cat './inbox/service notes.txt'`, `cat` is the command and the quoted path is one argument. Without quotes, spaces can split arguments. Single quotes preserve literal text; double quotes allow variable expansion while keeping an expanded path together. Use straight ASCII quotes, not typographic quotes.

Later, `lab_root=$(pwd -P)` stores the output of `pwd -P` in a variable. `"$lab_root"` expands that value safely as one argument. The name is specific to this exercise; do not replace system variables. Prefixing relative filenames with `./` also avoids confusing a leading hyphen with a command option. Avoid wildcard deletion: a wildcard selects names before the removal command sees them.

`printf '%s\n' 'service=demo'` prints a string followed by a newline. The shell's `>` redirects output to a file, normally replacing its contents; `>>` appends. `cat` displays the small text files we create. A copy option cannot protect a file from a shell redirection. See [printf](https://man7.org/linux/man-pages/man1/printf.1p.html), [cat](https://man7.org/linux/man-pages/man1/cat.1p.html), and the shell reading below.

We enable [`set -C`](https://man7.org/linux/man-pages/man1/set.1p.html) (noclobber) to refuse ordinary `>` overwrites of existing regular files. It is a guardrail, not a backup: it does not stop appends, copying, moving, or deleting. Do not bypass it to make a failing example succeed.

### Copy, move, and verify are different operations

`cp` creates a separate copy of file contents; `mv` changes a file's location or name. Both can replace a destination. We use `-i` to request confirmation before replacement, but a new destination does not prompt. If a destination is an existing directory, a source can be placed inside it instead of receiving a new filename. Inspect destinations first. See [cp](https://man7.org/linux/man-pages/man1/cp.1p.html) and [mv](https://man7.org/linux/man-pages/man1/mv.1p.html).

`cmp` compares bytes. No output and exit status `0` mean equal; status `1` means different; a larger value means a comparison error. `$?` is the previous command's exit status, so inspect it immediately. For commands generally, `0` indicates success and a nonzero status needs interpretation. `&&` runs the next command only when the preceding one succeeds; `||` runs it only when the preceding one fails. Neither means “always continue.” See [cmp](https://man7.org/linux/man-pages/man1/cmp.1p.html).

### Bound the damage before working

We start a separate shell, set `umask 077`, and create a new directory. On an ordinary Unix-permission setup this yields owner-only directories (`drwx------`) and new text files (`-rw-------`). The mask affects new creations, not existing files; it is not encryption or a complete audit of access-control lists. See [umask](https://man7.org/linux/man-pages/man1/umask.1p.html).

In a long listing, the first character identifies the entry type (`d` for a directory, `-` for a regular file). The next three groups describe owner, group, and other permissions. `r` means read, `w` write, and `x` execution for a file or traversal for a directory; `-` means the corresponding permission is absent. The six trailing dashes above are the basic group/other check.

`rm -i` asks before removing a named file; it does not send it to a desktop Trash folder. `rmdir` removes empty directories and refuses nonempty ones. Refusal is useful evidence that something remains. Neither provides an undo facility. See [rm](https://man7.org/linux/man-pages/man1/rm.1p.html) and [rmdir](https://man7.org/linux/man-pages/man1/rmdir.1p.html). Our cleanup uses exact names, no recursive deletion, no force option, and no wildcard.

## Recommended Resources

Use these selectively while working, not as a prerequisite reading marathon. All linked pages below and the utility references above were opened and reviewed on **2026-11-12**. They are free to read without an account; the local exercises require no paid infrastructure.

| Resource and publisher | Read for | Scope and limitations |
| --- | --- | --- |
| [Shell Script Basics — Apple](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/shell_scripts/shell_scripts.html) | The relationship between commands, shell execution, and status; O1–O3 | Official archived primer, updated 2014; selected introductory reading, not a current macOS version guarantee |
| [Designing Scripts for Cross-Platform Deployment — Apple](https://developer.apple.com/library/archive/documentation/OpenSource/Conceptual/ShellScripting/PortingScriptstoMacOSX/PortingScriptstoMacOSX.html) | Why similar Unix tools can behave differently and why examples avoid shell extensions; O2/O4/O5 | Archived guidance; focus on portability, not its historical system-administration examples |
| [POSIX sh](https://man7.org/linux/man-pages/man1/sh.1p.html), [cp](https://man7.org/linux/man-pages/man1/cp.1p.html), [mv](https://man7.org/linux/man-pages/man1/mv.1p.html), and [cmp](https://man7.org/linux/man-pages/man1/cmp.1p.html) — IEEE/The Open Group text reproduced at man7.org | Look up shell execution, destination behavior, interactive replacement, and comparison status as needed; O1–O4 | POSIX.1-2017 / Issue 7, 2018 edition; standard definitions, not proof of a particular installed implementation |
| [POSIX umask](https://man7.org/linux/man-pages/man1/umask.1p.html), [rm](https://man7.org/linux/man-pages/man1/rm.1p.html), and [rmdir](https://man7.org/linux/man-pages/man1/rmdir.1p.html) — same publishers and reproduction | Creation permissions, removal prompts, and empty-directory cleanup; O4/O5 | Same standard edition; consult local manuals for platform details |

The Open Group website returned HTTP 403 during this review; the inspected standards text was its attributed reproduction at man7.org. Source review establishes documented intent, not that this lab ran successfully. Local manual pages such as `man cp` can help check your installed tools; press `q` to leave a pager.

## Hands-on Labs

### Practice: prepare and recover a service handoff

**Goal:** produce an unchanged original, an identical backup, and a reviewed working copy; explain a missing-path failure and verify two safety controls. Objectives: O1–O5.

#### Find a starting directory

Open your terminal application. Type `pwd -P` and press Enter to see your current location; do not type a prompt symbol such as `$`. Next, type `cd` with no argument to go to your account's home directory. This changes your shell's location, not any file's contents. Run each line separately, stopping if a command reports an error:

```sh
pwd -P
cd
pwd -P
ls -ld .
```

The second path identifies your home directory, often under `/home` on Linux or `/Users` on macOS; use the actual output, not those examples as a path to copy. `ls -ld .` describes that directory. On a personal computer with a local, unsynchronized home directory, use it as the parent of the new lab. The exercise will create only its own child directory there.

If your home directory is shared, synchronized, managed, or a repository, ask an instructor or administrator to identify an existing writable local directory. To enter that directory, type `cd`, a space, and its actual absolute path in single quotes; then run `pwd -P` and confirm the location. Do not guess a path or change its permissions. If you cannot identify a suitable location, stop before setup.

You have now practiced identifying and changing location before creating anything. The blocks that manage shell settings and error handling below are safety helpers: understand when to stop, but you do not need to memorize their control syntax to demonstrate file operations.

#### 1. Establish an isolated workspace

From the personal parent directory selected in Prerequisites, start the lab shell. The empty environment values below suppress an `ENV` startup file and persistent shell history for this child shell; they do not edit your configuration files. [`env`](https://man7.org/linux/man-pages/man1/env.1p.html) supplies these values only to the invoked shell. Do not change them to paths elsewhere.

```sh
env ENV= HISTFILE= /bin/sh
```

Run the following block **in that new shell**. A child shell is a separate command interpreter; its settings and variables do not change those of the shell that launched it. `if ... then ... else ... fi` chooses a success or failure branch. `unset` clears an old value so a failed setup cannot reuse a previous lab path. Without `-p`, `mkdir` refuses an already existing name. The `&&` chain records a location only after creating and entering the new directory successfully.

```sh
umask 077
set -C
unset lab_root
if mkdir ./terminal-file-operations-lab &&
   cd ./terminal-file-operations-lab &&
   lab_root=$(pwd -P); then
  printf 'Lab root: %s\n' "$lab_root"
  ls -ld .
else
  printf '%s\n' 'STOP: setup failed. Inspect the error before continuing.'
fi
```

**Checkpoint:** the printed path ends in `/terminal-file-operations-lab`, and the directory mode begins `drwx------`. Record the path privately so you can find this workspace again. On failure, the shell stays open, but do not proceed to step 2. If the name already exists, do not delete it to make room: choose another personal parent, or use [resume an interrupted session](#resume-an-interrupted-session) if it is your recorded lab. Stop if the permission expectation fails. Do not use `sudo` or change permissions outside the lab.

#### 2. Create and inspect synthetic input

```sh
mkdir ./inbox ./work ./backup
printf '%s\n' 'service=demo' 'status=ready' > './inbox/service notes.txt'
printf '%s\n' 'synthetic workspace marker; not a secret' > ./.lab-marker
ls -a .
ls -l './inbox/service notes.txt'
cat './inbox/service notes.txt'
```

**Checkpoint:** the listing includes `inbox`, `work`, `backup`, and `.lab-marker`. The notes have exactly two lines, `service=demo` and `status=ready`. Their mode begins `-rw-------`. A suffix such as `+` or `@` may indicate additional platform metadata; basic mode bits alone do not establish effective access. This exercise verifies basic creation permissions, not all permissions on your computer.

The marker illustrates that dotfiles still exist even when an ordinary listing omits them. All values are synthetic. Never replace them with real service configuration or tokens.

#### 3. Preserve the original and organize a working copy

```sh
cp -i './inbox/service notes.txt' './backup/service notes.txt'
cp -i './inbox/service notes.txt' ./work/draft.txt
mv -i ./work/draft.txt './work/handoff notes.txt'
printf '%s\n' 'review=complete' >> './work/handoff notes.txt'
cmp './inbox/service notes.txt' './backup/service notes.txt'
printf 'Comparison status: %s\n' "$?"
cat './work/handoff notes.txt'
ls -a ./work
```

**Checkpoint:** comparison is silent with status `0`; the handoff has three lines, with `review=complete` last; `draft.txt` is absent. Explain why modifying the copy did not modify the original. On a fresh run there should be no replacement prompts. If a prompt appears unexpectedly, answer `n` and inspect before continuing; replaying a block can append duplicate lines.

The original's specified two-line contents make it the reference for preservation. The three-line handoff serves a different purpose. When choosing an input or recovery copy, inspect its contents against the required state rather than trusting a reassuring filename such as `backup` or `ready`.

#### 4. Diagnose the safe failure

A teammate says the notes disappeared after entering the working directory. First predict the following result. Run `cd` separately and confirm success before the remaining lines:

```sh
cd ./work
pwd -P
cat './inbox/service notes.txt'
printf 'Read status: %s\n' "$?"
```

**Expected intentional failure:** `cat` reports a missing file and the printed status is nonzero. From `work`, the requested location is `work/inbox/service notes.txt`, which was never created. Error wording is platform-dependent. No file is modified by this failed read.

Before using the recovery below, state your hypothesis and one read-only check. Do not create another `inbox` to hide the mistake.

```sh
ls -a ..
cat '../inbox/service notes.txt'
cat "$lab_root/inbox/service notes.txt"
cd "$lab_root"
pwd -P
```

**Checkpoint:** both reads show the same original two lines; you return to the recorded lab root. Explain why the relative path changed but the stored absolute path still worked. Record the failure, status, diagnosis, and evidence of recovery.

#### 5. Verify overwrite protection and recovery options

At the lab root, deliberately attempt to replace the original using ordinary redirection:

```sh
printf '%s\n' 'wrong replacement' > './inbox/service notes.txt'
printf 'Overwrite status: %s\n' "$?"
cmp './inbox/service notes.txt' './backup/service notes.txt'
printf 'Comparison status: %s\n' "$?"
```

**Expected intentional failure:** noclobber rejects the redirection with a nonzero status. The comparison remains silent with status `0`. If the overwrite succeeds, the guard was not active: mark this checkpoint failed, inspect the files, and recover from the known-good backup. Do not report the protection check as passed merely because you repaired the result.

For an accidental change to the working copy, inspect the backup with `cat`, then restore only the working file with `cp -i './backup/service notes.txt' './work/handoff notes.txt'`. Confirm replacement only after reading both paths. Compare the restored copy with the backup, then append the review line once and recheck all three lines. This is recovery guidance, not an additional command to run on a correct result.

If an original was accidentally removed, the intact backup can supply its contents again. If both copies are gone, these commands have no undo: recreate **only this synthetic exercise** from its specified input and repeat the assessment. Do not generalize that recovery method to real evidence. Avoid moving on until every failed checkpoint is resolved.

#### 6. Retain the workspace for the challenge

Keep the same shell open and the lab directory in place. Continue to the [independent challenge](#practical-challenges), answer the [assessment questions](#questions), and review the [completion criteria](#completion-criteria) before returning to [cleanup](#cleanup-after-assessment). Do not run the cleanup blocks while reading ahead. If stopping now, you may clean up and start a fresh lab later; this does not count as completing the challenge.

#### Resume an interrupted session

Use this route after losing a session or when fresh setup refuses your own recorded, existing lab. If your lab shell is still open with a valid `lab_root`, keep using it and return with `cd "$lab_root"`, then inspect the state using the table below. Resuming does not recreate files or repeat appends.

If the lab shell closed, start a new one with the following command. If you just received a setup failure message and that child shell is still open, skip this command and use the restoration block directly; do not nest another shell.

```sh
env ENV= HISTFILE= /bin/sh
```

In the block below, **replace the quoted placeholder with the exact absolute lab path you recorded**, keeping the quotes. Do not use a guessed path. The placeholder deliberately does not identify a real workspace. If you did not retain the path, locate and identify your lab before continuing; do not run cleanup against another directory.

```sh
unset lab_root
if cd '/replace-with-your-recorded-path/terminal-file-operations-lab' &&
   lab_root=$(pwd -P); then
  umask 077
  set -C
  printf 'Resumed lab root: %s\n' "$lab_root"
  ls -ld .
  ls -a .
else
  unset lab_root
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

**Checkpoint:** compare the printed physical path with your recorded path, confirm the directory mode, and inspect the entries you recognize from the lab. The expected entries depend on where you stopped; `.lab-marker` exists only after step 2. Stop on an unexpected path, unfamiliar files, or a failed permission check. The mask does not repair existing permissions.

| State you observe | Safe next action |
| --- | --- |
| Only some step 2 files/directories exist | Inspect each existing file; create only the missing artifacts from step 2. Do not rerun its whole block. |
| Original and backup exist | Read both and compare them before using either for recovery. Continue only if the original has the specified two lines and the backup matches. |
| A draft or handoff already exists | Inspect it and continue from the unfinished operation in step 3. If the handoff already has its review line, do not append it again. Use step 5's recovery guidance for an incorrect working copy. |
| The guided lab is complete | Repeat the read-only observations as needed, then continue to the challenge. Inspect any existing challenge work before adding to it. |
| You cannot establish a trustworthy starting state | Inspect and remove only identified lab artifacts through the cleanup procedure, then perform fresh setup. Do not bypass noclobber or overwrite unknown files to force a restart. |

Choose one checkpoint to resume and record what was already present. This route restores the session; it does not automatically establish that any learning criterion passed.

#### Cleanup after assessment

Use this section after the [challenge](#practical-challenges), [questions](#questions), and [evidence review](#completion-criteria), or to stop an incomplete attempt safely. Finish inspecting evidence before removal. Keep personal evidence private; do not upload terminal transcripts with usernames or absolute personal paths. You can write a short redacted observation report in the lab and review it before deleting it.

First return to the known workspace and inspect it. `&&` prevents inspection from running when `cd` fails. If the displayed directory is not your lab, **stop**.

```sh
cd "$lab_root" && pwd -P && ls -a .
```

Remove challenge artifacts first if you created them, using [challenge cleanup](#challenge-cleanup). Remove any extra lab-owned report only after inspecting its explicit filename. Then run each of these commands separately, answering each prompt only after checking its target. `rm -i` permanently removes these named entries when you affirm; answer `n` when uncertain.

```sh
rm -i './work/handoff notes.txt'
rm -i './backup/service notes.txt'
rm -i './inbox/service notes.txt'
rm -i ./.lab-marker
rmdir ./work ./backup ./inbox
ls -a .
```

**Checkpoint:** the lab root contains only `.` and `..`. If a directory is not empty, inspect it with `ls -a` and remove only known lab artifacts individually. Do not add recursive or force flags. If the lab stopped partway through, remove only files that actually exist; a leftover `draft.txt`, for example, should be inspected before individual removal.

Finally, use this safety helper to leave the lab and remove its now-empty directory. `test -n` requires a nonempty recorded path, and the next test requires your physical location to match it. Only then may the block change directory and remove that exact absolute path. The absence check, success message, and `exit` are reached only after successful removal; the parent directory's other contents remain untouched.

```sh
if test -n "$lab_root" &&
   test "$(pwd -P)" = "$lab_root" &&
   cd .. &&
   rmdir "$lab_root" &&
   test ! -e "$lab_root"; then
  printf '%s\n' 'Lab directory removed.'
  exit
else
  printf '%s\n' 'STOP: cleanup is incomplete. The shell remains open for inspection.'
fi
```

**Checkpoint:** the success message appears only after removal and the check of the recorded absolute path; the child shell then ends, leaving the parent shell's settings unchanged. `test` reports conditions through its status; `! -e` checks that a path does not resolve to an existing entry. Here it is supporting evidence after a successful `rmdir`, not a substitute for that result. See [test](https://man7.org/linux/man-pages/man1/test.1p.html).

On failure, keep the shell open and inspect the error. Run `pwd -P` to see whether you are still inside the lab or have reached its parent. If `rmdir` reported remaining contents, inspect `ls -a "$lab_root"`, then return with `cd "$lab_root"` before removing any identified leftover by its explicit name. If the variable is missing or the directory cannot be located, use the recorded path and the resume procedure; do not guess. Retry the final block only from the verified lab root. After successful cleanup, return to the [completion criteria](#completion-criteria) to finish O5.

## Practical Challenges

### Build: prepare a different handoff without a command recipe

A fictional colleague needs a handoff for a pending deployment, but has left both current and obsolete notes. Decide which input belongs in the handoff and explain your choice while preserving both originals. Work under the existing lab root in a new `./challenge` directory. Use only synthetic text and the techniques you practiced; do not reuse the service-notes solution as your deliverable.

Produce this state using your own command sequence:

1. Prepare two source files in `./challenge/source`: `release checklist.txt` contains exactly `package=demo` and `check=pending`; `earlier draft.txt` contains exactly `package=demo` and `check=obsolete`. Each value is on its own line. These are supplied inputs; neither may be edited, renamed, or removed before assessment.
2. Inspect their contents and choose the input appropriate for the pending deployment. Explain which value supports your decision. Keep a byte-for-byte backup of that input under its original filename in `./challenge/backup`; preserve the other source as well.
3. Prepare a working copy of the selected input as `draft.txt` in `./challenge/output`, then rename it `release ready.txt` and append `review=approved` exactly once. The output must contain the pending checklist's two lines followed by that review line; the draft name must be absent.
4. A colleague reports that the selected source appears to disappear after entering `./challenge/output`. Reproduce a safe missing-file read with a relative path you choose, then diagnose the error using location and directory observations. Record the failed command and status; demonstrate corrected relative and absolute reads without recreating or relocating the source. No failing command is supplied: explain the path you chose and why it failed.
5. Show that creation permissions are restricted, spaced filenames remain intact, and an ordinary `>` overwrite of the selected source is rejected. Recompare it with its backup afterward, and inspect the other source against its specified original text.

**Deliverables:** the four inspected files (two originals, one backup, one handoff), the reason for selecting the pending checklist, a concise account of your operations, comparison/status observations, the failed read and corrected paths, overwrite-protection evidence, and the cleanup result. Associate them with O1–O5. Store any written notes inside the lab; redact personal path prefixes if discussing them with someone else.

**Acceptance:** all five conditions above hold, the input choice is justified by its contents, both expected failures are explained, both originals stay unchanged, and cleanup succeeds without touching unrelated files. An unexpected difference, missing evidence, unexplained failure, or out-of-scope write means **not yet passed**. Resolve the issue and repeat the affected checks.

**Optional hints:** sketch the desired directories first; distinguish a file's name from what its contents say about its use; create the backup before changing a copy. Verify outcomes rather than relying solely on successful command statuses.

**Next:** answer the [assessment questions](#questions) and review the [completion criteria](#completion-criteria) while the files still exist. Cleanup is the final practical check.

### Challenge Cleanup

After evidence review, return to the lab root and inspect `./challenge/source`, `./challenge/backup`, and `./challenge/output`. Remove the four final files with individual `rm -i` commands: `./challenge/source/release checklist.txt`, `./challenge/source/earlier draft.txt`, `./challenge/backup/release checklist.txt`, and `./challenge/output/release ready.txt`. Quote each spaced path. Remove the now-empty child directories with `rmdir`, then `./challenge`. Inspect unexpected leftovers individually rather than deleting the entire tree. Finish with the [guided lab cleanup](#cleanup-after-assessment). A reviewer should assess your choices and evidence before these artifacts are removed.

## Knowledge Assessment

### Questions

Answer all six questions before moving to the [answer guidance](#answer-guidance). Each answer must explain the mechanism and the safe next action, not just name a command. Keep any written answers inside the lab until you have reviewed them.

1. **Q1 — O1/O3:** Why does `./inbox/service notes.txt` work at the lab root but fail inside `work`? How can you prove the file still exists?
2. **Q2 — O2:** What evidence distinguishes copying, renaming, and appending in this exercise?
3. **Q3 — O4:** Why are quotes needed around the notes filename? Does naming it `.secret` protect its contents?
4. **Q4 — O2/O4:** Why does `cp -i` not protect a later `printf ... > file`? Does noclobber protect an append?
5. **Q5 — O4:** What does `umask 077` establish, and what does it not prove?
6. **Q6 — O5:** What should happen if `rmdir` reports that a directory is not empty? Can `rm` undo a removal?

### Answer Guidance

Compare your explanations with these points after answering. Equivalent correct reasoning is acceptable; naming a command without explaining its effect is insufficient.

- **Q1:** Relative paths start at the working directory. Inspect location and the parent, then use `../inbox/service notes.txt` or the recorded absolute path. Recreating the file would conceal the path error.
- **Q2:** The original and backup still match; the draft name is gone; the renamed handoff exists with one added line. A successful command status alone does not prove all three conditions.
- **Q3:** Quotes keep the spaced path as one argument. A dot-prefixed name only affects ordinary listings; access controls, not hiding the name, govern access.
- **Q4:** The shell performs redirection independently of `cp`; `set -C` guards ordinary replacement of regular files through `>`, not `>>`. Inspect content and backups after a mistake.
- **Q5:** The mask restricts permission bits on new creations in that shell. Inspect the resulting modes. It neither repairs existing files nor proves encryption or the absence of additional access-control-list permissions.
- **Q6:** Inspect remaining entries, including hidden ones, and remove only identified lab files. Do not force recursive deletion. Recovery requires an intact copy or other backup; `rm` has no undo facility.

Return to the [questions](#questions) to retry an explanation, or continue to the [completion criteria](#completion-criteria).

## Completion Criteria

Completion is **self-assessed**, or may be reviewed by a peer against the same criteria. It is not certification or independently verified professional competence. Reading the page or reproducing commands without explaining the result does not count as completion.

| Objective | Practice | Assessment | Required evidence | Pass criterion |
| --- | --- | --- | --- | --- |
| O1 | Lab steps 1 and 4 | Challenge item 4; Q1 | Working-directory observations and successful relative/absolute reads | Both paths identify the same source; learner correctly explains their starting points |
| O2 | Lab steps 2 and 3; recovery guidance | Challenge items 1–3; Q2/Q4 | Reason for selecting the pending checklist, source/backup comparison, both original texts, exact final output, absent draft name | Input choice agrees with its contents; comparison status is 0; output has exactly one review line; both originals are unchanged |
| O3 | Lab step 4 | Challenge item 4; Q1 | Failed command, immediate nonzero status, diagnosis, and successful recovery | Learner fixes the reference from the child directory without recreating or relocating the source |
| O4 | Lab steps 1, 2, and 5 | Challenge item 5; Q3–Q5 | Intact spaced filenames, directory/file modes, rejected overwrite status, and post-attempt comparison | Basic group/other mode bits are absent; overwrite fails and source still matches backup; learner explains control limits |
| O5 | Guided and challenge cleanup | Cleanup review; Q6 | Inspection before removal, exact deletion targets, empty-directory and final-absence observations | Only lab artifacts are removed; the lab directory is absent; learner explains refusal and recovery behavior |

**Pass:** every row passes and every assessment answer contains the reasoning in the guidance or an equivalent correct explanation. There is no compensating score: a missing security or cleanup check cannot be offset by other successes. **Not yet passed:** any row lacks evidence, any source is unintentionally changed, or any operation touches unrelated files. If you cannot execute a check in your environment, record it as unverified and leave completion pending.

Review O1–O4 and your explanations before deleting artifacts. Then perform the [challenge cleanup](#challenge-cleanup) and [guided lab cleanup](#cleanup-after-assessment), and use their results to finish O5. Do not mark the module complete while cleanup is pending.

For remediation, explain the failed checkpoint and choose either [resume](#resume-an-interrupted-session) for a known workspace or inspected cleanup followed by [fresh setup](#find-a-starting-directory). Do not blindly repeat creation or append commands. A repaired outcome must be accompanied by evidence that the failed checkpoint now passes.

## Next Steps

[Local Access and Synthetic Secrets](local-access-and-secrets.md) builds on scoped files and permissions. [Local Git Change Management](git-change-management.md) builds on preserving, inspecting, and recovering changes. Both are available with laboratory execution pending. Both require this competency independently; neither is a prerequisite for the other.

If paths still feel uncertain, draw the lab directory tree and predict reads from each child before running them. If safety checks feel mechanical, explain what each protects and what it leaves unprotected. For contributing improvements to this module, use the [curriculum authoring guide](../curriculum-authoring-guide.md).
