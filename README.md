# Lumina AI Vault

[![npm version](https://img.shields.io/npm/v/lumina-ai-vault.svg)](https://www.npmjs.com/package/lumina-ai-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

📄 Portuguese version: see [LEIAME.md](LEIAME.md)

**Lumina AI Vault** is a high-performance [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that acts as a **structured, persistent memory** for AI assistants during software development. It enables AI models to maintain long-term memory of project goals, architectural decisions, technical stack, and progress across multiple sessions.

## 🚀 Features

- **Project-Based Organization** — manage multiple development vaults independently.
- **Custom Vault Paths** — store memory anywhere on the system; supports `~`, `$HOME`, and `HOME` shortcuts.
- **Auto-Location via `.aivault.json`** — automatically generated config file at the project root, letting the AI identify the correct vault without manual configuration every session.
- **Structured Memory** — standardized Markdown templates for Memory, Architecture, Stack, Decisions, Progress, and Next Steps.
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
| `init_project_memory` | Guided initialization of a new project knowledge base |
| `read_memory` | Read a memory file |
| `write_memory` | Overwrite a memory file |
| `append_memory` | Append entries to a file without overwriting |
| `delete_memory` | Delete a custom memory file |
| `search_memory` | Search across the vault with context line support |
| `load_project_context` | Consolidate a full project state into a single context block |
| `health_check` | Audit project memory completeness |

## ⚙️ Custom Paths & Auto-Location

### Vault Path Configuration

Data is stored in `~/.lumina-aivault/knowledge` by default. You can override this in three ways:

| Method | How |
|---|---|
| Global override | Set the `AIVAULT_BASE_PATH` environment variable |
| Per-tool override | Pass the optional `path` parameter to any tool |
| Shortcut support | Use `~`, `$HOME`, or `HOME` at the start of any path |

### Local Configuration (`.aivault.json`)

When using `init_project_memory` with a `workspace_root` argument, the server creates a `.aivault.json` file at your project root:

```json
{
  "project": "nebula-engine",
  "path": "HOME/.lumina-aivault/knowledge"
}
```

This file lets the AI automatically identify the project name and vault path in every future session — no manual setup needed.

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

To set a custom vault path via environment variable:

```yaml
mcp_servers:
  lumina-aivault:
    command: npx
    args:
      - "-y"
      - lumina-ai-vault
    env:
      AIVAULT_BASE_PATH: "/your/custom/path"
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

Open **Settings → MCP Servers** in the OpenCode Desktop interface and add a new server entry:

| Field | Value |
|---|---|
| Name | `lumina-aivault` |
| Type | `stdio` |
| Command | `npx` |
| Arguments | `-y lumina-ai-vault` |

Alternatively, edit the configuration file directly — same format as OpenCode CLI above.

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

You can also configure it through the Windsurf interface: **Settings → MCP → Add Server**.

---

### Setting a Custom Vault Path

All clients support passing environment variables to the server. Use `AIVAULT_BASE_PATH` to change the default storage location:

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

The following prompts are designed to work directly with the tools exposed by Lumina AI Vault. Paste them into any configured AI assistant.

---

### Starting a New Project

> Initialize the memory vault for a new project. Use `init_project_memory` with the following details: project name is "nebula-engine", it's a REST API built with Node.js and PostgreSQL, the goal is to provide a real-time data pipeline for IoT devices, and the workspace root is `/home/user/projects/nebula-engine`.

---

### Resuming Work After a Break

> I'm back to work on the "nebula-engine" project. Use `load_project_context` to load the full context from the vault, then summarize: what was the last completed task, what are the next steps, and are there any open architectural decisions?

---

### Recording an Architectural Decision

> We just decided to replace the REST polling pattern with WebSockets for real-time device updates. Use `append_memory` to record this decision in `decisions.md` of the "nebula-engine" project. Include: what was decided, why (lower latency, reduced server load), and what alternatives were rejected (SSE — browser compat issues).

---

### Updating Progress

> I just finished implementing the device authentication middleware with JWT. Use `append_memory` to log this in `progress.md` of the "nebula-engine" project with today's date, what was done, and the files changed: `src/middleware/auth.ts` and `src/routes/devices.ts`.

---

### Searching for Past Decisions

> Search the "nebula-engine" vault for the keyword "PostgreSQL" using 4 lines of context. I want to understand what schema decisions we made around the device_events table.

---

### Updating Architecture Documentation

> Use `write_memory` to update the `architecture.md` file of the "nebula-engine" project with the following structure: the system has three layers — API Gateway (Express), Business Logic (services), and Data Layer (PostgreSQL + Redis for caching). Include a brief description of each layer's responsibility.

---

### Running a Health Check

> Use `health_check` on the "nebula-engine" project to audit its documentation completeness. List any files that are missing or empty, and suggest what content each one should have.

---

### Listing and Switching Between Projects

> Use `list_projects` to show all projects in the vault, then load the context of "lumina-web" using `load_project_context`. Compare the next steps of both projects and tell me which one has more urgent pending work.

---

### Adding Items to Next Steps

> Use `append_memory` to add three new items to the `next_steps.md` file of the "nebula-engine" project: (1) implement rate limiting on the device endpoints, (2) add integration tests for the WebSocket handlers, (3) document the deployment process in the wiki.

---

### Documenting the Technical Stack

> Use `write_memory` to update `stack.md` of the "nebula-engine" project with the following stack: Node.js 20 + TypeScript, Express 5, PostgreSQL 16, Redis 7, Docker + Docker Compose for local development, GitHub Actions for CI/CD.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
