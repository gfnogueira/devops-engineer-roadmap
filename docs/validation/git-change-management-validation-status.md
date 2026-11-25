# Local Git Change Management: Validation Status

This note records, for maintainers and reviewers, what has and has not been verified for the [Local Git Change Management](../modules/git-change-management.md) module. Learners need only the short verification status at the start of the module. The full case plan is in the [Linux L1 execution plan](git-change-management-linux-l1-execution-plan.md).

The detailed evidence files and results records are kept outside this repository and are not copied here. Phase labels (P46, P47, P48) refer to those separate maintainer records.

**Environment for every run listed below:** Linux only; a disposable container (Ubuntu 24.04, Git 2.43.0, `dash`).

## What has been executed

| Check | What it covered | Limits |
| --- | --- | --- |
| Earlier module revision (execution plan) | Part of the guided lab and challenge as written before later revisions. | Authoritative case counts live in the external results record. The module text changed afterwards. |
| P46 (Batch A and B) | Only the behaviors changed by the 2026-11-23 revision: lab-shell variable cleanup and the check for unexpected `GIT_*` variables, the same cleanup on resume, unstaging with `git restore --staged`, and recovery before the first commit. | Passed; one error-message wording correction followed. Ran before that correction and the current status note. The rest of the current text was not executed. |
| P47 | The cleanup procedure: the verification action, refusals of unsafe or altered laboratories, cancelling the removal prompt three ways, one removal of a disposable laboratory, and a refused repeat. | Laboratories were rebuilt for the test, not produced by completing the challenge. Answers were typed by a script through a pseudo-terminal, not by a person. An automated checker misread its own output; the saved transcript shows nothing unintended was removed. |
| P48 | The challenge, from its supplied setup to its last item, in a new laboratory (the guided lab was not run first), followed by the cleanup procedure on a verified copy of the completed laboratory. | Used a documented reference solution, not a learner's work. The reference-derived steps and acceptance criteria were met. The quality of written answers (item 1 description, item 4 real-credential statement) was not assessed. The cleanup confirmation was typed by a script. |

## Known open finding

A symbolic link inside the laboratory is listed by the cleanup verification but does not stop it. The checkpoint after it is what stops the learner.

## Not validated

- Most of the guided lab as currently written (it has not been re-run in full).
- The challenge solved by a learner, and a learner's written answers.
- Cleanup typed by a person, or run in the same shell session as the challenge.
- Real beginner testing of any part.
- macOS, native Windows, and WSL.
- Other Linux environments and other Git versions (the module requires Git 2.32.0 or later; only 2.43.0 was exercised).
- The knowledge questions.

Checkpoints in the module describe expected results, not recorded transcripts. A shell syntax check does not establish that a Git command behaves as described.
