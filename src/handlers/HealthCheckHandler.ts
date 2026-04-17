import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { checkProjectHealth } from "../vault.js";

export class HealthCheckHandler extends BaseToolHandler<z.ZodObject<{
  project: z.ZodString;
}>> {
  public readonly name = "check_project_health";
  public readonly description = "Verify if all required memory files exist for a project and report its health status.";
  public readonly inputSchema = z.object({
    project: z.string().min(1).describe("Project name to check"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const health = await checkProjectHealth(this.basePath, args.project);
    
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
