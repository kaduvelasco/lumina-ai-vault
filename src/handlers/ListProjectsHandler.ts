import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listProjects, resolveBasePath } from "../vault.js";

export class ListProjectsHandler extends BaseToolHandler<
  z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "list_projects";
  public readonly description = "List all projects in the vault";
  public readonly inputSchema = z.object({
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const projects = await listProjects(resolvedPath);
    return {
      content: [
        {
          type: "text",
          text:
            projects.length > 0
              ? `Projects in vault:\n${projects.map((p) => `- ${p}`).join("\n")}`
              : "No projects found. Use create_project to add one.",
        },
      ],
    };
  }
}
