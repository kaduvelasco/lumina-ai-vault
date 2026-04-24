# Lumina AI Vault

[![npm version](https://img.shields.io/npm/v/lumina-ai-vault.svg)](https://www.npmjs.com/package/lumina-ai-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

📄 Portuguese version: see [LEIAME.md](LEIAME.md)

**Lumina AI Vault** is a high-performance [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that acts as a **structured, persistent memory** for AI assistants during software development. It enables AI models to maintain long-term memory of project goals, architectural decisions, technical stack, and progress across multiple sessions — with full support for **sub-projects** (plugins, packages, modules) within a single repository.

## 🚀 Features

- **Project & Sub-Project Organization** — manage multiple projects and nested sub-projects (plugins, modules, packages) independently, each with its own dedicated vault.
- **Auto-Discovery** — three-step resolution: reads `.aivault.json` from the workspace (walking up the directory tree), falls back to the last used project from global config, and guides the user when nothing is found.
- **Sub-Project Detection** — place the AI in any sub-folder and it automatically identifies which sub-project (and vault) to use based on relative path matching.
- **Custom Vault Paths** — store memory anywhere on the system; supports `~`, `$HOME`, and `HOME` shortcuts. Sub-project vaults are fully independent paths.
- **Atomic Writes** — write-then-rename pattern prevents file corruption on concurrent access.
- **Context-Aware Search** — grep-style search with configurable context lines.
- **Health Monitoring** — audit tool that identifies incomplete documentation.
- **Observability** — real-time logging to `stderr` without breaking the MCP protocol.
- **Robust Validation** — strict input schema validation powered by [Zod](https://zod.dev/).

## 🛠️ Tools

| Tool | Description |
|---|---|
| `list_projects` | List all projects managed in the vault |
| `create_project` | Create a new project with standard memory files |
| `delete_project` | Remove a project from the vault |
| `list_files` | List memory files within a project |
| `init_project_memory` | Guided initialization of a project or sub-project knowledge base |
| `read_memory` | Read a memory file |
| `write_memory` | Overwrite a memory file |
| `append_memory` | Append entries to a file without overwriting |
| `delete_memory` | Delete a custom memory file |
| `search_memory` | Search across the vault with context line support |
| `load_project_context` | Consolidate a full project state into a single context block |
| `health_check` | Audit project memory completeness |
| `get_vault_config` | Show current vault configuration and global settings |
| `update_project_memory` | Save session work to the vault in a single call (progress, decisions, next steps, etc.) |
| `unregister_subproject` | Remove a sub-project entry from `.aivault.json` (does not delete vault data) |

## ⚙️ Auto-Discovery

When `project` is not explicitly provided, all tools resolve it automatically in three steps:

```
1. workspace_root provided → walk up directories to find .aivault.json
   → match relative path to detect active sub-project
2. No .aivault.json found → read ~/.lumina-aivault/config.json (last used project)
3. Neither found → return a message asking the user for project name / vault path
```

Every successful operation persists the active project as `lastProject` in `~/.lumina-aivault/config.json`, so the next session picks it up automatically.

When auto-discovery is used, the tool response includes a note:
- `[project: subproject1, from .aivault.json]` — discovered from local config
- `[project: subproject1, from last session]` — recovered from global config

## 📁 Projects & Sub-Projects

### Single Project

The simplest case: one project per repository. Run `init_project_memory` with `workspace_root` and a `.aivault.json` is created at the project root:

```json
{
  "project": "project1",
  "path": "HOME/.lumina-aivault/knowledge"
}
```

### Sub-Projects

For repositories with multiple independent components (plugins, monorepo packages, modules, etc.), the root `.aivault.json` registers each sub-project with its own vault path and relative folder key:

```json
{
  "project": "project1",
  "path": "HOME/.lumina-aivault/knowledge",
  "subprojects": {
    "module/subproject1": {
      "project": "subproject1",
      "path": "HOME/.lumina-aivault/knowledge"
    },
    "module/subproject2": {
      "project": "subproject2",
      "path": "HOME/.lumina-aivault/knowledge"
    },
    "reports/subproject3": {
      "project": "subproject3",
      "path": "/custom/path/for/subproject3"
    }
  }
}
```

**Important:** sub-project vaults are independent — they can be stored at any path, not necessarily inside the parent project's vault.

### How Sub-Project Detection Works

The tool receives `workspace_root` (the directory where the AI is currently working) and:

1. Walks up the directory tree until it finds `.aivault.json`
2. Computes the relative path from the config location to `workspace_root`
3. Matches that path against the `subprojects` keys (longest match wins)
4. Uses the matching sub-project's vault

| `workspace_root` | Result |
|---|---|
| `/path/project1` | Root project `project1` |
| `/path/project1/module/subproject1` | Sub-project `subproject1` |
| `/path/project1/module/subproject1/subdir` | Sub-project `subproject1` (prefix match) |
| `/path/project1/reports/subproject3` | Sub-project `subproject3` |

### Registering a New Sub-Project

When `init_project_memory` is called with a `workspace_root` that is **inside** a project (an ancestor `.aivault.json` exists) but **not yet registered** as a sub-project:

1. Creates the vault for the new sub-project
2. Automatically registers it in the parent's `.aivault.json`
3. Does **not** create a `.aivault.json` in the sub-project folder

To store the sub-project vault at a custom location, pass the `path` argument explicitly.

### Vault Path Configuration

| Method | How |
|---|---|
| Global override | Set the `AIVAULT_BASE_PATH` environment variable |
| Per-tool override | Pass the optional `path` parameter to any tool |
| Shortcut support | Use `~`, `$HOME`, or `HOME` at the start of any path |

Default storage location: `~/.lumina-aivault/knowledge`

## 📦 Installation

### Option 1 — Run directly with npx (recommended, no install needed)

```bash
npx lumina-ai-vault
```

### Option 2 — Global install

```bash
npm install -g lumina-ai-vault
```

After installation, the binary `lumina-aivault` will be available globally.

### Option 3 — From source

```bash
git clone https://github.com/kaduvelasco/lumina-ai-vault.git
cd lumina-ai-vault
npm install
npm run build
```

The compiled server will be at `dist/index.js`.

## 🔧 Client Configuration

### Claude Code CLI

**Via command line (recommended):**

```bash
# Using npx (no install required)
claude mcp add lumina-aivault npx -- -y lumina-ai-vault

# Using global install
claude mcp add lumina-aivault lumina-aivault

# Using source build
claude mcp add lumina-aivault node -- /absolute/path/to/lumina-ai-vault/dist/index.js
```

**Via configuration file** — add to `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level):

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

> To verify the server is running: `claude mcp list`

---

### Gemini CLI

Edit `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

> Restart Gemini CLI after editing the file for changes to take effect.

---

### Codex CLI

Edit `~/.codex/config.yaml`:

```yaml
mcp_servers:
  lumina-aivault:
    command: npx
    args:
      - "-y"
      - lumina-ai-vault
```

---

### OpenCode CLI

Edit `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "servers": {
      "lumina-aivault": {
        "type": "local",
        "command": "npx",
        "args": ["-y", "lumina-ai-vault"]
      }
    }
  }
}
```

---

### OpenCode Desktop

Open **Settings → MCP Servers** and add a new server entry:

| Field | Value |
|---|---|
| Name | `lumina-aivault` |
| Type | `stdio` |
| Command | `npx` |
| Arguments | `-y lumina-ai-vault` |

---

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"]
    }
  }
}
```

You can also configure it through **Settings → MCP → Add Server**.

---

### Setting a Custom Vault Path

All clients support passing environment variables to the server:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["-y", "lumina-ai-vault"],
      "env": {
        "AIVAULT_BASE_PATH": "/home/user/my-vaults"
      }
    }
  }
}
```

## 💡 Prompt Examples

The following prompts work directly with the tools exposed by Lumina AI Vault.

---

### Saving Session Work (vague prompt)

> Update the memory of the subproject1 project.

The AI will call `load_project_context` to read the current vault state, analyze the conversation, and then call `update_project_memory` with the categorized content:

```
update_project_memory({
  project: "subproject1",
  progress: "## 2026-04-23\n- Implemented feature X\n- Files: src/service.ts, src/client.ts",
  decisions: "## 2026-04-23\n- Chose approach A over approach B for better performance and maintainability",
  next_steps: "## Now\n- Write unit tests for feature X\n- Document the integration flow"
})
```

Fields written by **appending** (logs — history is never lost):
- `progress` → `progress.md`
- `decisions` → `decisions.md`

Fields written by **overwriting** (always reflect the current state):
- `next_steps` → `next_steps.md`
- `memory` → `memory.md`
- `architecture` → `architecture.md`
- `stack` → `stack.md`

Fields with **configurable mode** (default: append):
- `custom` → array of `{ filename, content, mode? }` — any `.md` file outside the standard set; `mode: "append"` (default) or `mode: "write"`

---

### Initializing a Top-Level Project

> Initialize the memory vault for a new project. Use `init_project_memory` with: project name "project1", workspace_root "/path/project1", auto_detect true. Then summarize what was detected.

---

### Initializing a Sub-Project

> I'm starting work on the subproject1 module. Use `init_project_memory` with workspace_root "/path/project1/module/subproject1" and project "subproject1". Register it as a sub-project and use the default vault path.

---

### Auto-Detecting the Active Sub-Project

> I'm working in the folder "/path/project1/module/subproject2". Use `load_project_context` with workspace_root "/path/project1/module/subproject2" — the tool should detect which sub-project is active and load its vault automatically.

---

### Resuming Work After a Break

> I'm back to work. Use `load_project_context` with workspace_root "/path/project1/module/subproject1" to reload the context for the subproject1 module and summarize: last completed task, next steps, and any open decisions.

---

### Recording an Architectural Decision in a Sub-Project

> We decided to use approach A instead of approach B for subproject1. Use `append_memory` with workspace_root "/path/project1/module/subproject1" and filename "decisions.md". Record: what was decided, why, and what was rejected.

---

### Updating Progress in a Sub-Project

> I just finished the core service for subproject1. Use `append_memory` with workspace_root "/path/project1/module/subproject1" and filename "progress.md". Include today's date, what was done, and the files changed: `src/service.ts` and `src/client.ts`.

---

### Searching Across All Sub-Projects

> Search the project1 vault for the keyword "authentication" with 3 lines of context. I want to see how each module handles authentication.

---

### Searching Within a Specific Sub-Project

> Search for "database" in the subproject3 module only. Use `search_memory` with workspace_root "/path/project1/reports/subproject3" and query "database", with 2 lines of context.

---

### Comparing Sub-Projects

> Use `load_project_context` for both "subproject1" and "subproject2" projects. Compare their next steps and tell me which one has more critical pending work.

---

### Health Check Across a Sub-Project

> Use `health_check` with workspace_root "/path/project1/reports/subproject3" to verify if the subproject3 vault is complete. List missing or empty files and suggest what each should contain.

---

### Documenting the Stack for a Sub-Project

> Use `write_memory` with workspace_root "/path/project1/module/subproject1" and filename "stack.md". Document the stack: language and version, main framework, key libraries, database, and testing tools.

---

### Listing All Sub-Projects

> Use `list_projects` to show all vaults in the vault. Then tell me which ones correspond to project1 sub-projects based on their names.

---

### Removing a Sub-Project Registration

> The subproject1 module folder was removed from the repository. Use `unregister_subproject` with workspace_root "/path/project1/module/subproject1" to remove its entry from `.aivault.json`. The vault data at the configured path should not be deleted.

---

### Writing Custom Memory Files

> Use `update_project_memory` with project "subproject1" and the `custom` field to overwrite the API documentation and append to the testing log:

```
update_project_memory({
  project: "subproject1",
  custom: [
    { filename: "api.md", content: "# REST API\n## Endpoints\n...", mode: "write" },
    { filename: "testing.md", content: "## 2026-04-23\n- Added unit tests for feature X" }
  ]
})
```

## 🖥️ CLI Reference

The `lumina-aivault` binary exposes configuration commands for managing the global vault path.

### `config set-vault <path>`

Set the global default vault path. Accepts `~`, `$HOME`, and `HOME` shortcuts.

```bash
lumina-aivault config set-vault ~/.lumina-aivault/knowledge
lumina-aivault config set-vault HOME/my-vaults
lumina-aivault config set-vault /absolute/custom/path
```

### `config get-vault`

Display the currently configured global vault path.

```bash
lumina-aivault config get-vault
# Global vault path: /home/user/.lumina-aivault/knowledge
```

### `config unset-vault`

Remove the global vault configuration and revert to the default path (`~/.lumina-aivault/knowledge`).

```bash
lumina-aivault config unset-vault
# Global vault path removed. Using default.
```

> **Note:** the global vault path set via CLI is read by the MCP server at startup. After changing it, restart the MCP server in your client.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
