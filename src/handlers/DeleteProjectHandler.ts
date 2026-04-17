import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { deleteProject } from "../vault.js";

export class DeleteProjectHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    confirm: z.ZodBoolean;
  }>
> {
  public readonly name = "delete_project";
  public readonly description =
    "Permanently delete a project and all its memory files. This action is irreversible. Requires confirm: true to proceed — always ask the user explicitly before calling this tool.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name to delete"),
    confirm: z.boolean().describe("Must be true to confirm permanent deletion"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const projectName = args.project.trim();
    if (args.confirm !== true) {
      return {
        content: [
          {
            type: "text",
            text: "Error: pass confirm: true to confirm permanent deletion. Ask the user before proceeding.",
          },
        ],
        isError: true,
      };
    }
    await deleteProject(this.basePath, projectName);
    return {
      content: [{ type: "text", text: `Project "${projectName}" deleted.` }],
    };
  }
}
