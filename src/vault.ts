import { existsSync } from "fs";
import {
  readdir,
  readFile,
  writeFile,
  mkdir,
  appendFile,
  unlink,
  stat,
  open,
  rm,
  rename,
} from "fs/promises";
import { join, resolve, relative, dirname } from "path";
import { homedir } from "os";
import { logger } from "./logger.js";

export const DEFAULT_BASE_PATH = join(homedir(), ".lumina-aivault", "knowledge");

export const MEMORY_FILES = [
  "memory.md",
  "architecture.md",
  "stack.md",
  "decisions.md",
  "progress.md",
  "next_steps.md",
] as const;

export type MemoryFile = (typeof MEMORY_FILES)[number];

export const MEMORY_TEMPLATES: Record<MemoryFile, string> = {
  "memory.md": `# Memory

## Overview
- **Name:**
- **Description:**
- **Goal:**

## Current Status
- **Phase:**
- **Last updated:**

## Key Components
-

## Important Notes
-
`,

  "architecture.md": `# Architecture

## Overview

## Components

## Data Flow

## External Integrations
-
`,

  "stack.md": `# Stack

## Languages
-

## Frameworks
-

## Libraries
-

## Infrastructure
-

## Dev Tools
-
`,

  "decisions.md": `# Decisions
`,

  "progress.md": `# Progress
`,

  "next_steps.md": `# Next Steps

## Now
-

## Soon
-

## Later
-

## Ideas
-
`,
};

const MEMORY_TEMPLATES_TRIMMED: Record<MemoryFile, string> = Object.fromEntries(
  MEMORY_FILES.map((f) => [f, MEMORY_TEMPLATES[f].trim()])
) as Record<MemoryFile, string>;

/**
 * Ensures a write operation is atomic by writing to a temporary file first.
 */
