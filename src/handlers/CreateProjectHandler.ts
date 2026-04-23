import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { createProject, MEMORY_FILES, resolveBasePath } from "../vault.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class CreateProjectHandler extends BaseToolHandler<
  z.ZodObject<{
    name: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "create_project";
  public readonly description = `Create a new project in the vault with standard memory files: ${MEMORY_FILES.join(", ")}. Use "global" for shared cross-project knowledge.`;
  public readonly inputSchema = z.object({
    name: z.string().min(1).describe("Project name (alphanumeric, hyphens, underscores)"),
    path: z.string().optional().describe(PATH_DESCRIPTION),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const projectName = args.name.trim();
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const { dir, created } = await createProject(resolvedPath, projectName);
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
