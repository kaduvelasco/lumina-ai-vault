import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { checkProjectHealth } from "../vault.js";
import { resolveContextAndRemember, contextNote } from "./resolveContext.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class HealthCheckHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "check_project_health";
  public readonly description =
    "Verify if all required memory files exist for a project and report its health status.";
  public readonly inputSchema = z.object({
    project: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Project name to check. If omitted, auto-discovered from workspace_root (.aivault.json) or last used project."
      ),
    path: z.string().optional().describe(PATH_DESCRIPTION),
    workspace_root: z
      .string()
      .optional()
      .describe("Project folder path. Used to auto-discover .aivault.json when project is omitted."),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const ctx = await resolveContextAndRemember(this.basePath, args);
    if (!ctx.ok) return ctx.response;

    const health = await checkProjectHealth(ctx.basePath, ctx.project);

    let report = `Health report for project: ${health.project}${contextNote(ctx)}\n`;
    report += `Status: ${health.isHealthy ? "HEALTHY ✅" : "UNHEALTHY ❌"}\n\n`;
    report += "Files:\n";

    for (const [file, status] of Object.entries(health.files)) {
      report += `- ${file}: ${status === "ok" ? "OK" : "MISSING"}\n`;
    }

    if (!health.isHealthy) {
      report +=
        "\nRecommendation: Use create_project or init_project_memory to restore missing files.";
    }

    return {
      content: [{ type: "text", text: report }],
      isError: !health.isHealthy,
    };
  }
}
