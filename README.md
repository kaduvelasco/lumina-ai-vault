# Lumina AI Vault

[![npm version](https://img.shields.io/npm/v/lumina-ai-vault.svg)](https://www.npmjs.com/package/lumina-ai-vault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-orange.svg)](https://modelcontextprotocol.io/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Leia este arquivo em Português (Brasil)](LEIAME.md)

**Lumina AI Vault v2.0.0** is a high-performance Model Context Protocol (MCP) server designed to act as a **structured, persistent memory** for AI assistants during software development. It enables AI models to maintain a "long-term memory" of project goals, architectural decisions, and progress across multiple sessions.

## 🚀 Key Features

- **Project-Based Organization**: Manage multiple development vaults independently.
- **Custom Vault Paths**: Store your memory anywhere on the system, with support for standard shortcuts (`HOME`, `$HOME`, or `~`).
- **Local Project Config**: Automatically generates `.aivault.json` in your project's root to help the AI "auto-locate" the correct vault.
- **Structured Memory**: Standardized `.md` templates for Memory, Architecture, Stack, Decisions, Progress, and Next Steps.
- **Atomic Writes**: Data integrity protection using a write-then-rename pattern to prevent file corruption.
- **Context-Aware Search**: Powerful search with configurable context lines (grep-style) to help the AI understand historical entries.
- **Health Monitoring**: Built-in tools to verify vault integrity and identify missing documentation.
- **Developer Observability**: Real-time logging to `stderr` for debugging without breaking the MCP protocol.
- **Robust Validation**: Strict input schema validation powered by **Zod**.

## ⚙️ Custom Paths & Auto-Location

Lumina AI Vault is flexible about where it stores your data:

### Custom Vault Path
By default, data is saved in `~/.lumina-aivault/knowledge`. You can override this:
1.  **Global Override**: Set the `AIVAULT_BASE_PATH` environment variable.
2.  **Per-Tool Override**: All tools accept an optional `path` parameter.
3.  **Path Shortcuts**: In any path parameter, you can use `HOME`, `$HOME`, or `~` at the beginning (e.g., `~/vaults/my-project`). The `HOME` keyword is case-insensitive.

### Local Configuration (`.aivault.json`)
When using `init_project_memory`, if the AI provides the `workspace_root` (your project's local folder), the server will create a `.aivault.json` file. 

**Example `.aivault.json`:**
```json
{
  "project": "nebula-engine",
  "path": "HOME/.lumina-aivault/knowledge"
}
```
This file allows the AI assistant to automatically identify the project name and the vault path as soon as it reads the project files, eliminating the need for manual configuration in every session.

## 🛠️ Tools

The server provides the following tools to the AI assistant:

- `init_project_memory`: Guided initialization of a new project's knowledge base.
- `list_projects`: View all managed projects in the vault.
- `create_project`: Create a new vault with standard memory files.
- `read_memory` / `write_memory`: Basic I/O for memory files.
- `append_memory`: Add entries to logs (like decisions or progress) without overwriting.
- `search_memory`: Search across the vault with context line support.
- `check_project_health`: Audit a project's memory completeness.
- `load_project_context`: Consolidate a whole project's state into a single context block.

## 💡 Prompt Examples

You can use these prompts to help your AI assistant interact with the Vault:

### Initializing a Project
> "I'm starting a new project called 'nebula-engine'. Use the `init_project_memory` tool to set up its initial documentation. I'll provide the details as you ask the questions."

### Recording a Decision
> "We just decided to switch from REST to gRPC for the internal communication. Use `append_memory` to record this in `decisions.md` of the 'nebula-engine' project, explaining that the move is for lower latency."

### Contextual Retrieval
> "I need to work on the database layer. Search the 'nebula-engine' vault for 'PostgreSQL' using 3 lines of context to remind me of our schema decisions."

### Project Onboarding
> "I'm back to work on the 'lumina-web' project. Please use `load_project_context` to refresh your memory on the current state and next steps."

## 📦 Getting Started

### Installation

```bash
npm install
npm run build
```

### Configuration

To use Lumina AI Vault, you need to add it to your MCP client configuration. Below are examples for the most popular tools.

#### Claude Desktop
Add this to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/absolute/path/to/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

#### Claude Code CLI
Claude Code CLI automatically detects MCP servers configured in Claude Desktop. You can also configure it directly via the CLI:

```bash
claude mcp add lumina-aivault node /absolute/path/to/lumina-ai-vault/dist/index.js
```

#### Gemini Code Assist
Configure the MCP server through the Gemini Code Assist extension settings in your IDE (VS Code, IntelliJ) by pointing to the executable.

#### Windsurf
Add to your `~/.codeium/windsurf.json` or through the Windsurf MCP configuration UI:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/absolute/path/to/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

#### OpenCode (CLI & Desktop)
OpenCode allows configuring MCP servers via its settings panel or through the CLI configuration file:

```json
{
  "servers": {
    "lumina-aivault": {
      "command": "node",
      "args": ["/absolute/path/to/lumina-ai-vault/dist/index.js"]
    }
  }
}
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
