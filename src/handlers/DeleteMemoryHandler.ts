import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { deleteMemory, MEMORY_FILES } from "../vault.js";
import { resolveContextAndRemember, contextNote } from "./resolveContext.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class DeleteMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodOptional<z.ZodString>;
    filename: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "delete_memory";
  public readonly description = `Delete a custom memory file from a project. Standard files (${MEMORY_FILES.join(", ")}) are protected and cannot be deleted — use write_memory to clear their content instead.`;
  public readonly inputSchema = z.object({
    project: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Project name. If omitted, auto-discovered from workspace_root (.aivault.json) or last used project."
      ),
    filename: z.string().min(1).describe("File to delete (must be a .md file)"),
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

    await deleteMemory(ctx.basePath, ctx.project, args.filename);
    return {
      content: [{ type: "text", text: `Deleted: ${ctx.project}/${args.filename}${contextNote(ctx)}` }],
    };
  }
}
