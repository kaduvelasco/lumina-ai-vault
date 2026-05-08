# CLAUDE.md

This file defines the rules and conventions that AI agents must follow when working in this repository.

---

## Rule Priority

When rules conflict, follow this order:

1. **User instructions** — always take precedence.
2. **This file** — applies to all tasks.
3. Existing project conventions.
4. Default AI behavior.

Never override explicit user instructions. If something is unclear, **ask before proceeding**.

---

## Language

| Context | Language |
|---|---|
| Responses to the user | Brazilian Portuguese (pt-BR) |
| Documentation (`*.md`) | English |
| Code comments | English |

Do **not** mix languages inside the same file.

---

## Agent Behavior

- Make **minimal and precise changes**.
- Modify **only files relevant to the task**.
- Respect the **existing project structure**.
- Prefer **simple and readable** solutions.
- Avoid unnecessary refactoring or large rewrites unless explicitly requested.
- If a task requires a large refactor, **ask the user before proceeding**.

---

## Git Operations

AI agents must **never** perform or simulate Git operations. Do not:

- Run `git` commands
- Generate commit messages
- Suggest commits, branches, or pull requests

Version control is handled **manually by the user**. Agents may only **create or modify files**.

---

## Dependencies

Before adding any dependency:

1. Check if the functionality exists in the standard library.
2. Prefer built-in language features.
3. If a dependency is truly required, explain why a built-in solution is insufficient.

Dependencies must be **minimal and justified**.

---

## Code Quality

Generated code must:

- Follow existing project conventions.
- Use clear and consistent naming.
- Prioritize readability over cleverness.
- Avoid unnecessary abstractions and overengineering.

---

## Documentation

All documentation files must follow **GitHub Markdown conventions** and be placed in the **project root** unless instructed otherwise.

### Required files

| File | Language | Description |
|---|---|---|
| `README.md` | English | Main project documentation |
| `LEIAME.md` | Portuguese (pt-BR) | Portuguese translation of README |
| `CONTRIBUTING.md` | English | Contribution guidelines |
| `CONTRIBUINDO.md` | Portuguese (pt-BR) | Portuguese translation of CONTRIBUTING |

Each file must link to its counterpart:

```md
📄 Portuguese version: see LEIAME.md   <!-- in README.md / CONTRIBUTING.md -->
📄 English version: see README.md      <!-- in LEIAME.md / CONTRIBUINDO.md -->
```

### README structure

1. Project title and description
2. Relevant badges (language version, CI, license, coverage — no irrelevant badges)
3. Features
4. Installation
5. Usage
6. Configuration
7. Contributing
8. License (if applicable)

---

## Markdown Signature

Every `*.md` file created in this repository must end with this signature, **exactly once**:

```md
---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
```

---

## Security

AI agents must never:

- Expose credentials, secrets, or API keys.
- Generate or hardcode sensitive information.
- Introduce insecure patterns.

If a task appears to require sensitive information, **ask the user instead of generating it**.

---

## General Principles

- Implement **only what was requested** — avoid scope creep.
- Keep solutions **simple and maintainable**.
- Preserve the existing architecture.
- When in doubt, **ask the user before proceeding**.

## Language-Specific Standards

@.instructions/MCP.md
