import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { writeMemory, MEMORY_FILES, resolveBasePath } from "../vault.js";

export class WriteMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    filename: z.ZodString;
    content: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "write_memory";
  public readonly description = "Overwrite the full content of a memory file";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    filename: z
      .string()
      .min(1)
      .describe(`File to write. Standard files: ${MEMORY_FILES.join(", ")}`),
    content: z.string().describe("New full content of the file"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    await writeMemory(resolvedPath, args.project, args.filename, args.content);
    return {
      content: [
        {
          type: "text",
          text: `Written: ${args.project}/${args.filename}`,
        },
      ],
    };
  }
}
