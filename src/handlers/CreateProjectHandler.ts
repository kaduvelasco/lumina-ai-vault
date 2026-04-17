import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { createProject, MEMORY_FILES } from "../vault.js";

export class CreateProjectHandler extends BaseToolHandler<
  z.ZodObject<{
    name: z.ZodString;
  }>
> {
  public readonly name = "create_project";
  public readonly description = `Create a new project in the vault with standard memory files: ${MEMORY_FILES.join(", ")}. Use "global" for shared cross-project knowledge.`;
  public readonly inputSchema = z.object({
    name: z.string().min(1).describe("Project name (alphanumeric, hyphens, underscores)"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const projectName = args.name.trim();
    const { dir, created } = await createProject(this.basePath, projectName);
    return {
      content: [
        {
          type: "text",
          text: created
            ? `Project "${projectName}" created at: ${dir}`
            : `Project "${projectName}" already exists at: ${dir}`,
        },
      ],
    };
  }
}
