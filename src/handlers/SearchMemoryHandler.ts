import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { searchMemory, resolveBasePath } from "../vault.js";
import { resolveContext, resolveContextAndRemember } from "./resolveContext.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class SearchMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    query: z.ZodString;
    project: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    context_lines: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "search_memory";
  public readonly description = `Search for a text string across all memory files in the vault, or within a specific project.
Results are returned as: project/file:lineNumber  matched text
Accepts optional parameters for limit and context_lines.`;
  public readonly inputSchema = z.object({
    query: z.string().min(1).describe("Text to search for (case-insensitive, cannot be empty)"),
    project: z
      .string()
      .optional()
      .describe(
        "Limit search to a specific project. If omitted without workspace_root, searches all projects. If workspace_root is provided, auto-discovers project from .aivault.json."
      ),
    limit: z
      .number()
      .optional()
      .default(100)
      .describe("Maximum number of results to return (default: 100)"),
    context_lines: z
      .number()
      .optional()
      .default(0)
      .describe("Number of context lines to show around each match (default: 0)"),
    path: z.string().optional().describe(PATH_DESCRIPTION),
    workspace_root: z
      .string()
      .optional()
      .describe(
        "Project folder path. When provided, auto-discovers .aivault.json to restrict search to that project."
      ),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    let basePath = this.basePath;
    let project: string | undefined = args.project;

    // Auto-discover project from workspace_root only (not global — search all projects by default)
    if (!project && args.workspace_root) {
      const ctx = await resolveContext(this.basePath, {
        workspace_root: args.workspace_root,
        path: args.path,
      });
      if (ctx.ok) {
        project = ctx.project;
        basePath = ctx.basePath;
        await resolveContextAndRemember(this.basePath, {
          project: ctx.project,
          path: args.path,
        });
      }
    } else if (args.path) {
      basePath = resolveBasePath(args.path);
    }

    if (project) {
      await resolveContextAndRemember(this.basePath, { project, path: args.path });
    }

    const { results, truncated } = await searchMemory(
      basePath,
      args.query,
      project,
      args.limit,
      args.context_lines
    );

    if (results.length === 0) {
      return {
        content: [{ type: "text", text: `No results for "${args.query}"` }],
      };
    }

    const lines = results.map((r) => {
      let output = `${r.project}/${r.file}:${r.line}  ${r.text}`;
      if (r.context && r.context.length > 0) {
        output += `\nContext:\n${r.context.map((line) => `  ${line}`).join("\n")}\n---`;
      }
      return output;
    });

    if (truncated) lines.push(`(limit of ${args.limit} results reached)`);

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
}
