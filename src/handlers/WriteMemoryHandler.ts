import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { writeMemory, MEMORY_FILES } from "../vault.js";

export class WriteMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    filename: z.ZodString;
    content: z.ZodString;
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
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    await writeMemory(this.basePath, args.project, args.filename, args.content);
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
