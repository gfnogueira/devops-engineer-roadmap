# Local Access and Synthetic Secrets

## Overview

**Competency:** `local-access-and-secrets` · **Level:** Foundations · **Assessment revision:** 1

A fictional worker needs to read its configuration, while a support reader needs only a short status report. Configure the local files for those purposes, investigate an access problem, and justify which information belongs in the report. No service is installed or started: your ordinary user account represents the operator, and a file read represents the worker's read operation. This does not model separate service identities.

Follow **Learn → Practice → Build → Validate**: learn the access model, complete guided practice, make an independent disclosure decision, and review every objective's evidence before cleanup.

**Verification status:** the resources identified below were accessed and reviewed on **2026-11-12**. Commands received documentation, safety, portability, and shell syntax review; the laboratory and challenge have **not been executed**. Linux/macOS behavior, effective permissions, interruption recovery, and cleanup remain pending practical validation. Checkpoints describe expected or conditional outcomes, not recorded execution results.

## Why It Matters

A configuration file can contain information that a diagnostic report does not need. Making a file readable by everyone may hide an access problem while exposing that information. Conversely, removing all access can stop useful work without explaining the cause.

Use two questions together: **who needs which operation?** and **which information does the recipient need?** File permissions address the first question. Deliberately selecting report contents addresses the second. A restrictive file mode cannot make an unnecessary disclosure appropriate.

## Prerequisites

Required competency: [Safe Terminal File Operations](terminal-file-operations.md). Before starting, be able to identify your location, quote a path, create and inspect synthetic files, interpret an exit status immediately, and remove only known lab artifacts. Use that module's [starting-directory guidance](terminal-file-operations.md#find-a-starting-directory) if needed. Git knowledge is not required.

Required environment:

- A local Linux or macOS terminal with `/bin/sh`, standard utilities from the prerequisite, plus `id`, `chmod`, and `grep`. Their use is explained here. No package installation is required.
- An ordinary, non-administrative session and an existing writable personal directory on a local filesystem with Unix permissions. Avoid shared, synchronized, production, and repository directories.
- A disposable workspace containing only files you create for this lesson. Do not import personal files, symlinks, existing directory trees, or credentials. All exercise files and reports stay inside this workspace; reads of system identity and use of `/dev/null` do not modify system configuration.

There are no cloud accounts, external services, infrastructure charges, additional users, or administrative steps. Do not use `sudo`, change ownership, alter global settings, change permissions recursively, or source a configuration file. Commands aim for POSIX-compatible Linux/macOS usage; listings, error wording, filesystem features, and access policies vary. Do not treat a particular error message as guaranteed.

If the filesystem cannot represent the expected modes, ownership is unexpected, or access-control lists or organizational policies make the exercise unclear, stop and record the limitation. Use an appropriate environment with guidance rather than changing system policy. Run blocks in order, inspect each checkpoint, and stop on unexpected failures; do not paste the entire module as a script.

## Learning Objectives

- **O1 — Interpret:** identify the owner, group, and basic permission classes of lab files and directories; explain read, write, and execute/search for each object type.
- **O2 — Restrict:** configure a read-only synthetic service configuration and private working directories, verify their modes, and explain why `umask` does not repair existing files.
- **O3 — Diagnose:** compare a successful read with a controlled access attempt, record what actually happens, restore only required access, and distinguish configuration inspection from enforcement evidence.
- **O4 — Separate:** produce a report containing only authorized facts, exclude synthetic secrets and unnecessary internal details, and justify the disclosure decision and its limits.
- **O5 — Clean up:** inspect and remove only lab-owned artifacts, verify the workspace is gone, and explain why removal does not revoke an exposed credential or prove secure erasure.

## Core Concepts

### Ownership selects an access class

Each file and directory has a user owner and a group owner. `id` describes your process's user and groups; `id -u` prints its effective user ID. `ls -ld` describes a directory itself; `ls -l` describes file entries. Owner and group names in these listings are personal information: inspect them locally, not in a public transcript. See [POSIX id](https://man7.org/linux/man-pages/man1/id.1p.html).

