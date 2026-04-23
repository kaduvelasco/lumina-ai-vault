import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { readGlobalConfig } from "../config.js";

export class GetVaultConfigHandler extends BaseToolHandler<z.ZodObject<Record<string, never>>> {
  public readonly name = "get_vault_config";
  public readonly description =
    "Returns the current vault configuration: the active vault path and whether a global vault has been set via the CLI. Call this before init_project_memory when the user has not specified a vault path.";
  public readonly inputSchema = z.object({});

  constructor(private basePath: string) {
    super();
  }

  async execute(_args: z.infer<typeof this.inputSchema>) {
    const config = await readGlobalConfig();

    const report = {
      active_vault: this.basePath,
      global_vault_configured: !!config.globalVaultPath,
      global_vault_path: config.globalVaultPath ?? null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
    };
  }
}
