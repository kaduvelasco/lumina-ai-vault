import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listFiles } from "../vault.js";

export class ListFilesHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
  }>
> {
  public readonly name = "list_files";
  public readonly description = "List all memory files (.md) inside a project";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const files = await listFiles(this.basePath, args.project);
    return {
      content: [
        {
          type: "text",
          text:
            files.length > 0
              ? `Files in "${args.project}":\n${files.map((f) => `- ${f}`).join("\n")}`
              : `No files found in project "${args.project}".`,
        },
      ],
    };
  }
}
