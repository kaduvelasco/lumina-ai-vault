import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listFiles } from "../vault.js";
import { resolveContextAndRemember, contextNote } from "./resolveContext.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class ListFilesHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "list_files";
  public readonly description = "List all memory files (.md) inside a project";
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

    const files = await listFiles(ctx.basePath, ctx.project);
    return {
      content: [
        {
          type: "text",
          text:
            files.length > 0
              ? `Files in "${ctx.project}"${contextNote(ctx)}:\n${files.map((f) => `- ${f}`).join("\n")}`
              : `No files found in project "${ctx.project}".`,
        },
      ],
    };
  }
}
