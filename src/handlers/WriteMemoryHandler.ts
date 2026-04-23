import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { writeMemory, MEMORY_FILES, resolveBasePath } from "../vault.js";
import { PATH_DESCRIPTION } from "./constants.js";

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
    path: z.string().optional().describe(PATH_DESCRIPTION),
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
