# Foundations Learning Path

This page is the starting point for the Foundations level of the DevOps Engineer Roadmap. It connects the three modules that currently exist, shows what each one requires, and suggests an order for working through them. The lessons themselves live in the linked modules; nothing here replaces them.

**Track:** `foundations` · **Level:** Foundations · **Modules:** 3

**Verification status:** the modules have received documentation, safety, and automated reference review. Validation on real systems is partial and covers **Linux only**; nothing has been validated on macOS. **Safe Terminal File Operations:** Linux L1 validation is complete, with documented limitations ([closure report](../validation/terminal-file-operations-linux-l1-closure.md)). **Local Access and Synthetic Secrets:** Linux L1 validation is complete for the executed scope, with one case (`LAS-P01`, behavior as root) still planned ([closure report](../validation/local-access-and-secrets-linux-l1-closure.md)). **Local Git Change Management:** an earlier revision has partial Linux L1 validation; the current revision was edited afterwards and needs targeted revalidation ([execution plan](../validation/git-change-management-linux-l1-execution-plan.md)). Do not treat the curriculum as fully validated. Each module states its verification status in its Overview; read it before you rely on an expected output.

## Who this path is for

Start here if you are new to working in a terminal, or if you want to check that your basic habits are safe before moving on. You need a Linux or macOS computer, an ordinary user account, and a personal directory you are allowed to write to. No cloud account, paid service, administrator access, or real credential is required. The Git module also needs Git 2.32.0 or later to be installed already; it checks the version and does not install or upgrade anything. Each module lists its own tools and environment assumptions under Prerequisites.

Foundations describes the scope of the learning, not a job title. Finishing these modules is evidence you assess yourself against written criteria; it is not a certification.

## Modules in suggested order

| Order | Module | Competency ID | Requires | Go to |
| --- | --- | --- | --- | --- |
| 1 | [Safe Terminal File Operations](../modules/terminal-file-operations.md) | `terminal-file-operations` | Nothing; start here | [Objectives](../modules/terminal-file-operations.md#learning-objectives) · [Completion criteria](../modules/terminal-file-operations.md#completion-criteria) |
| 2 | [Local Access and Synthetic Secrets](../modules/local-access-and-secrets.md) | `local-access-and-secrets` | `terminal-file-operations` | [Objectives](../modules/local-access-and-secrets.md#learning-objectives) · [Completion criteria](../modules/local-access-and-secrets.md#completion-criteria) |
| 3 | [Local Git Change Management](../modules/git-change-management.md) | `git-change-management` | `terminal-file-operations` | [Objectives](../modules/git-change-management.md#learning-objectives) · [Completion criteria](../modules/git-change-management.md#completion-criteria) |

In brief:

1. **Safe Terminal File Operations** — work inside a bounded local workspace: find your location, preserve and organize files, diagnose a path mistake, and verify cleanup.
2. **Local Access and Synthetic Secrets** — read ownership and permissions, apply least privilege, recover access, and decide what belongs in a report you share.
3. **Local Git Change Management** — record, inspect, and recover changes in a disposable local repository, and keep a synthetic secret out of new commits.

## Required prerequisites and suggested order

Only one relationship is required: complete **Safe Terminal File Operations** before either of the other two modules. Both of them rely on its skills for locating, quoting, creating, and removing files safely.

The second and third modules do not depend on each other. The order above is a suggestion, not a requirement: studying access and disclosure first gives useful background for the Git module's discussion of secrets, but that module introduces the minimum it needs. If you need Git sooner, take the third module directly after the first.

Stated as a list, where each line reads "requires":

- `terminal-file-operations` requires nothing.
- `local-access-and-secrets` requires `terminal-file-operations`.
- `git-change-management` requires `terminal-file-operations`.

## How to work through a module

Every module follows the same sequence, **Learn → Practice → Build → Validate**, under the same eleven headings:

1. Read the Overview, Prerequisites, and Learning Objectives to confirm you are ready.
2. Study Core Concepts before running commands.
3. Complete the guided laboratory in Hands-on Labs, in a disposable directory, checking each checkpoint.
4. Solve the independent task in Practical Challenges without a command recipe.
5. Answer the Knowledge Assessment questions before opening the answer guidance.
6. Compare your evidence with every row of Completion Criteria. Missing evidence for a mandatory outcome means *not yet passed*; retry that part.
7. Perform the module's cleanup, then use Next Steps to choose what follows.

Use only the synthetic data the modules provide. Keep your notes outside the laboratory directories, because cleanup removes them.

## After Foundations

No further learning paths or modules are available yet. Each module's Next Steps section names related topics that are planned, without links until they exist.

## For contributors

- The [curriculum authoring guide](../curriculum-authoring-guide.md) explains how modules are written, reviewed, and validated.
- The [curriculum contract](../curriculum-contract.md) defines the metadata and the checks behind this page.
- Track membership and suggested order are recorded in [the Foundations track record](../../curriculum/tracks/foundations.json), and the curriculum version in [the manifest](../../curriculum/manifest.json). Keep this page consistent with them.
