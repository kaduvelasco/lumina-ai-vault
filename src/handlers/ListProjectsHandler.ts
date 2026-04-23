import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listProjects, resolveBasePath } from "../vault.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class ListProjectsHandler extends BaseToolHandler<
  z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "list_projects";
  public readonly description = "List all projects in the vault";
  public readonly inputSchema = z.object({
    path: z.string().optional().describe(PATH_DESCRIPTION),
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
