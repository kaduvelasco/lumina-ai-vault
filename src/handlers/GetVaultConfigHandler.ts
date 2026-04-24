import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { readGlobalConfig } from "../config.js";
import { readLocalConfig } from "../vault.js";

export class GetVaultConfigHandler extends BaseToolHandler<
  z.ZodObject<{
    workspace_root: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "get_vault_config";
  public readonly description =
    "Returns the current vault configuration: active vault path, global vault settings, last used project, and sub-projects registered in the local .aivault.json (when workspace_root is provided). Call this before init_project_memory when the user has not specified a vault path.";

  public readonly inputSchema = z.object({
    workspace_root: z
      .string()
      .optional()
      .describe(
        "Project folder path. When provided, the tool reads .aivault.json (walking up the directory tree) and includes the local project and its sub-projects in the response."
      ),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    const config = await readGlobalConfig();

    const report: Record<string, unknown> = {
      active_vault: this.basePath,
      global_vault_configured: !!config.globalVaultPath,
      global_vault_path: config.globalVaultPath ?? null,
      last_project: config.lastProject ?? null,
    };

    if (args.workspace_root) {
      const local = await readLocalConfig(args.workspace_root);
      if (local) {
        report.local_config = {
          config_root: local.configRoot,
          project: local.project,
          path: local.path ?? null,
          is_subproject: local.isSubProject,
          subproject_key: local.subProjectKey ?? null,
        };
      } else {
        report.local_config = null;
      }
    }

    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    };
  }
}
