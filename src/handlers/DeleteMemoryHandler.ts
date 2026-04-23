import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { deleteMemory, MEMORY_FILES, resolveBasePath } from "../vault.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class DeleteMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    filename: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "delete_memory";
  public readonly description = `Delete a custom memory file from a project. Standard files (${MEMORY_FILES.join(", ")}) are protected and cannot be deleted — use write_memory to clear their content instead.`;
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    filename: z.string().min(1).describe("File to delete (must be a .md file)"),
    path: z.string().optional().describe(PATH_DESCRIPTION),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    await deleteMemory(resolvedPath, args.project, args.filename);
    return {
      content: [
        {
          type: "text",
          text: `Deleted: ${args.project}/${args.filename}`,
        },
      ],
    };
  }
}
