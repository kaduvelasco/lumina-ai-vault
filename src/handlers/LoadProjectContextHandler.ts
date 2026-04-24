import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { loadProjectContext } from "../vault.js";
import { resolveContextAndRemember } from "./resolveContext.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class LoadProjectContextHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "load_project_context";
  public readonly description =
    "Load all memory files for a project concatenated into a single context block. Files that still contain only the blank template are omitted.";
  public readonly inputSchema = z.object({
    project: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Project name. If omitted, auto-discovered from workspace_root (.aivault.json) or last used project."
      ),
    path: z.string().optional().describe(PATH_DESCRIPTION),
    workspace_root: z
      .string()
      .optional()
      .describe("Project folder path. Used to auto-discover .aivault.json when project is omitted."),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const ctx = await resolveContextAndRemember(this.basePath, args);
    if (!ctx.ok) return ctx.response;

    const context = await loadProjectContext(ctx.basePath, ctx.project);
    return { content: [{ type: "text", text: context }] };
  }
}
