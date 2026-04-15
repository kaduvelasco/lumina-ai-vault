import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const _require = createRequire(import.meta.url);
const { version } = _require("../package.json") as { version: string };
import {
  resolveBasePath,
  listProjects,
  listFiles,
  createProject,
  deleteProject,
  readMemory,
  writeMemory,
  appendMemory,
  deleteMemory,
  searchMemory,
  loadProjectContext,
  initProjectMemory,
  InitAnswers,
  MEMORY_FILES,
} from "./vault.js";

export function createServer(basePath: string) {
  const server = new Server(
    { name: "lumina-aivault", version },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "init_project_memory",
        description: `Initialize a project's memory files with structured content collected from the user.

Before calling this tool, ask the user the following questions (skip any they can't answer yet):
1. What is the project description? (what does it do?)
2. What is the main goal or objective?
3. What is the current development phase? (planning / mvp / active / maintenance)
4. Describe the system architecture in a sentence or two.
5. What are the main components? (comma-separated)
6. What programming languages are used?
7. What frameworks and libraries are used?
8. What infrastructure is used? (cloud provider, database, containers, etc.)
9. What are the immediate next tasks?

Only files that are empty or contain the blank template will be written — existing content is never overwritten.`,
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name (alphanumeric, hyphens, underscores)" },
            description: { type: "string", description: "What the project does" },
            goal: { type: "string", description: "Main goal or objective" },
            phase: { type: "string", description: "Current phase: planning / mvp / active / maintenance" },
            architecture_overview: { type: "string", description: "Brief architecture description" },
            components: { type: "string", description: "Main components, comma-separated" },
            languages: { type: "string", description: "Programming languages" },
            frameworks: { type: "string", description: "Frameworks and libraries" },
            infrastructure: { type: "string", description: "Infrastructure and hosting" },
            next_steps: { type: "string", description: "Immediate next tasks, comma or newline separated" },
          },
          required: ["project"],
        },
      },
      {
        name: "list_projects",
        description: "List all projects in the vault",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_files",
        description: "List all memory files (.md) inside a project",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
          },
          required: ["project"],
        },
      },
      {
        name: "create_project",
        description: `Create a new project in the vault with standard memory files: ${MEMORY_FILES.join(", ")}. Use "global" for shared cross-project knowledge.`,
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name (alphanumeric, hyphens, underscores)" },
          },
          required: ["name"],
        },
      },
      {
        name: "delete_project",
        description: "Permanently delete a project and all its memory files. This action is irreversible. Requires confirm: true to proceed — always ask the user explicitly before calling this tool.",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name to delete" },
            confirm: { type: "boolean", description: "Must be true to confirm permanent deletion" },
          },
          required: ["project", "confirm"],
        },
      },
      {
        name: "read_memory",
        description: "Read a memory file from a project",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            filename: {
              type: "string",
              description: `File to read. Standard files: ${MEMORY_FILES.join(", ")}`,
            },
          },
          required: ["project", "filename"],
        },
      },
      {
        name: "write_memory",
        description: "Overwrite the full content of a memory file",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            filename: {
              type: "string",
              description: `File to write. Standard files: ${MEMORY_FILES.join(", ")}`,
            },
            content: { type: "string", description: "New full content of the file" },
          },
          required: ["project", "filename", "content"],
        },
      },
      {
        name: "append_memory",
        description: "Append content to a memory file without overwriting existing content. Use this to add entries to decisions.md or progress.md.",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            filename: {
              type: "string",
              description: `File to append to. Standard files: ${MEMORY_FILES.join(", ")}`,
            },
            content: { type: "string", description: "Content to append" },
          },
          required: ["project", "filename", "content"],
        },
      },
      {
        name: "delete_memory",
        description: `Delete a custom memory file from a project. Standard files (${MEMORY_FILES.join(", ")}) are protected and cannot be deleted — use write_memory to clear their content instead.`,
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
            filename: {
              type: "string",
              description: "File to delete (must be a .md file)",
            },
          },
          required: ["project", "filename"],
        },
      },
      {
        name: "search_memory",
        description: `Search for a text string across all memory files in the vault, or within a specific project.
Results are returned as: project/file:lineNumber  matched text
Accepts an optional limit parameter (default: 100).`,
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Text to search for (case-insensitive, cannot be empty)" },
            project: {
              type: "string",
              description: "Limit search to a specific project (optional)",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 100)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "load_project_context",
        description: "Load all memory files for a project concatenated into a single context block. Files that still contain only the blank template are omitted.",
        inputSchema: {
          type: "object",
          properties: {
            project: { type: "string", description: "Project name" },
          },
          required: ["project"],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case "init_project_memory": {
          const projectName = String(args.project ?? "").trim();
          if (!projectName) {
            return {
              content: [{ type: "text", text: 'Error: "project" is required and cannot be empty.' }],
              isError: true,
            };
          }
          const answers: InitAnswers = {};
          if (args.description) answers.description = String(args.description);
          if (args.goal) answers.goal = String(args.goal);
          if (args.phase) answers.phase = String(args.phase);
          if (args.architecture_overview) answers.architectureOverview = String(args.architecture_overview);
          if (args.components) answers.components = String(args.components);
          if (args.languages) answers.languages = String(args.languages);
          if (args.frameworks) answers.frameworks = String(args.frameworks);
          if (args.infrastructure) answers.infrastructure = String(args.infrastructure);
          if (args.next_steps) answers.nextSteps = String(args.next_steps);
          const message = initProjectMemory(basePath, projectName, answers);
          return { content: [{ type: "text", text: message }] };
        }

        case "list_projects": {
          const projects = listProjects(basePath);
          return {
            content: [
              {
                type: "text",
                text:
                  projects.length > 0
                    ? `Projects in vault:\n${projects.map((p) => `- ${p}`).join("\n")}`
                    : "No projects found. Use create_project to add one.",
              },
            ],
          };
        }

        case "list_files": {
          const files = listFiles(basePath, String(args.project));
          return {
            content: [
              {
                type: "text",
                text:
                  files.length > 0
                    ? `Files in "${args.project}":\n${files.map((f) => `- ${f}`).join("\n")}`
                    : `No files found in project "${args.project}".`,
              },
            ],
          };
        }

        case "create_project": {
          const projectName = String(args.name ?? "").trim();
          if (!projectName) {
            return {
              content: [{ type: "text", text: 'Error: "name" is required and cannot be empty.' }],
              isError: true,
            };
          }
          const { dir, created } = createProject(basePath, projectName);
          return {
            content: [{
              type: "text",
              text: created
                ? `Project "${projectName}" created at: ${dir}`
                : `Project "${projectName}" already exists at: ${dir}`,
            }],
          };
        }

        case "delete_project": {
          const projectName = String(args.project ?? "").trim();
          if (!projectName) {
            return {
              content: [{ type: "text", text: 'Error: "project" is required and cannot be empty.' }],
              isError: true,
            };
          }
          if (args.confirm !== true) {
            return {
              content: [{ type: "text", text: 'Error: pass confirm: true to confirm permanent deletion. Ask the user before proceeding.' }],
              isError: true,
            };
          }
          deleteProject(basePath, projectName);
          return {
            content: [{ type: "text", text: `Project "${projectName}" deleted.` }],
          };
        }

        case "read_memory": {
          const content = readMemory(
            basePath,
            String(args.project),
            String(args.filename)
          );
          return {
            content: [
              {
                type: "text",
                text: content.trim() || "(file is empty)",
              },
            ],
          };
        }

        case "write_memory": {
          writeMemory(
            basePath,
            String(args.project),
            String(args.filename),
            String(args.content)
          );
          return {
            content: [
              {
                type: "text",
                text: `Written: ${args.project}/${args.filename}`,
              },
            ],
          };
        }

        case "append_memory": {
          appendMemory(
            basePath,
            String(args.project),
            String(args.filename),
            String(args.content)
          );
          return {
            content: [
              {
                type: "text",
                text: `Appended to: ${args.project}/${args.filename}`,
              },
            ],
          };
        }

        case "delete_memory": {
          deleteMemory(
            basePath,
            String(args.project),
            String(args.filename)
          );
          return {
            content: [
              {
                type: "text",
                text: `Deleted: ${args.project}/${args.filename}`,
              },
            ],
          };
        }

        case "search_memory": {
          const rawLimit = typeof args.limit === "number" ? args.limit : 100;
          const limit = Math.max(1, Math.floor(rawLimit));
          const { results, truncated } = searchMemory(
            basePath,
            String(args.query),
            args.project ? String(args.project) : undefined,
            limit
          );
          if (results.length === 0) {
            return {
              content: [{ type: "text", text: `No results for "${args.query}"` }],
            };
          }
          const lines = results.map(
            (r) => `${r.project}/${r.file}:${r.line}  ${r.text}`
          );
          if (truncated) lines.push(`(limit of ${limit} results reached)`);
          return {
            content: [{ type: "text", text: lines.join("\n") }],
          };
        }

        case "load_project_context": {
          const context = loadProjectContext(basePath, String(args.project));
          return { content: [{ type: "text", text: context }] };
        }

        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer(basePath?: string) {
  const resolved = resolveBasePath(basePath);
  const server = createServer(resolved);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
