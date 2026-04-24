import { z } from "zod";
import { resolve } from "path";
import { BaseToolHandler } from "./base.js";
import { readLocalConfig, unregisterSubProject } from "../vault.js";
import { logger } from "../logger.js";

export class UnregisterSubProjectHandler extends BaseToolHandler<
  z.ZodObject<{
    workspace_root: z.ZodOptional<z.ZodString>;
    config_root: z.ZodOptional<z.ZodString>;
    subproject_key: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "unregister_subproject";
  public readonly description = `Remove a sub-project entry from .aivault.json.

Two ways to identify which sub-project to remove:

1. Provide "workspace_root" — the tool walks up to find .aivault.json and determines
   the sub-project key automatically from the relative path.

2. Provide both "config_root" (directory containing .aivault.json) and "subproject_key"
   (the relative path key, e.g. "local/caedauth") to remove it explicitly.

This does NOT delete the vault or any memory files. It only removes the registration
entry from .aivault.json. The vault data remains intact.`;

  public readonly inputSchema = z.object({
    workspace_root: z
      .string()
      .optional()
      .describe(
        "Path to the sub-project folder. The tool will walk up to find .aivault.json and auto-detect the sub-project key."
      ),
    config_root: z
      .string()
      .optional()
      .describe(
        "Directory containing .aivault.json (usually the project root). Required when subproject_key is provided."
      ),
    subproject_key: z
      .string()
      .optional()
      .describe(
        'Relative path key of the sub-project to remove (e.g. "local/caedauth"). Required when config_root is provided.'
      ),
  });

  constructor(_basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    let configRoot: string;
    let subProjectKey: string;

    if (args.workspace_root) {
      const local = await readLocalConfig(args.workspace_root);

      if (!local) {
        return {
          content: [
            {
              type: "text",
              text: `No .aivault.json found in any parent directory of "${args.workspace_root}".`,
            },
          ],
          isError: true,
        };
      }

      if (!local.isSubProject) {
        return {
          content: [
            {
              type: "text",
              text: `"${args.workspace_root}" is not registered as a sub-project in ${local.configRoot}/.aivault.json.\n\nRegistered sub-projects can be viewed with get_vault_config (passing workspace_root).`,
            },
          ],
          isError: true,
        };
      }

      configRoot = local.configRoot;
      subProjectKey = local.subProjectKey!;
      logger.info(
        `Auto-detected sub-project key "${subProjectKey}" from workspace_root "${args.workspace_root}"`
      );
    } else if (args.config_root && args.subproject_key) {
      configRoot = resolve(args.config_root);
      subProjectKey = args.subproject_key;
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Please provide one of:\n- "workspace_root": path to the sub-project folder\n- "config_root" + "subproject_key": explicit identification`,
          },
        ],
        isError: true,
      };
    }

    await unregisterSubProject(configRoot, subProjectKey);

    return {
      content: [
        {
          type: "text",
          text: `Sub-project "${subProjectKey}" removed from ${configRoot}/.aivault.json.\n\nNote: vault data at the project path was not deleted.`,
        },
      ],
    };
  }
}