async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tempPath = `${filePath}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await writeFile(tempPath, content, "utf-8");
    await rename(tempPath, filePath);
  } catch (err) {
    if (existsSync(tempPath)) {
      await unlink(tempPath).catch(() => {});
    }
    throw err;
  }
}

export interface SubProjectConfig {
  project: string;
  path?: string;
}

export interface LocalVaultConfig {
  project: string;
  path?: string;
  subprojects?: Record<string, SubProjectConfig>;
}

export interface ResolvedLocalConfig {
  project: string;
  path?: string;
  configRoot: string;
  isSubProject: boolean;
  subProjectKey?: string;
}

/**
 * Walks up from workspaceRoot to find .aivault.json, then resolves the active
 * project — either the root project or a registered sub-project — based on the
 * relative path between the config location and workspaceRoot.
 */
export async function readLocalConfig(workspaceRoot: string): Promise<ResolvedLocalConfig | null> {
  let dir = resolve(workspaceRoot);

  while (true) {
    const configPath = join(dir, ".aivault.json");
    if (existsSync(configPath)) {
      try {
        const raw = await readFile(configPath, "utf-8");
        const parsed = JSON.parse(raw) as LocalVaultConfig;

        if (typeof parsed.project !== "string" || !parsed.project.trim()) return null;

        const relPath = relative(dir, resolve(workspaceRoot)).replace(/\\/g, "/");

        // Check if workspace_root falls inside a registered sub-project
        if (parsed.subprojects && relPath) {
          let matchedKey: string | undefined;
          let longestMatch = -1;

          for (const key of Object.keys(parsed.subprojects)) {
            const normalizedKey = key.replace(/\\/g, "/");
            if (relPath === normalizedKey || relPath.startsWith(normalizedKey + "/")) {
              if (normalizedKey.length > longestMatch) {
                longestMatch = normalizedKey.length;
                matchedKey = key;
              }
            }
          }

          if (matchedKey) {
            const sub = parsed.subprojects[matchedKey]!;
            if (typeof sub.project !== "string" || !sub.project.trim()) return null;
            const result: ResolvedLocalConfig = {
              project: sub.project.trim(),
              configRoot: dir,
              isSubProject: true,
              subProjectKey: matchedKey,
            };
            if (sub.path) result.path = sub.path;
            return result;
          }
        }

        // Root project (workspaceRoot == configRoot or unregistered sub-directory)
        const result: ResolvedLocalConfig = {
          project: parsed.project.trim(),
          configRoot: dir,
          isSubProject: false,
        };
        if (parsed.path) result.path = parsed.path;
        return result;
      } catch {
        return null;
      }
    }

    const parent = dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }

  return null;
}

/**
 * Adds or updates a sub-project entry in an existing .aivault.json file.
 */
export async function unregisterSubProject(
  configRoot: string,
  subProjectKey: string
): Promise<void> {
  const configPath = join(configRoot, ".aivault.json");
  if (!existsSync(configPath)) {
    throw new Error(`No .aivault.json found at ${configRoot}`);
  }

  let config: LocalVaultConfig;
  try {
    config = JSON.parse(await readFile(configPath, "utf-8")) as LocalVaultConfig;
  } catch {
    throw new Error(`Failed to read .aivault.json at ${configRoot}`);
  }

  if (!config.subprojects || !(subProjectKey in config.subprojects)) {
    throw new Error(`Sub-project "${subProjectKey}" not found in ${configPath}`);
  }

  delete config.subprojects[subProjectKey];
  if (Object.keys(config.subprojects).length === 0) {
    delete config.subprojects;
  }

  await atomicWrite(configPath, JSON.stringify(config, null, 2));
  logger.info(`Unregistered sub-project "${subProjectKey}" from ${configPath}`);
}

export async function registerSubProject(
  configRoot: string,
  subProjectKey: string,
  subProject: SubProjectConfig
): Promise<void> {
  const configPath = join(configRoot, ".aivault.json");
  let existing: LocalVaultConfig = { project: "" };

  if (existsSync(configPath)) {
    try {
      existing = JSON.parse(await readFile(configPath, "utf-8")) as LocalVaultConfig;
    } catch {
      // keep empty default
    }
  }

  const updated: LocalVaultConfig = {
    ...existing,
    subprojects: {
      ...(existing.subprojects ?? {}),
      [subProjectKey]: subProject,
    },
  };

  await atomicWrite(configPath, JSON.stringify(updated, null, 2));
  logger.info(`Registered sub-project "${subProject.project}" at key "${subProjectKey}" in ${configPath}`);
}

export function resolveBasePath(envPath?: string): string {
  let raw = envPath?.trim() || process.env.AIVAULT_BASE_PATH?.trim() || DEFAULT_BASE_PATH;
  // Expand HOME, $HOME or ~ at the start of the path (case-insensitive)
  raw = raw.replace(/^(?:HOME|\$HOME|~)(?=[\\/]|$)/i, homedir());
  return resolve(raw);
}

export function projectPath(basePath: string, project: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(project)) {
    throw new Error(
      `Invalid project name: "${project}". Use only letters, numbers, hyphens, and underscores.`
    );
  }
  return join(basePath, project);
}

function validateFilename(filename: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.md$/.test(filename)) {
    throw new Error(
      `Invalid filename: "${filename}". Must be a .md file starting with a letter or digit.`
    );
  }
  return filename;
}

async function getLastChar(filePath: string): Promise<string> {
  const { size } = await stat(filePath);
  if (size === 0) return "";
  const handle = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(1);
    await handle.read(buf, 0, 1, size - 1);
    return buf.toString("utf-8");
  } finally {
    await handle.close();
  }
}

function toList(value: string | undefined): string {
  if (!value?.trim()) return "-";
  return value
    .split(/[,\n;]+/)
    .map((s) => s.trim().replace(/^-\s+/, ""))
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");
}

export async function listProjects(basePath: string): Promise<string[]> {
  if (!existsSync(basePath)) return [];
  try {
    const entries = await readdir(basePath, { withFileTypes: true });
    return entries
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch (err) {
    logger.error(`Failed to list projects in ${basePath}`, err);
    return [];
  }
}

export async function listFiles(basePath: string, project: string): Promise<string[]> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);
  const files = await readdir(dir);
  return files.filter((f) => f.endsWith(".md")).sort();
}

export async function createProject(
  basePath: string,
  name: string
): Promise<{ dir: string; created: boolean }> {
  const dir = projectPath(basePath, name);
  const created = !existsSync(dir);
  await mkdir(dir, { recursive: true });
  for (const file of MEMORY_FILES) {
    const filePath = join(dir, file);
    if (!existsSync(filePath)) {
      await atomicWrite(filePath, MEMORY_TEMPLATES[file]);
    }
  }
  logger.info(`Project ${name} ${created ? "created" : "accessed"} at ${dir}`);
  return { dir, created };
}

export async function deleteProject(basePath: string, project: string): Promise<void> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);
  await rm(dir, { recursive: true });
  logger.info(`Project ${project} deleted`);
}

export async function readMemory(
  basePath: string,
  project: string,
  filename: string
): Promise<string> {
  const dir = projectPath(basePath, project);
  const safe = validateFilename(filename);
  const filePath = join(dir, safe);
  if (!existsSync(filePath)) throw new Error(`File not found: ${project}/${safe}`);
  return await readFile(filePath, "utf-8");
}

export async function writeMemory(
  basePath: string,
  project: string,
  filename: string,
  content: string
): Promise<void> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) {
    throw new Error(`Project not found: "${project}". Use create_project first.`);
  }
  const safe = validateFilename(filename);
  await atomicWrite(join(dir, safe), content);
  logger.info(`Updated memory: ${project}/${safe}`);
}

export async function appendMemory(
  basePath: string,
  project: string,
  filename: string,
  content: string
): Promise<void> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) {
    throw new Error(`Project not found: "${project}". Use create_project first.`);
  }
  const safe = validateFilename(filename);
  const filePath = join(dir, safe);
  const lastChar = existsSync(filePath) ? await getLastChar(filePath) : "";
  const prefix = lastChar.length > 0 && lastChar !== "\n" ? "\n" : "";
  await appendFile(filePath, prefix + content, "utf-8");
  logger.info(`Appended memory to: ${project}/${safe}`);
}

export async function deleteMemory(
  basePath: string,
  project: string,
  filename: string
): Promise<void> {
  const safe = validateFilename(filename);
  if ((MEMORY_FILES as readonly string[]).includes(safe)) {
    throw new Error(
      `Cannot delete standard file "${safe}". Use write_memory to clear its content instead.`
    );
  }
  const dir = projectPath(basePath, project);
  const filePath = join(dir, safe);
  if (!existsSync(filePath)) throw new Error(`File not found: ${project}/${safe}`);
  await unlink(filePath);
  logger.info(`Deleted custom memory: ${project}/${safe}`);
}

export interface InitAnswers {
  description?: string | undefined;
  goal?: string | undefined;
  phase?: string | undefined;
  architectureOverview?: string | undefined;
  components?: string | undefined;
  languages?: string | undefined;
  frameworks?: string | undefined;
  infrastructure?: string | undefined;
  nextSteps?: string | undefined;
}

export async function initProjectMemory(
  basePath: string,
  project: string,
  answers: InitAnswers,
  workspaceRoot?: string,
  originalPath?: string
): Promise<string> {
  const { dir, created } = await createProject(basePath, project);
  const date = new Date().toISOString().slice(0, 10);

  // ... (rest of filled object remains same)

  const filled: Record<MemoryFile, string> = {
    "memory.md": `# Memory

