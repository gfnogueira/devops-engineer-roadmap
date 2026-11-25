# Contributing

Thank you for helping improve the DevOps Engineer Roadmap, a beginner-focused educational project. Community contributions are welcome through GitHub Pull Requests.

## Welcome contributions

- Corrections to technical inaccuracies.
- Clearer explanations.
- Improvements to laboratory instructions.
- Better examples.
- Accessibility improvements.
- Translation improvements.
- New curriculum proposals (please open an issue first).

## Workflow

1. Open an [issue](https://github.com/gfnogueira/devops-engineer-roadmap/issues) to discuss any substantial change. Typo fixes and small corrections do not need one.
2. Fork the repository.
3. Create a branch.
4. Make focused changes. Avoid unrelated formatting or rewrites.
5. Run the relevant checks (requires Node.js 24 and npm 11; run `npm ci` first):
   - `npm test`
   - `npm run typecheck`
   - `npm run validate:curriculum`
6. Open a Pull Request that explains the learner need, what changed, the sources you checked, and how you validated it.

For how modules are written, see the [curriculum authoring guide](docs/curriculum-authoring-guide.md).

## Quality expectations

- English is the canonical curriculum language. The `pt-BR` translations are currently drafts and never replace the English text.
- Technical correctness matters. Prefer official, maintained sources, and do not invent documentation URLs.
- Exercises must be safe for beginners and use disposable resources.
- Use synthetic data only.
- Destructive commands need clear safeguards and must be scoped to lab-owned files.
- Changes to laboratory behavior need appropriate review, and you should say whether you ran the changed steps and where.

## Licensing of contributions

By submitting a contribution, you agree that it is provided under the project's applicable licenses, as described in the [README](README.md#license): CC BY-SA 4.0 for educational documentation and MIT for software, data, and code examples. There is no CLA or DCO requirement, and you keep the copyright in your contribution. Do not submit material you do not have the right to share, and do not copy third-party documentation into the repository.

## Maintainers

Maintainers review contributions and decide whether to accept them. This repository is the canonical upstream project. Forks and adaptations are welcome under the applicable licenses.

## Security and privacy

Never include secrets, private keys, credentials, access tokens, sensitive logs, or personal data in issues, Pull Requests, or examples. Redact private paths, usernames, and hostnames from any terminal output you share.
