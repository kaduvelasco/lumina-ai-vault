import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { deleteProject, resolveBasePath } from "../vault.js";

export class DeleteProjectHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    confirm: z.ZodBoolean;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "delete_project";
  public readonly description =
    "Permanently delete a project and all its memory files. This action is irreversible. Requires confirm: true to proceed — always ask the user explicitly before calling this tool.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name to delete"),
    confirm: z.boolean().describe("Must be true to confirm permanent deletion"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
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
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    await deleteProject(resolvedPath, projectName);
    return {
      content: [{ type: "text", text: `Project "${projectName}" deleted.` }],
    };
  }
}