## Overview
- **Name:** ${project}
- **Description:** ${answers.description?.trim() ?? ""}
- **Goal:** ${answers.goal?.trim() ?? ""}

## Current Status
- **Phase:** ${answers.phase?.trim() ?? ""}
- **Last updated:** ${date}

## Key Components
${toList(answers.components)}

## Important Notes
-
`,

    "architecture.md": `# Architecture

## Overview
${answers.architectureOverview?.trim() ?? ""}

## Components
${toList(answers.components)}

## Data Flow

## External Integrations
-
`,

    "stack.md": `# Stack

## Languages
${toList(answers.languages)}

## Frameworks
${toList(answers.frameworks)}

## Libraries
-

## Infrastructure
${toList(answers.infrastructure)}

## Dev Tools
-
`,

    "decisions.md": MEMORY_TEMPLATES["decisions.md"],

    "progress.md": MEMORY_TEMPLATES["progress.md"],

    "next_steps.md": `# Next Steps

## Now
${toList(answers.nextSteps)}

## Soon
-

## Later
-

## Ideas
-
`,
  };

  const written: string[] = [];
  for (const file of MEMORY_FILES) {
    const filePath = join(dir, file);

    let shouldWrite: boolean;
    if (created) {
      shouldWrite = true;
    } else {
      const existingRaw = await readFile(filePath, "utf-8");
      const existing = existingRaw.trim();
      shouldWrite = !existing || existing === MEMORY_TEMPLATES_TRIMMED[file];
    }

    if (shouldWrite) {
      await atomicWrite(filePath, filled[file]);
      written.push(file);
    }
  }

  let extra = "";
  if (workspaceRoot) {
    try {
      const configPath = join(workspaceRoot, ".aivault.json");
      // Preserve existing subprojects when updating the config
      let existingSubprojects: Record<string, SubProjectConfig> | undefined;
      if (existsSync(configPath)) {
        try {
          const existing = JSON.parse(await readFile(configPath, "utf-8")) as LocalVaultConfig;
          existingSubprojects = existing.subprojects;
        } catch {
          // ignore, will overwrite
        }
      }
      const configData: LocalVaultConfig = { project, path: originalPath || basePath };
      if (existingSubprojects) configData.subprojects = existingSubprojects;
      await atomicWrite(configPath, JSON.stringify(configData, null, 2));
      extra = ` and local config ".aivault.json" created at ${workspaceRoot}`;
    } catch (err) {
      logger.error(`Failed to create local config at ${workspaceRoot}`, err);
      extra = ` (but failed to create .aivault.json: ${err instanceof Error ? err.message : String(err)})`;
    }
  }

  return written.length > 0
    ? `Project "${project}" initialized${extra}. Files written: ${written.join(", ")}`
    : `Project "${project}" already has content in all files${extra}. No files were overwritten.`;
}

export interface SearchResult {
  project: string;
  file: string;
  line: number;
  text: string;
  context?: string[];
}

export interface SearchOutput {
  results: SearchResult[];
  truncated: boolean;
}

export async function searchMemory(
  basePath: string,
  query: string,
  project?: string,
  limit = 100,
  contextLines = 0
): Promise<SearchOutput> {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty.");
  }
  if (limit < 1) {
    throw new Error(`Invalid limit: ${limit}. Must be at least 1.`);
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  const cap = limit + 1;

  const projects = project ? [project] : await listProjects(basePath);

  outer: for (const proj of projects) {
    let dir: string;
    try {
      dir = projectPath(basePath, proj);
    } catch (err) {
      if (project !== undefined) throw err;
      continue;
    }
    if (!existsSync(dir)) continue;

    const filesRaw = await readdir(dir);
    const files = filesRaw.filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        if (line.toLowerCase().includes(lowerQuery)) {
          const result: SearchResult = { project: proj, file, line: i + 1, text: line.trim() };

          if (contextLines > 0) {
            const start = Math.max(0, i - contextLines);
            const end = Math.min(lines.length, i + contextLines + 1);
            result.context = lines.slice(start, end);
          }

          results.push(result);
          if (results.length === cap) break outer;
        }
      }
    }
  }

  const truncated = results.length === cap;
  return { results: truncated ? results.slice(0, limit) : results, truncated };
}

export async function loadProjectContext(basePath: string, project: string): Promise<string> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);

  const filesRaw = await readdir(dir);
  const files = filesRaw.filter((f) => f.endsWith(".md")).sort();

  const parts: string[] = [];
  for (const file of files) {
    const contentRaw = await readFile(join(dir, file), "utf-8");
    const content = contentRaw.trim();
    const knownTemplate = (MEMORY_TEMPLATES_TRIMMED as Record<string, string | undefined>)[file];
    const isBlankTemplate = knownTemplate !== undefined && content === knownTemplate;
    if (content && !isBlankTemplate) {
      parts.push(`## ${file}\n\n${content}`);
    }
  }

  return parts.length > 0
    ? `# Context: ${project}\n\n${parts.join("\n\n---\n\n")}`
    : `# Context: ${project}\n\n(no content yet)`;
}

export interface HealthStatus {
  project: string;
  files: Record<string, "ok" | "missing">;
  isHealthy: boolean;
}

export async function checkProjectHealth(basePath: string, project: string): Promise<HealthStatus> {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) {
    throw new Error(`Project not found: "${project}"`);
  }

  const status: Record<string, "ok" | "missing"> = {};
  let isHealthy = true;

  for (const file of MEMORY_FILES) {
    const exists = existsSync(join(dir, file));
    status[file] = exists ? "ok" : "missing";
    if (!exists) isHealthy = false;
  }

  return { project, files: status, isHealthy };
}
