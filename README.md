# Lumina AI Vault

An AI Knowledge Vault — an MCP server that manages Project Memory Files to give AI agents persistent memory across sessions.

AI agents forget everything when a session ends. Lumina AI Vault stores project knowledge in structured Markdown files that any agent can read and update — keeping context alive between sessions, across tools, and across team members.

## How it works

The vault organizes knowledge into projects. Each project holds a set of Project Memory Files — standard Markdown files covering memory, architecture, stack, decisions, progress, and next steps. An MCP-compatible agent can read, write, search, and initialize these files through a set of dedicated tools.

```
~/.lumina-aivault/knowledge/
├── my-project/
│   ├── memory.md
│   ├── architecture.md
│   ├── stack.md
│   ├── decisions.md
│   ├── progress.md
│   └── next_steps.md
└── another-project/
    └── ...
```

Files are plain Markdown — versionable with git, readable by humans, writable by any AI tool.

---

## Requirements

- Node.js 18 or higher

---

## Installation

### Via npx (no install required)

```bash
npx lumina-ai-vault
```

### Global install

```bash
npm install -g lumina-ai-vault
lumina-aivault
```

### From source

```bash
git clone https://github.com/kadu-velasco/lumina-ai-vault.git
cd lumina-ai-vault
npm install
npm run build
node dist/index.js
```

---

## Configuration

The vault base path can be set in three ways, in order of priority:

| Method | Example |
|---|---|
| CLI argument | `lumina-aivault /path/to/vault` |
| Environment variable | `AIVAULT_BASE_PATH=/path/to/vault lumina-aivault` |
| Default | `~/.lumina-aivault/knowledge` |

---

## Connecting to an MCP client

### Claude Code

Add the server to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["lumina-ai-vault"]
    }
  }
}
```

To use a custom vault path:

```json
{
  "mcpServers": {
    "lumina-aivault": {
      "command": "npx",
      "args": ["lumina-ai-vault", "/path/to/your/vault"]
    }
  }
}
```

### Other MCP clients

The server communicates over stdio and is compatible with any client that supports the Model Context Protocol.

---

## Available tools

### `init_project_memory`

Initializes a project's memory files from scratch. The agent asks the user a set of guided questions before calling this tool and uses the answers to populate all standard files.

**Triggered by:** *"Initialize memory for project X"*

---

### `create_project`

Creates a new project with all standard memory files pre-populated with blank templates. Use `"global"` as the project name for shared cross-project knowledge.

---

### `delete_project`

Permanently deletes a project and all its memory files. Requires `confirm: true` to execute — the agent must ask the user explicitly before calling this tool. This action is irreversible.

---

### `list_projects`

Lists all projects currently in the vault.

---

### `list_files`

Lists all `.md` files inside a specific project.

---

### `read_memory`

Reads the content of a memory file from a project.

---

### `write_memory`

Overwrites the full content of a memory file.

---

### `append_memory`

Appends content to a memory file without touching existing content. Intended for log-style files like `decisions.md` and `progress.md`.

---

### `delete_memory`

Deletes a custom memory file from a project. Standard files (`memory.md`, `architecture.md`, `stack.md`, `decisions.md`, `progress.md`, `next_steps.md`) are protected and cannot be deleted — use `write_memory` to clear their content instead.

---

### `search_memory`

Searches for a text string across all memory files in the vault, or within a specific project. Returns matching lines with file and line number references. Accepts an optional `limit` parameter (default: 100).

---

### `load_project_context`

Loads all memory files from a project and concatenates them into a single context block. Files that still contain only the blank template are omitted. Use this at the start of a session to restore full project context.

**Triggered by:** *"Load context for project X"*

---

## Memory file structure

Each project contains six standard files:

### `memory.md`
General project summary. Covers name, description, goal, current phase, key components, and important notes.

### `architecture.md`
System architecture overview, main components, data flow, and external integrations.

### `stack.md`
Technology stack: languages, frameworks, libraries, infrastructure, and development tools.

### `decisions.md`
Append-only log of technical decisions. Each entry records the decision, the reason behind it, alternatives considered, and its impact.

Suggested entry format:
```markdown
## YYYY-MM-DD — Decision title
**Decision:** ...
**Reason:** ...
**Alternatives:** ...
**Impact:** ...
```

### `progress.md`
Append-only development log. Each entry is dated and records what was done, changed, fixed, and any relevant notes.

Suggested entry format:
```markdown
## YYYY-MM-DD
- **Done:** ...
- **Changed:** ...
- **Fixed:** ...
- **Notes:** ...
```

### `next_steps.md`
Planned work organized by time horizon: immediate tasks, short term, long term, and ideas for the future.

---

## Recommended workflow

**Start of session**
```
Load context for project my-project
```

**End of session**
```
Update memory for project my-project
```

**Starting a new project**
```
Initialize memory for project my-project
```

---

## License

MIT
