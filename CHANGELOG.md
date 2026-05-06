# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2026-05-05

### Added
- `metadata` parameter to `list_files` — when `true`, returns size in bytes, estimated token count, and last modified date for each file, enabling the LLM to make informed decisions before loading content
- `files` parameter to `load_project_context` — accepts an optional array of filenames to load selectively instead of the entire project context
- `offset` parameter to `search_memory` for result pagination
- CI/CD pipeline via GitHub Actions (lint, test, build on push/PR)
- Vitest coverage thresholds (80% lines/functions/statements, 70% branches)
- `test:coverage` npm script
- `vitest.config.ts` for centralized test configuration
- `.env.example` documenting all supported environment variables
- Environment Variables section in README and LEIAME
- Monorepo tooling detection in `projectAnalyzer` (Turborepo, Nx, Lerna, pnpm workspaces)
- Monorepo package listing in `detectComponents` — lists packages under `packages/`, `apps/`, `libs/`, `modules/` when present

### Changed
- Replaced custom JSON Schema generation in `BaseToolHandler` with `zod-to-json-schema` library
- Downgraded `zod` from v4 to v3 for broader ecosystem compatibility
- `write_memory` now validates that `content` is non-empty (`z.string().min(1)`)
- CLI commands (`set-vault`, `get-vault`, `unset-vault`) now handle file-system errors gracefully with user-friendly messages
- `search_memory` truncation message now mentions the `offset` parameter for pagination
- `search_memory` `limit` parameter now validated as an integer between 1 and 1000 (previously unbounded)

### Fixed
- `update_project_memory` incorrectly returned `isError: false` when some writes succeeded and others failed in the same call — partial failures now always set `isError: true`
- `search_memory` called `resolveContextAndRemember` twice when `workspace_root` was provided without an explicit `project`, causing redundant last-project persistence
- Silent error swallowing in vault config read operations (`readLocalConfig`, `registerSubProject`, `initProjectMemory`) — failures are now logged via `logger.error` instead of being discarded silently

## [2.0.4] - 2026-05-05

### Changed
- Maintenance release: dependency updates and stability improvements

## [2.0.3] - 2026-04-28

### Changed
- Maintenance release

## [2.0.0] - 2026-04-01

### Added
- Sub-project support with automatic detection via `.aivault.json` and longest-match algorithm
- `update_project_memory` tool for saving session work in a single call
- `unregister_subproject` tool for removing sub-project entries
- `get_vault_config` tool for inspecting current configuration
- Auto-discovery fallback chain (`.aivault.json` → last session → user prompt)
- Atomic write pattern for crash-safe file operations
- Structured logging to stderr

### Changed
- Complete architecture rewrite with modular handler system
- All tools now accept `workspace_root` for auto-discovery
- BaseToolHandler abstraction with Zod validation

## [1.0.0] - 2026-01-01

### Added
- Initial release with core memory management tools
- `create_project`, `delete_project`, `list_projects`
- `read_memory`, `write_memory`, `append_memory`, `delete_memory`
- `search_memory` with context line support
- `init_project_memory` with auto-detect
- `load_project_context`, `health_check`
- CLI configuration commands
- Bilingual documentation (English + Portuguese)

---

Made with ❤️ and AI by [Kadu Velasco](https://github.com/kaduvelasco)
