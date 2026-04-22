import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { checkProjectHealth, resolveBasePath } from "../vault.js";

export class HealthCheckHandler extends BaseToolHandler<z.ZodObject<{
  project: z.ZodString;
  path: z.ZodOptional<z.ZodString>;
}>> {
  public readonly name = "check_project_health";
  public readonly description = "Verify if all required memory files exist for a project and report its health status.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name to check"),
    path: z.string().optional().describe('Base path where the memory is stored. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    const health = await checkProjectHealth(resolvedPath, args.project);
    
    let report = `Health report for project: ${health.project}\n`;
    report += `Status: ${health.isHealthy ? "HEALTHY ✅" : "UNHEALTHY ❌"}\n\n`;
    report += "Files:\n";
    
    for (const [file, status] of Object.entries(health.files)) {
      report += `- ${file}: ${status === "ok" ? "OK" : "MISSING"}\n`;
    }

    if (!health.isHealthy) {
      report += "\nRecommendation: Use create_project or init_project_memory to restore missing files.";
    }

    return {
      content: [{ type: "text", text: report }],
      isError: !health.isHealthy,
    };
  }
}
