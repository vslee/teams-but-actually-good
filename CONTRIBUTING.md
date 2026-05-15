# Contributing to Teams but (actually) good

Thanks for wanting to contribute! Any help, big or small is always appreciated.

All contributions should be made in accordance with our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report a bug** : [open a bug report](https://github.com/LeonimusTTV/teams-but-actually-good/issues/new?template=bug_report.yml)
- **Suggest a feature** : [open a feature request](https://github.com/LeonimusTTV/teams-but-actually-good/issues/new?template=feature_request.yml)
- **Write a plugin** : see [Plugin guidelines](#plugin-guidelines) below
- **Fix a bug or improve the core** : for small fixes, feel free to open a PR directly; for larger changes, open an issue first to discuss
- **Improve the documentation** : the docs live at [docs.teamsbutactuallygood.dev](https://docs.teamsbutactuallygood.dev)

## Getting started

Development setup and guides are available in the [documentation](https://docs.teamsbutactuallygood.dev).

## Pull requests

Pull requests should target the `main` branch.

### PR title & commit format

PR titles **must** follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type: short description
```

This is enforced automatically, PRs with non-conforming titles will fail the CI check.

Allowed types:

| Type                     | When to use                               |
| ------------------------ | ----------------------------------------- |
| `feat` / `feature`       | New feature or plugin                     |
| `fix` / `bug` / `hotfix` | Bug fix                                   |
| `chore`                  | Routine tasks, maintenance                |
| `docs`                   | Documentation changes                     |
| `refactor`               | Code refactoring without behaviour change |
| `build`                  | Build system or tool changes              |
| `ci`                     | CI/CD changes                             |
| `test`                   | Adding or updating tests                  |
| `style`                  | Code style/formatting (no logic change)   |
| `deps`                   | Dependency updates                        |

> Individual commits within the PR don't need to follow this format, but keeping them consistent is encouraged.

## Plugin guidelines

Before opening a PR for a new plugin:

- **Open an issue first** to discuss the idea and make sure it fits the project before you invest time building it
- Keep plugins focused, one clear purpose per plugin
- Avoid plugins that duplicate functionality already covered by Teams itself or by existing plugins
