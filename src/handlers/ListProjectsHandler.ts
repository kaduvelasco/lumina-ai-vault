import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { listProjects } from "../vault.js";

export class ListProjectsHandler extends BaseToolHandler<z.ZodObject<Record<string, never>>> {
  public readonly name = "list_projects";
  public readonly description = "List all projects in the vault";
  public readonly inputSchema = z.object({});

  constructor(private basePath: string) {
    super();
  }

  async execute(_args: z.infer<typeof this.inputSchema>) {
    const projects = await listProjects(this.basePath);
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
