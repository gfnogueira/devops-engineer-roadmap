# DevOps Engineer Roadmap

A free, step-by-step curriculum for learning the practical skills behind DevOps work. Each module teaches a skill, lets you practice it safely on your own computer, asks you to apply it to a new problem, and shows you how to check your own evidence.

> **Public beta.** Welcome! This project is in public beta, so it is still growing and may contain mistakes.
>
> - **Available now:** the **Foundations** learning path, with **three instructional modules**. The rest of the curriculum is incomplete and will evolve.
> - **Where it has been checked:** Linux is the main environment where the material has been technically validated, and even there not every step has been tested. macOS has not received equivalent validation. Native Windows and WSL are not validated or supported in this beta.
> - **How to work safely:** follow each checkpoint, and stop when a step says **STOP** or when your output does not match what is described.
> - **No certification:** taking part in the beta, or finishing a module, does not grant a certification.
> - **Feedback is welcome:** see [How to give feedback](#how-to-give-feedback).

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
| Linux | Written for it, and the main environment for technical validation. Parts of the labs have been run on one Linux setup (Ubuntu 24.04, in a container); see the table below for limits. |
| macOS | Written for it, but **not yet tested**. Small differences in output are possible. |
| Windows (native) and WSL | **Not validated or supported** in this beta. |

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
| 3 | [Local Git Change Management](docs/modules/git-change-management.md) | Available, partly checked | Parts of the module have been run on Linux, including the cleanup procedure and the challenge (run with a reference solution, not by a learner). Most of the guided lab as now written has not been re-run. Not yet run on macOS. Read the module's verification status first; details are in the [validation note](docs/validation/git-change-management-validation-status.md). | English; [Portuguese draft](docs/locales/pt-BR/modules/git-change-management.md) |

Module 1 comes first. Modules 2 and 3 each need module 1, but not each other.

### How to read the status

- **"Run on Linux"** means the commands were executed in a disposable test environment and behaved as the module describes. It does not mean they were tested on every system.
- **Each module begins with a "Verification status" note** that states exactly what was and was not checked. Read it before you rely on an expected output.
- **English is the official text.** The Portuguese versions are drafts made with machine assistance and are **waiting for human review**; if they differ from the English, follow the English.

## How to give feedback

Use [GitHub Issues](https://github.com/gfnogueira/devops-engineer-roadmap/issues) to report a problem, a confusing explanation, or an idea. Choose one of three templates: **Bug report**, **Learning difficulty**, or **Improvement suggestion**.

- GitHub Issues is an **asynchronous, public** feedback channel. It is **not real-time technical support**, and replies may take time.
- **Everything you post is public.** Never share credentials, access tokens, private keys, secrets, or personal information. Do not paste sensitive terminal output or whole terminal sessions. Remove private paths, usernames, hostnames, and anything that identifies you before sharing a few relevant lines.

## Contributing and project status

This project is under active development. Community contributions are welcome through GitHub Pull Requests; see [CONTRIBUTING.md](CONTRIBUTING.md). For how modules are written and checked, see the [curriculum authoring guide](docs/curriculum-authoring-guide.md).

## Creator and maintainer

DevOps Engineer Roadmap was created by Guilherme Nogueira ([gfnogueira](https://github.com/gfnogueira)), who is the principal maintainer. This repository, [gfnogueira/devops-engineer-roadmap](https://github.com/gfnogueira/devops-engineer-roadmap), is the canonical upstream project.

## License

This project uses two licenses, depending on the kind of material.

| Material | License |
| --- | --- |
| Original educational documentation: `README.md`, `CONTRIBUTING.md`, and Markdown under `docs/` (modules, learning paths, guides, validation notes, ADRs, translated drafts) | [CC BY-SA 4.0](LICENSE-docs) |
| Software and tooling: `scripts/`, `tests/`, `package.json`, `tsconfig.json`, Dockerfiles, `.agents/`, `.github/` | [MIT](LICENSE) |
| Machine-readable curriculum data and schemas: `curriculum/` (manifest, tracks, competencies, JSON schemas) | [MIT](LICENSE) |
| Original code examples and shell snippets embedded in the educational Markdown | [MIT](LICENSE) |

**Embedded code examples.** Original code and shell snippets inside lessons and labs are MIT-licensed, so you can reuse them in your own projects without applying CC BY-SA to those projects. The surrounding explanatory text remains CC BY-SA 4.0.

**Curriculum data.** The structure, identifiers, prerequisites, and schemas under `curriculum/` are MIT. The `pt-BR` localization overlays under `curriculum/locales/` are translations of CC BY-SA educational text, so they are licensed under CC BY-SA 4.0.

**Translations.** Translated documentation, including the `pt-BR` drafts, is an adaptation of the English text and is licensed under CC BY-SA 4.0.

**Third-party material.** Links to and short references of external sources (for example official documentation) stay under their own licenses and are not relicensed by this project. Only original project material is covered above.

**Attribution.** When you reuse or adapt CC BY-SA material, credit "DevOps Engineer Roadmap by Guilherme Nogueira (gfnogueira)", link to this repository and to the license, and indicate whether you made changes. When you reuse MIT material, keep the copyright and license notice from [LICENSE](LICENSE). You do not need to ask for permission.

**Forks and adaptations** are allowed under the terms of the applicable license, and they do not need to be hosted in this repository. Contributions are accepted under these same licenses; see [CONTRIBUTING.md](CONTRIBUTING.md). Copyright in contributions stays with their authors.
