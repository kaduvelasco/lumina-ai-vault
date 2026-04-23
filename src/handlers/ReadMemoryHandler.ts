import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { readMemory, MEMORY_FILES, resolveBasePath } from "../vault.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class ReadMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    filename: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "read_memory";
  public readonly description = "Read a memory file from a project";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    filename: z
      .string()
      .min(1)
      .describe(`File to read. Standard files: ${MEMORY_FILES.join(", ")}`),
    path: z.string().optional().describe(PATH_DESCRIPTION),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const content = await readMemory(resolvedPath, args.project, args.filename);
    return {
      content: [
        {
          type: "text",
          text: content.trim() || "(file is empty)",
        },
      ],
    };
  }
}
