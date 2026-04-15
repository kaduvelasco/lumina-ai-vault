import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  appendFileSync,
  unlinkSync,
  statSync,
  openSync,
  readSync,
  closeSync,
  rmSync,
} from "fs";
import { join, resolve } from "path";
import { homedir } from "os";

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

// Pre-computed trimmed versions for template comparison, avoiding repeated .trim() calls.
const MEMORY_TEMPLATES_TRIMMED: Record<MemoryFile, string> = Object.fromEntries(
  MEMORY_FILES.map((f) => [f, MEMORY_TEMPLATES[f].trim()])
) as Record<MemoryFile, string>;

export function resolveBasePath(envPath?: string): string {
  // Use || instead of ?? so empty strings fall through to the next option.
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

// Accepts only *.md filenames that start with an alphanumeric character.
// The leading-alphanumeric requirement also blocks "." and ".." path traversal.
function validateFilename(filename: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*\.md$/.test(filename)) {
    throw new Error(
      `Invalid filename: "${filename}". Must be a .md file starting with a letter or digit.`
    );
  }
  return filename;
}

// Reads only the last byte of a file to check for a trailing newline.
// Uses try/finally to guarantee the file descriptor is always closed.
function getLastChar(filePath: string): string {
  const { size } = statSync(filePath);
  if (size === 0) return "";
  const fd = openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(1);
    readSync(fd, buf, 0, 1, size - 1);
    return buf.toString("utf-8");
  } finally {
    closeSync(fd);
  }
}

// Converts a comma/semicolon/newline-separated string into a Markdown list.
// Strips any leading "- " so items from AI agents don't get double-prefixed.
function toList(value: string | undefined): string {
  if (!value?.trim()) return "-";
  return value
    .split(/[,\n;]+/)
    .map((s) => s.trim().replace(/^-\s+/, ""))
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");
}

export function listProjects(basePath: string): string[] {
  if (!existsSync(basePath)) return [];
  return readdirSync(basePath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function listFiles(basePath: string, project: string): string[] {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

export function createProject(
  basePath: string,
  name: string
): { dir: string; created: boolean } {
  const dir = projectPath(basePath, name);
  const created = !existsSync(dir);
  mkdirSync(dir, { recursive: true });
  for (const file of MEMORY_FILES) {
    const filePath = join(dir, file);
    if (!existsSync(filePath)) {
      writeFileSync(filePath, MEMORY_TEMPLATES[file], "utf-8");
    }
  }
  return { dir, created };
}

export function deleteProject(basePath: string, project: string): void {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);
  rmSync(dir, { recursive: true });
}

export function readMemory(basePath: string, project: string, filename: string): string {
  const dir = projectPath(basePath, project);
  const safe = validateFilename(filename);
  const filePath = join(dir, safe);
  if (!existsSync(filePath)) throw new Error(`File not found: ${project}/${safe}`);
  return readFileSync(filePath, "utf-8");
}

export function writeMemory(
  basePath: string,
  project: string,
  filename: string,
  content: string
): void {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) {
    throw new Error(`Project not found: "${project}". Use create_project first.`);
  }
  const safe = validateFilename(filename);
  writeFileSync(join(dir, safe), content, "utf-8");
}

export function appendMemory(
  basePath: string,
  project: string,
  filename: string,
  content: string
): void {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) {
    throw new Error(`Project not found: "${project}". Use create_project first.`);
  }
  const safe = validateFilename(filename);
  const filePath = join(dir, safe);
  const lastChar = existsSync(filePath) ? getLastChar(filePath) : "";
  const prefix = lastChar.length > 0 && lastChar !== "\n" ? "\n" : "";
  appendFileSync(filePath, prefix + content, "utf-8");
}

export function deleteMemory(basePath: string, project: string, filename: string): void {
  const safe = validateFilename(filename);
  if ((MEMORY_FILES as readonly string[]).includes(safe)) {
    throw new Error(
      `Cannot delete standard file "${safe}". Use write_memory to clear its content instead.`
    );
  }
  const dir = projectPath(basePath, project);
  const filePath = join(dir, safe);
  if (!existsSync(filePath)) throw new Error(`File not found: ${project}/${safe}`);
  unlinkSync(filePath);
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

export function initProjectMemory(
  basePath: string,
  project: string,
  answers: InitAnswers
): string {
  const { dir, created } = createProject(basePath, project);
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
      // Brand-new project: files were just written with blank templates — always fill them.
      shouldWrite = true;
    } else {
      // Existing project: only overwrite files that still hold the blank template.
      const existing = readFileSync(filePath, "utf-8").trim();
      shouldWrite = !existing || existing === MEMORY_TEMPLATES_TRIMMED[file];
    }

    if (shouldWrite) {
      writeFileSync(filePath, filled[file], "utf-8");
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
}

export interface SearchOutput {
  results: SearchResult[];
  truncated: boolean;
}

export function searchMemory(
  basePath: string,
  query: string,
  project?: string,
  limit = 100
): SearchOutput {
  if (!query.trim()) {
    throw new Error("Search query cannot be empty.");
  }
  if (limit < 1) {
    throw new Error(`Invalid limit: ${limit}. Must be at least 1.`);
  }

  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();
  // Collect one extra result to detect truncation without a separate flag.
  const cap = limit + 1;

  const projects = project ? [project] : listProjects(basePath);

  outer: for (const proj of projects) {
    let dir: string;
    try {
      dir = projectPath(basePath, proj);
    } catch (err) {
      if (project !== undefined) throw err; // Explicit project name — surface the error.
      continue; // listProjects()-sourced name with invalid chars — skip silently.
    }
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = join(dir, file);
      const lines = readFileSync(filePath, "utf-8").split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? "";
        if (line.toLowerCase().includes(lowerQuery)) {
          results.push({ project: proj, file, line: i + 1, text: line.trim() });
          if (results.length === cap) break outer;
        }
      }
    }
  }

  const truncated = results.length === cap;
  return { results: truncated ? results.slice(0, limit) : results, truncated };
}

export function loadProjectContext(basePath: string, project: string): string {
  const dir = projectPath(basePath, project);
  if (!existsSync(dir)) throw new Error(`Project not found: "${project}"`);

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const parts: string[] = [];
  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf-8").trim();
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
