import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { loadProjectContext, resolveBasePath } from "../vault.js";

export class LoadProjectContextHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "load_project_context";
  public readonly description =
    "Load all memory files for a project concatenated into a single context block. Files that still contain only the blank template are omitted.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const context = await loadProjectContext(resolvedPath, args.project);
    return { content: [{ type: "text", text: context }] };
  }
}
