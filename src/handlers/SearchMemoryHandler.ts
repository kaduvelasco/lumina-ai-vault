import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { searchMemory } from "../vault.js";

export class SearchMemoryHandler extends BaseToolHandler<z.ZodObject<{
  query: z.ZodString;
  project: z.ZodOptional<z.ZodString>;
  limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
  context_lines: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}>> {
  public readonly name = "search_memory";
  public readonly description = `Search for a text string across all memory files in the vault, or within a specific project.
Results are returned as: project/file:lineNumber  matched text
Accepts optional parameters for limit and context_lines.`;
  public readonly inputSchema = z.object({
    query: z.string().min(1).describe("Text to search for (case-insensitive, cannot be empty)"),
    project: z.string().optional().describe("Limit search to a specific project (optional)"),
    limit: z.number().optional().default(100).describe("Maximum number of results to return (default: 100)"),
    context_lines: z.number().optional().default(0).describe("Number of context lines to show around each match (default: 0)"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const { results, truncated } = await searchMemory(
      this.basePath,
      args.query,
      args.project,
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
        output += `\nContext:\n${r.context.map(line => `  ${line}`).join("\n")}\n---`;
      }
      return output;
    });

    if (truncated) lines.push(`(limit of ${args.limit} results reached)`);

    return {
      content: [{ type: "text", text: lines.join("\n") }],
    };
  }
}