Read a mode such as `-rw-------` as an entry type followed by three permission groups: owner, group, others. Here the owner has read and write; group and others have none. `d` instead of the initial `-` denotes a directory. Basic checks select the owner class for the owner, otherwise an applicable group class, otherwise others; they do not simply add all three classes. Supplementary groups can matter. The [Linux path-resolution reference](https://man7.org/linux/man-pages/man7/path_resolution.7.html) explains this model and Linux-specific privilege exceptions. We inspect ownership, not change it.

For example, these are **synthetic outputs**, not commands to paste or results from an executed lab. Names, numbers, dates, and spacing on your computer will differ:

```text
$ id
uid=1001(learner) gid=1001(lab) groups=1001(lab),1002(observers)
$ ls -l ./private/service.conf
-rw------- 1 learner observers 80 Nov 12 12:00 ./private/service.conf
```

- **Current identity:** `1001` is the numeric user ID; `learner` is its name. The effective user identity is the identity a process uses for ordinary access checks. In this ordinary session it matches the login identity. When real and effective IDs differ, `id` also shows the effective ID; `id -u` selects it directly. Changing identities is outside this lesson.
- **Groups:** `lab` is the current primary group here. Supplementary groups are additional memberships that can participate in group access checks; `observers` is one. A group is a way to associate accounts with a shared access class, not a separate user identity.
- **File ownership:** after the mode and link count (`1`), `ls -l` shows the owner `learner` and file group `observers`. The following fields are size, timestamp, and path. The file's group need not match your primary group.

Relate the two outputs: the current user owns this file, so the owner bits `rw-` apply under the basic model. Membership in `observers` does not replace them with the group's `---`. For a different, non-owner identity, matching group membership would select the group bits; otherwise the other bits apply. Use the real observations in the lab, without creating these example users or groups.

### The same letters mean different operations

These are the ordinary permission meanings; path access and additional controls still apply.

| Permission | Regular file | Directory |
| --- | --- | --- |
| Read (`r`) | Read the contents | List the entry names; this alone does not grant access to their contents or metadata |
| Write (`w`) | Modify or truncate contents | Change entries, including creating, removing, or renaming them; ordinary use also needs directory search permission |
| Execute (`x`) | Permit execution as a program, subject to format and other checks | Search/traverse the directory, including accessing a known child name; this alone does not list names |

A file needs no execute bit to hold configuration data. Giving a directory file-like read/write permissions without search can make its children inaccessible. A known child's path can be usable without permission to list all sibling names. Access to a nested file also depends on search permission along its path.

File write permission is not the same as permission to delete its name. Directory permissions govern removal, with additional restrictions such as sticky bits or access-control rules. A read-only file may therefore still be removable. See the POSIX [directory-opening rules](https://man7.org/linux/man-pages/man3/fdopendir.3p.html) and [removal rules](https://man7.org/linux/man-pages/man3/unlink.3p.html); these are optional references, not C programming prerequisites.

### Least privilege depends on the task

Our policy is owner-only access. Working directories need `rwx` for inspection, traversal, and managing entries. A prepared configuration needs owner read only; editable reports need owner read/write. Other accounts have no role in this local simulation. A report being suitable for a recipient does **not** require making it world-readable or sending it anywhere.

[`chmod`](https://man7.org/linux/man-pages/man1/chmod.1p.html) changes an existing object's mode. Symbolic forms name a class (`u`, `g`, `o`) and an operation: `u-r` removes owner read; `u+r` restores it. Numeric modes assign permission bits: read is 4, write 2, execute/search 1 in each class. Thus `700` is owner `rwx`, `600` owner `rw`, and `400` owner `r`, with no basic group/other access. Use explicit lab targets, then inspect; successful command status alone is insufficient. Ownership lets an ordinary owner change their file's mode even after removing its read bit, provided the path remains accessible. Never add broad access just to silence an error.

### Creation defaults are not repairs

[`umask`](https://man7.org/linux/man-pages/man1/umask.1p.html) removes permission bits from a program's requested creation mode. With ordinary shell text creation requesting `666`, `077` leaves `600`; with directory creation requesting `777`, it leaves `700`. This is bit removal, not a general arithmetic subtraction rule, and cannot add permissions the program did not request. See the POSIX [file-creation description](https://man7.org/linux/man-pages/man3/open.3p.html).

The mask applies to subsequent creations in that shell and its children. It does not change an existing file, repair an access-control list, or encrypt contents. Set it before creation, inspect results, and use a deliberate mode change for existing lab files. We keep the setting in a child shell rather than editing shell profiles. `set -C`, carried forward from the prerequisite, separately guards ordinary redirection overwrites; it is not a confidentiality control.

### Inspection and enforcement answer different questions

`ls` shows configured basic modes. An actual read tests one operation by one process at that moment. A successful owner read does not prove other users are blocked. Nor does removing the owner's read bit establish that every environment will reject the next read: privileges, filesystem behavior, and additional controls can affect the outcome. Access-control lists (ACLs) can express rules beyond the three basic classes. Listing suffixes such as `+` or `@` are platform-specific indicators of additional metadata, not a universal verdict on safety.

Basic permissions do not isolate programs running with the same permitted identity, erase copies already made, or provide encryption. This lesson does not audit ACLs, privileged access, backups, or a multi-user service. It tests bounded operations and requires explicit reporting when its expected denial cannot be demonstrated. Do not create another user or escalate privileges to force a result.

### Minimize the evidence you share

A secret is information whose disclosure can enable access or another sensitive action. Here every token begins `SYNTHETIC-NOT-A-CREDENTIAL-` and cannot authenticate to a real service. Never substitute real values. A hidden filename is not protection, and a report named “safe” can still contain a secret.

Build a report from an **allowlist**: the small set of facts its recipient is authorized to receive. Avoid copying whole configurations and trying to remove a few suspicious keys. A token may appear in an ordinary note under a different key. A literal search is useful for our known synthetic marker, but cannot certify arbitrary material as secret-free. Review every field and the complete report.

The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) explains least privilege and secret revocation. For a real suspected exposure, follow the responsible owner's incident process and revoke or replace the affected credential as appropriate. Tightening permissions or deleting a local copy does not undo disclosure. We practice the decision with synthetic data only. Do not put real secrets in command arguments, terminal output, screenshots, or shell history; changing history settings is not a guarantee against recording by other software.

Treat configuration as data. Running `. file`, `source file`, or a shell against it can execute its contents; none is needed here. Our read probe uses `cat file > /dev/null` to discard bytes rather than print the token. This proves readability only, not valid configuration, authentication, or a running service.

## Recommended Resources

All resources below were opened and their relevant content inspected on **2026-11-12**. They are free to read without an account. This laboratory requires no paid infrastructure. POSIX pages are IEEE/The Open Group **POSIX.1-2017 / Issue 7, 2018 edition** text reproduced at man7.org, not live tests of installed tools. Direct Open Group access failed with HTTP 403 during preparation; GNU manual requests timed out. Neither unavailable source is marked verified here.

| Resource and publisher | Selected reading and objectives | Scope and limits |
| --- | --- | --- |
| [POSIX id](https://man7.org/linux/man-pages/man1/id.1p.html) and [chmod](https://man7.org/linux/man-pages/man1/chmod.1p.html) — IEEE/The Open Group, reproduced at man7.org | Identity, explicit targets, symbolic and numeric modes; O1–O3 | Standard definitions; additional access-control mechanisms may differ by implementation |
| [POSIX umask](https://man7.org/linux/man-pages/man1/umask.1p.html) and [open](https://man7.org/linux/man-pages/man3/open.3p.html) — same attribution | Creation masks and requested file modes; O2 | Read the mask description; no C code or system-call programming is required |
| [POSIX opendir/fdopendir](https://man7.org/linux/man-pages/man3/fdopendir.3p.html) and [unlink](https://man7.org/linux/man-pages/man3/unlink.3p.html) — same attribution | Directory reading and removal permissions; O1/O5 | Optional mechanism reference, especially access-error conditions |
| [path_resolution](https://man7.org/linux/man-pages/man7/path_resolution.7.html) — Linux man-pages project | Path search, permission classes, and privileged bypass; O1/O3 | Inspected Linux man-pages 6.19 text; Linux details are not a macOS guarantee |
| [POSIX grep](https://man7.org/linux/man-pages/man1/grep.1p.html) — IEEE/The Open Group, reproduced at man7.org | Fixed-string counting and exit-status distinctions; O4 | A known-marker check, not a general secret detector |
| [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — OWASP | Sections 2.3 and 2.7.3 on access control and revocation; O4/O5 | Living guidance, reviewed on the date above; external services and advanced architectures are outside this lab |

Consult local manuals for your installed environment. Source verification and syntax review are distinct from executing the exercise; neither establishes Linux/macOS runtime compatibility.

## Hands-on Labs

### Practice: inspect a fictional worker configuration

**Goal:** establish a private workspace, prepare a read-only configuration, investigate a controlled read failure, and prepare a minimal report. Objectives: O1–O5. All values and observations concern the fictional `demo-worker`; no real worker runs.

#### 1. Establish the boundary

Use the prerequisite's [starting-directory guidance](terminal-file-operations.md#find-a-starting-directory) to enter an existing personal local directory. Confirm with `pwd -P` and `ls -ld .`. This is the parent of a new workspace, not a permission-change target. Start a child shell:

```sh
env ENV= HISTFILE= /bin/sh
```

These environment settings apply only to that shell and avoid an `ENV` startup file and a persistent history filename; they are not a security sandbox. In the child shell, inspect identity:

```sh
id
id -u
```

**Checkpoint:** use your ordinary account. If the effective ID is `0`, stop; use an ordinary terminal session. A nonzero ID alone does not prove absence of other privileges. Do not change account configuration. Keep identity output private.

Now run this setup helper. It records a workspace only after fresh creation and successful entry. A failed setup leaves the shell open for inspection.

```sh
umask 077
set -C
unset access_lab_root
if mkdir ./local-access-and-secrets-lab &&
   cd ./local-access-and-secrets-lab &&
   access_lab_root=$(pwd -P); then
  printf 'Lab root: %s\n' "$access_lab_root"
  ls -ld .
else
  printf '%s\n' 'STOP: setup failed. Inspect before continuing.'
fi
```

**Checkpoint:** record the physical path privately; it must identify the fresh `local-access-and-secrets-lab`. Expect directory mode `drwx------` and your ownership. `mkdir` without `-p` refuses an existing name. Do not delete an existing directory to force setup; use another suitable parent or [resume your known lab](#resume-an-interrupted-session). If ownership, mode, or location is wrong, stop before creating content.

#### 2. Create synthetic configuration and inspect access

At the verified lab root, create two working directories and one synthetic configuration:

```sh
mkdir ./private ./reports
printf '%s\n' 'service=demo-worker' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-ALPHA' 'mode=training' > ./private/service.conf
ls -ld . ./private ./reports
ls -l ./private/service.conf
umask
cat ./private/service.conf > /dev/null
printf 'Initial read status: %s\n' "$?"
```

**Checkpoint:** directories have basic mode `700`; configuration has `600`. Identify their owner and group from the listings and compare ownership with `id`. Group names can reflect directory inheritance; do not assume a particular group name or change it. The mask should represent `077`, though formatting can differ. The initial read must return `0`. If it does not, investigate location, path, ownership, and environment before introducing the intentional fault.

Explain why `private` needs search as well as read permission, why editing its entries requires write permission, and why the text file needs no execute bit. Do not parse `ls` output as a portable machine format; inspect it as a human.

#### 3. Apply the read-only policy

The configuration is prepared and only needs reading for the remaining exercise. Remove its owner write permission by assigning the explicit final mode:

```sh
chmod 400 ./private/service.conf
ls -l ./private/service.conf
umask 077
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Read-only configuration status: %s\n' "$?"
```

**Checkpoint:** both listings show `-r--------`, and the read succeeds. Reapplying the creation mask did not turn the existing file back into `600`. Explain why directories remain `700`, why the configuration can be `400`, and why a report you are still preparing can be `600`. These are task-specific choices, not universal production defaults. Mode inspection is a configuration check, not proof that every other identity is excluded.

#### 4. Compare an access attempt and recover

Remain at the lab root. You will remove only the owner's read bit from the synthetic file. Its parent directories stay accessible, so the owner can restore the file's mode. Do not write to the file while it is unreadable.

```sh
chmod u-r ./private/service.conf
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Restricted read status: %s\n' "$?"
```

**Inspect before diagnosing:** the configured basic mode should now be `----------`. Record the listing, actual diagnostic, and immediate status. On an ordinary unprivileged Unix-permission filesystem the new read is expected to be denied. Exact wording is not prescribed. A nonzero status alone does not establish that the cause was permissions: compare the same previously readable path, the successful mode change, and the diagnostic. A missing-path error is a different failure.

| Observation | Interpretation and next action |
| --- | --- |
| Mode changed; previously readable file now reports an access denial | Evidence for this read attempt under the current identity. Explain the changed bit, then restore below. |
| Read succeeds despite the expected restrictive mode | The expected enforcement was not demonstrated. Record that fact; restore below and seek guidance about the environment. Do not claim a denial or attempt stronger system changes. |
| `chmod` fails, mode is unexpected, or the read reports another error | Fault setup or environment is unresolved. Inspect location, ownership, and the exact path. Do not credit this as an access-denial test. |

Restore only the read bit, then verify both mode and function:

```sh
chmod u+r ./private/service.conf
ls -l ./private/service.conf
cat ./private/service.conf > /dev/null
printf 'Recovered read status: %s\n' "$?"
```

**Checkpoint:** mode is `400` again and the read status is `0`. Explain why restoring read did not require write or execute permission on the file. Record the before/attempt/after sequence without file contents. If restoration fails, stop and use [recovery guidance](#resume-an-interrupted-session). If denial was not demonstrated, configuration inspection can still be recorded, but the O3 enforcement criterion remains **unverified**; you may inspect later concepts and clean up, not declare full completion.

#### 5. Prepare only the report the recipient needs

The fictional support reader is authorized to receive the service name, the result of the recovered local read, and confirmation that credentials were omitted. They do not need the token, a configuration copy, usernames, absolute paths, or raw identity output. There is no actual recipient or upload.

After the recovered read succeeds, create the report from those allowed facts:

```sh
printf '%s\n' 'service=demo-worker' 'check=config-readable' 'credential=omitted' > ./reports/status.txt
ls -l ./reports/status.txt
cat ./reports/status.txt
grep -F -c 'SYNTHETIC-NOT-A-CREDENTIAL-' ./reports/status.txt
printf 'Marker-search status: %s\n' "$?"
```

**Checkpoint:** the file has mode `600` and exactly the three specified lines. `grep -F` searches literal text; `-c` prints a matching-line count rather than the matching line. For this check, expect count `0` and status `1` (no match). Status `0` means the marker was found and the report fails; status greater than `1` is a check error, not a clean result. Investigate an unreadable or missing report rather than treating every nonzero status as success.

Read the whole report against the allowlist too. Absence of this one marker does not detect other secrets, renamed fields, partial values, or personal details. The report remains locally private despite being suitable in content for the stated reader. This is **not** evidence that a service started or that the earlier denied-read test passed.

If a report contains unintended content, keep it private, inspect it, remove only that known synthetic report with `rm -i ./reports/status.txt`, and recreate it from the allowed facts. Do not bypass noclobber or append a correction to an already disclosing report. Explain why that repairs this synthetic artifact but would not revoke a real exposed credential.

#### 6. Review before removal

Keep the same shell and workspace for the [independent challenge](#practical-challenges). Answer the [questions](#questions), compare the [answer guidance](#answer-guidance), and review [completion criteria](#completion-criteria) while artifacts still exist. Then perform [cleanup](#cleanup-after-assessment). Any private notes must stay inside the lab and contain observations rather than secret values. You may instead clean up an incomplete attempt; that does not establish completion.

#### Resume an interrupted session

Do not rerun fresh setup or creation blocks over an existing lab. If the child shell remains open and `access_lab_root` is valid, return to that recorded root and inspect state. If the shell closed, start a new child shell with `env ENV= HISTFILE= /bin/sh` before the restoration block below. Do not nest shells unnecessarily.

Replace the quoted placeholder with the **exact recorded physical lab path**. The placeholder is deliberately unusable. If you cannot identify your workspace, stop rather than guessing.

```sh
unset access_lab_root
if cd '/replace-with-your-recorded-path/local-access-and-secrets-lab' &&
   access_lab_root=$(pwd -P); then
  umask 077
  set -C
  printf 'Resumed lab root: %s\n' "$access_lab_root"
  id
  ls -ld .
  ls -a .
else
  unset access_lab_root
  printf '%s\n' 'STOP: the recorded lab could not be opened.'
fi
```

Confirm the same ordinary identity, recorded location, ownership, root mode, and recognizable entries before proceeding. Inspect existing child directories and named files individually; do not follow unfamiliar symlinks or repair unknown objects. The exercise never removes search from its directories.

| Interrupted state | Safe recovery |
| --- | --- |
| Setup or creation was partial | Inspect what exists; create only missing, specified artifacts. Noclobber should refuse replacement of existing files. |
| Guided configuration is `600` | It may be awaiting the read-only policy. Inspect the setup state and continue from step 3. |
| Guided configuration is `000` after the controlled fault | After confirming its identity and parent path, use step 4's `chmod u+r` recovery. Inspect `400` and retry the read. A recovered state does not prove an earlier denial occurred. |
| Guided configuration is `400` | Retry the read-only observations; do not repeat creation or infer completion from the mode alone. |
| Report already exists | Inspect its complete contents and modes, then repeat validation. Do not append a second report. Use step 5's replacement guidance only if needed. |
| Challenge work exists | Inspect its named inputs and output; retain original input text. If its identified configuration was left at `000` or `200` by the chosen fault, restore only that file with `chmod 400 ./challenge/private/service.conf`, inspect its mode, and retry the read. Do not infer that the denial was observed; repeat missing observations before resuming the first unfinished requirement. |
| Directory access is unexpectedly blocked or identity is unfamiliar | Stop. Do not use recursive permission changes, ownership changes, or escalation. Record the limitation and obtain environment-specific guidance. |

If synthetic input text was accidentally changed and cannot be trusted, inspect and clean up the known attempt, then start fresh; do not invent evidence of preservation. Record which checkpoint you resumed and repeat any observations you did not retain. Shell settings do not repair existing artifacts.

#### Cleanup after assessment

Review the evidence first. Deletion is permanent removal of these names, not desktop Trash or secure erasure. Nothing here requires changing permissions on the parent directory or other personal files.

Use this helper to require a nonempty recorded path before entering it. Confirm the printed physical path matches your recorded lab and inspect its contents. If anything is unfamiliar or the helper fails, stop before removal.

```sh
if test -n "$access_lab_root" &&
   cd "$access_lab_root" &&
   test "$(pwd -P)" = "$access_lab_root"; then
  pwd -P
  ls -a .
else
  printf '%s\n' 'STOP: workspace verification failed. Do not remove anything.'
fi
```

If you created challenge artifacts, follow [challenge cleanup](#challenge-cleanup) first. Inspect any extra lab-owned notes by exact name and remove them individually. At the verified root, inspect `./private` and `./reports`. Then run these removals one at a time, confirming each target only when certain:

```sh
rm -i ./reports/status.txt
rm -i ./private/service.conf
rmdir ./reports ./private
ls -a .
```

For a partial attempt, remove only artifacts that exist. A read-only or unreadable configuration can ordinarily still be removed from its writable, searchable parent; file write permission is not the deletion control. If removal fails, inspect the actual cause. Do not broaden permissions or add recursive/force options. Empty-directory refusal is a reason to inspect leftovers, including hidden entries, not to erase the tree.

**Checkpoint:** only `.` and `..` remain in the lab root. This final helper verifies location again before leaving and removes the exact recorded empty directory. Success and shell exit require both removal and an absence check:

```sh
if test -n "$access_lab_root" &&
   test "$(pwd -P)" = "$access_lab_root" &&
   cd .. &&
   rmdir "$access_lab_root" &&
   test ! -e "$access_lab_root"; then
  printf '%s\n' 'Lab directory removed.'
  exit
else
  printf '%s\n' 'STOP: cleanup is incomplete. Inspect before retrying.'
fi
```

On failure the shell stays open. Inspect `pwd -P`: you may now be in the parent. If the recorded lab remains, inspect it, return to it, and remove only identified leftovers before retrying. If the variable is missing, use the resume procedure; never guess a deletion path. On success the parent shell retains its prior settings. Record the cleanup observation, then finish O5 in the [completion criteria](#completion-criteria). Do not infer that backups, terminal recordings, or earlier copies elsewhere were erased.

## Practical Challenges

### Build: choose a safe support response

A fictional support request asks whether `demo-worker` can read its configuration. Someone proposes attaching a diagnostic draft, while another person suggests granting everyone read access to prevent future failures. Decide how to respond with the least required access and information. The support reader is authorized to receive **only the service name, the observed final read result, and a statement that confidential details were omitted**.

Use a new `./challenge` directory inside the same verified lab. Do not rerun setup if it already exists; inspect/resume instead. The following are **supplied synthetic inputs**, not a solution recipe. With `umask 077` and `set -C` active, create them once, stopping on any failure:

```sh
mkdir ./challenge && mkdir ./challenge/private ./challenge/reports
printf '%s\n' 'service=demo-worker' 'api_token=SYNTHETIC-NOT-A-CREDENTIAL-BETA' 'mode=training' > ./challenge/private/service.conf
printf '%s\n' 'service=demo-worker' 'question=can-the-configuration-be-read' > ./challenge/private/request.txt
printf '%s\n' 'service=demo-worker' 'context=SYNTHETIC-NOT-A-CREDENTIAL-BETA' 'internal_note=operator-only' > ./challenge/private/diagnostic-draft.txt
ls -ld ./challenge ./challenge/private ./challenge/reports
ls -l ./challenge/private/service.conf ./challenge/private/request.txt ./challenge/private/diagnostic-draft.txt
```

**Input checkpoint:** directories are `700`, files `600`, all owned by your ordinary identity. Inspect the three files locally against the supplied text; these are fake values. A complete terminal transcript is not a support response. Preserve all three input texts throughout the assessment; mode changes to the configuration are allowed.

Use your own command sequence and provide these results:

1. **Interpret and plan (O1/O2):** explain the owners, groups, and each object's required operations. Give a final permission plan: directories `700`, read-only configuration `400`, request/draft and editable response `600`. Classify the draft's fields against the recipient's authorized information, even though it has no `api_token` field. No group or other access is required.
2. **Diagnose and recover (O3):** establish a successful configuration read, then choose a change to **only that file's owner read bit** that should block a new read. Do not change directories or grant new access. Record the actual mode/status/diagnostic, explain the cause or environmental limitation, and restore the final `400` policy. Apply the same enforcement rules as guided step 4; do not fabricate a denial. A successful final read is mandatory, but cannot substitute for missing denial evidence.
3. **Choose the disclosure (O4):** decide whether the proposed attachment and broad permission change meet the request. Create `./challenge/reports/response.txt` from only the three authorized facts. The read result must reflect your observation. Keep the reasoning separately in private notes or explain it orally; do not put tokens, internal notes, usernames, paths, or the permission-debugging transcript into the response.
4. **Validate (O1/O2/O4):** inspect final modes, confirm all three input texts are unchanged, review the full response against its allowed content, and run a known-marker check with its count/status interpreted correctly. Explain why renaming a field or tightening a disclosing report's mode would not make the proposed content appropriate to send.
5. **Clean up (O5):** after assessment, remove only the challenge artifacts and finish the parent lab's cleanup. No actual sharing or upload is required.

**Deliverables:** the three unchanged input texts and one response, the final mode observations and their rationale, a before/attempt/after read record, the disclosure decision, marker-check result plus full content review, and verified cleanup. Evidence remains local. All five requirements must pass; a working read cannot compensate for disclosure, excessive access, an unverified enforcement attempt, or missing cleanup.

**Optional hints:** distinguish what a filename suggests from what its contents contain. Classify the fields before composing a response. Read access and permission to share are different decisions. Keep a short private record of which observation supports each claim.

Continue to the [questions](#questions) and [completion criteria](#completion-criteria) before removing artifacts.

### Challenge Cleanup

At the verified lab root, inspect `./challenge/private` and `./challenge/reports`. Remove the four final files individually with `rm -i`: `./challenge/reports/response.txt`, `./challenge/private/diagnostic-draft.txt`, `./challenge/private/request.txt`, and `./challenge/private/service.conf`. Inspect and remove any extra lab-owned notes by their explicit names. For an incomplete attempt, remove only files that actually exist.

Use `rmdir` on the now-empty `./challenge/reports` and `./challenge/private`, then `./challenge`. Inspect any refusal instead of escalating or using recursive removal. Return to [parent lab cleanup](#cleanup-after-assessment). Review the disclosure decision and input preservation before deleting their evidence.

## Knowledge Assessment

### Questions

Answer before opening the [answer guidance](#answer-guidance). Explain mechanisms and safe actions, not only command names.

1. **Q1 — O1:** Explain all three permission letters for files and directories. Why can a directory permit access to a known child without allowing a list of names? Does a read-only file necessarily resist deletion?
2. **Q2 — O1/O2:** Why does the configuration end at `400`, its working directories at `700`, and the report at `600`? What would be wrong with “make everything executable and readable by everyone”?
3. **Q3 — O2:** What does `umask 077` do to ordinary new text files and directories? Why did setting it again leave the existing `400` configuration unchanged?
4. **Q4 — O3:** A read succeeds with basic mode `000`. What was actually verified, what remains unverified, and what is the safe next action? Would a missing-file error prove access denial?
5. **Q5 — O1/O3:** Why can the owner normally restore read permission on an unreadable file without `sudo`? Why would removing search from its parent complicate that recovery?
6. **Q6 — O4:** The diagnostic draft has no `api_token` field. Is it appropriate to attach? Explain the allowed content and what a zero matching-line count can and cannot prove.
7. **Q7 — O4/O5:** A real credential was already disclosed. Would changing its file mode, renaming the file, or deleting the local report revoke it? How does that differ from repairing this synthetic exercise?
8. **Q8 — O5:** Cleanup reaches the parent but `rmdir` fails. What should remain open, what should you inspect, and when may cleanup be reported as successful?

### Answer Guidance

- **Q1:** File read/write concern contents and execute concerns running a program. Directory read concerns names, write concerns entry changes, and search concerns traversal/lookup. Listing and known-name access differ; the child still has its own controls. Removal depends on the parent and additional rules, not just file write permission.
- **Q2:** The prepared configuration needs reading, directories need inspection/traversal/entry management, and the report is editable. Other identities have no role. Broad access grants unnecessary capabilities; configuration data needs no execute bit. These policies fit this scenario and are not a complete production access model.
- **Q3:** The mask filters requested creation bits, ordinarily yielding `600` and `700` here. It does not retroactively modify the existing configuration or grant bits absent from a requested mode. Inspect rather than infer results.
- **Q4:** Inspection establishes the configured basic mode; the read establishes success for that process. Expected denial remains unverified. Restore the intended mode, record the limitation, and seek a suitable environment without escalation. A path error must be diagnosed separately. No successful final read can retroactively prove a denied attempt.
- **Q5:** Ownership normally permits mode changes independently of the file's read bit, while pathname lookup still needs directory search. Keep directories accessible and restore only the intended file bit. Unexpected ownership or access policy is a stop condition, not permission to change unrelated objects.
- **Q6:** Reject the attachment: the `context` field contains the same synthetic token, and the internal note is unnecessary. Compose only the service name, honest read result, and omission statement. Interpret search status as well as count, then inspect every field. A literal search detects only its known pattern.
- **Q7:** Local changes do not revoke a real credential or retrieve copies. Follow the responsible owner's incident process and revocation/replacement procedure. Here removal/recreation can fix the fake report, but the explanation must acknowledge that limit; no real credential operation occurs.
- **Q8:** Keep the shell open. Confirm location and the recorded lab path, inspect remaining entries, and remove only identified artifacts. Retry from the verified lab root. Report success only after successful empty-directory removal and absence verification; do not claim secure erasure.

Equivalent correct reasoning is acceptable. Retry the [questions](#questions) where the explanation is missing, then review the criteria below.

## Completion Criteria

Completion is **self-assessed**, or a peer may review the same evidence. It is not certification, a security audit, or independently verified professional competence. Source review and following a command recipe alone do not establish completion.

| Objective | Practice | Assessment | Required evidence | Pass criterion |
| --- | --- | --- | --- | --- |
| O1 | Guided steps 1–2 | Challenge items 1/4; Q1/Q2/Q5 | Identity/ownership observations, decoded modes, explanation of six file/directory permission meanings | Owner and group are identified; file contents, directory names, traversal, and deletion are correctly distinguished |
| O2 | Guided steps 2–3 | Challenge items 1/4; Q2/Q3 | Initial/final modes, unchanged existing mode after reapplying mask, task-specific permission rationale | Directories are `700`, configurations `400`, reports and challenge request/draft `600`; no basic group/other bits or unintended execute bits; creation versus repair is explained |
| O3 | Guided step 4 and recovery guidance | Challenge item 2; Q4/Q5 | Same-file successful baseline, configured fault, actual denied read with diagnostic/status, and minimal restoration followed by a successful read | Guided and challenge attempts demonstrate access denial attributable to the intended fault; restored modes and reads pass; configuration inspection is not substituted for enforcement |
| O4 | Guided step 5 | Challenge items 3/4; Q6/Q7 | Minimal report/response, reason for rejecting the draft and broad-access proposal, complete content review, marker count/status, preserved challenge input texts | Only authorized facts appear; synthetic tokens and internal/personal details are absent; count `0` with status `1` supports the known-marker check; limitations and exposure response are explained |
| O5 | Guided and challenge cleanup | Cleanup review; Q7/Q8 | Inspected deletion scope, removal of named artifacts, empty-directory removal and final absence observation | Only lab artifacts are removed; recorded lab is absent; no forced/recursive cleanup or false erasure/revocation claim |

**Pass:** every row and all assessment answers satisfy their criteria. Security and cleanup are mandatory; no compensating score applies. **Not yet passed:** any row lacks evidence, the report discloses forbidden information, inputs are unintentionally changed, or an operation affects unrelated files.

**Environment-limited attempt:** if expected denial does not occur, label O3 enforcement **unverified**, retain the actual observation, and restore/clean up safely. A correct explanation earns conceptual evidence but does not waive the practical requirement. Repeat the affected exercise in a suitable ordinary-user environment with guidance before claiming completion. Do not alter system policy or invent a passing result.

Review O1–O4 while artifacts exist, perform [challenge cleanup](#challenge-cleanup) and [parent cleanup](#cleanup-after-assessment), then finish O5. For remediation, use the [resume procedure](#resume-an-interrupted-session) for a known state or inspected cleanup followed by a fresh attempt. Report documentation review, syntax checks, and actual execution separately.

## Next Steps

If path diagnosis or cleanup is uncertain, revisit [Safe Terminal File Operations](terminal-file-operations.md). The [Foundations learning path](../learning-paths/foundations.md) shows where this module sits among the current modules. To improve this module, use the [curriculum authoring guide](../curriculum-authoring-guide.md).

[Local Git Change Management](git-change-management.md) is available, with laboratory execution pending. It shares `terminal-file-operations` as its required prerequisite; this module is not an additional required dependency. The Git module addresses staging and history, while this module establishes local access and disclosure decisions. Separate service identities, ACL administration, secret managers, and real incident handling require further learning and are outside this Foundations exercise.
