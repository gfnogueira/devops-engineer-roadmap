# DevOps Engineer Roadmap

A free, step-by-step curriculum for learning the practical skills behind DevOps work. Each module teaches a skill, lets you practice it safely on your own computer, asks you to apply it to a new problem, and shows you how to check your own evidence.

> **New here? Start with the guide:**
>
> - **English:** [Start Here](docs/start-here.md)
> - **Português (Brasil):** [Comece aqui](docs/start-here.pt-BR.md) *(rascunho de tradução, ainda sem revisão humana)*

## What is DevOps?

DevOps is a way of building and running software where the people who write a system and the people who operate it work together, with a lot of the repetitive work made reliable and repeatable. In daily practice that means being comfortable with the terminal, files and permissions, version control, automation, and careful handling of secrets such as passwords and keys.

This roadmap teaches those skills one at a time, starting with the ones everything else depends on.

## Who is it for?

People with basic computer skills who are new to DevOps or the command line, and people who want to check that their everyday habits are safe before moving on. You do not need a cloud account, paid software, or administrator access.

## What you can do after Foundations

The Foundations level currently has three modules. After working through them you will be able to:

- move around the file system, copy, rename, and remove files without touching anything you did not intend to;
- read file ownership and permissions, give a program only the access it needs, and decide what is safe to put in a report;
- record, inspect, and undo changes in a local Git repository, and keep a (fake) secret out of the history.

Finishing a module is something you judge yourself against written criteria. It is not a certification.

## Why start with the terminal?

Servers, containers, build tools, and cloud platforms are mostly operated through text commands. A mistaken command in the wrong place can overwrite or delete real work, so the first module teaches a safe habit: know where you are, predict what a command will do, run it, and check the result. Later modules reuse that habit.

## How each module works

Every module follows the same four stages:

**Learn → Practice → Build → Validate**

1. **Learn:** read the ideas before running anything.
2. **Practice:** follow a guided lab in a throwaway directory, checking each checkpoint.
3. **Build:** solve a new problem without a command recipe.
4. **Validate:** answer the assessment questions and compare your evidence with the completion criteria.

All exercises use fictional data. Nothing needs real credentials.

## Supported systems

| System | Status |
| --- | --- |
| Linux | Written for it. The labs have been run on one Linux setup (Ubuntu 24.04, in a container); see the table below for limits. |
| macOS | Written for it, but **not yet tested**. Small differences in output are possible. |
| Windows | Not covered. |

## How to start

1. Open [Start Here](docs/start-here.md) (or [Comece aqui](docs/start-here.pt-BR.md)).
2. Read the [Foundations learning path](docs/learning-paths/foundations.md) for the full picture.
3. Begin with the first module, [Safe Terminal File Operations](docs/modules/terminal-file-operations.md).

You only need this repository and a terminal. No other application is required.

## Available modules

Take them in this order. Time needed varies by learner, so no estimates are given.

| Order | Module | Availability | What has been checked | Languages |
| --- | --- | --- | --- | --- |
| 1 | [Safe Terminal File Operations](docs/modules/terminal-file-operations.md) | Available | Labs run on Linux with no failures. Not yet run on macOS. | English; [Portuguese draft](docs/locales/pt-BR/modules/terminal-file-operations.md) |
| 2 | [Local Access and Synthetic Secrets](docs/modules/local-access-and-secrets.md) | Available | Labs run on Linux with no failures; one extra check (running as an administrator) is still pending. Not yet run on macOS. | English; [Portuguese draft](docs/locales/pt-BR/modules/local-access-and-secrets.md) |
| 3 | [Local Git Change Management](docs/modules/git-change-management.md) | Available, with partial checking | Part of an earlier version was run on Linux. The module was edited afterwards, so it is being re-checked. Not yet run on macOS. | English; [Portuguese draft](docs/locales/pt-BR/modules/git-change-management.md) |

Module 1 comes first. Modules 2 and 3 each need module 1, but not each other.

### How to read the status

- **"Run on Linux"** means the commands were executed in a disposable test environment and behaved as the module describes. It does not mean they were tested on every system.
- **Each module begins with a "Verification status" note** that states exactly what was and was not checked. Read it before you rely on an expected output.
- **English is the official text.** The Portuguese versions are drafts made with machine assistance and are **waiting for human review**; if they differ from the English, follow the English.

## Contributing and project status

This project is under active development. A license has not been selected yet, so no reuse terms are offered at this time. For how modules are written and checked, see the [curriculum authoring guide](docs/curriculum-authoring-guide.md).
