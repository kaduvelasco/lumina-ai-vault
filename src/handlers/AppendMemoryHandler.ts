import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { appendMemory, MEMORY_FILES, resolveBasePath } from "../vault.js";

export class AppendMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    filename: z.ZodString;
    content: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "append_memory";
  public readonly description =
    "Append content to a memory file without overwriting existing content. Use this to add entries to decisions.md or progress.md.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    filename: z
      .string()
      .min(1)
      .describe(`File to append to. Standard files: ${MEMORY_FILES.join(", ")}`),
    content: z.string().describe("Content to append"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    await appendMemory(resolvedPath, args.project, args.filename, args.content);
    return {
      content: [
        {
          type: "text",
          text: `Appended to: ${args.project}/${args.filename}`,
        },
      ],
    };
  }
}
