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
  read,
  close,
  rm,
  rename,
} from "fs/promises";
import { join, resolve, dirname } from "path";
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

export function resolveBasePath(envPath?: string): string {
  const raw = envPath?.trim() || process.env.AIVAULT_BASE_PATH?.trim() || DEFAULT_BASE_PATH;
  return resolve(raw.replace(/^~/, homedir()));
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
    await read(handle.fd, buf, 0, 1, size - 1);
    return buf.toString("utf-8");
  } finally {
    await close(handle.fd);
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
  description?: string;
  goal?: string;
  phase?: string;
  architectureOverview?: string;
  components?: string;
  languages?: string;
  frameworks?: string;
  infrastructure?: string;
  nextSteps?: string;
}

export async function initProjectMemory(
  basePath: string,
  project: string,
  answers: InitAnswers
): Promise<string> {
  const { dir, created } = await createProject(basePath, project);
  const date = new Date().toISOString().slice(0, 10);

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

  return written.length > 0
    ? `Project "${project}" initialized. Files written: ${written.join(", ")}`
    : `Project "${project}" already has content in all files. No files were overwritten.`;
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
