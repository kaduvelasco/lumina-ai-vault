import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { loadProjectContext } from "../vault.js";

export class LoadProjectContextHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
  }>
> {
  public readonly name = "load_project_context";
  public readonly description =
    "Load all memory files for a project concatenated into a single context block. Files that still contain only the blank template are omitted.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const context = await loadProjectContext(this.basePath, args.project);
    return { content: [{ type: "text", text: context }] };
  }
}
