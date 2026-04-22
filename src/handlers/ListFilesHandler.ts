import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listFiles, resolveBasePath } from "../vault.js";

export class ListFilesHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "list_files";
  public readonly description = "List all memory files (.md) inside a project";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const files = await listFiles(resolvedPath, args.project);
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
