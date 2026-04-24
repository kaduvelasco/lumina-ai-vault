import { resolveBasePath, readLocalConfig } from "../vault.js";
import { readGlobalConfig, updateLastProject } from "../config.js";
import { logger } from "../logger.js";

export interface ResolvedContext {
  ok: true;
  project: string;
  basePath: string;
  source: "provided" | "local_config" | "global_config";
}

export interface UnresolvedContext {
  ok: false;
  response: { content: Array<{ type: string; text: string }> };
}

const NEEDS_INPUT_MESSAGE = `Could not determine the active project or vault path automatically.

Please provide one of the following:
- "workspace_root": path to your project folder — the tool will read .aivault.json if present
- "project": explicit project name (optionally with "path" for a custom vault location)

Tip: run init_project_memory with workspace_root to create .aivault.json and enable automatic discovery in future sessions.`;

export function contextNote(ctx: ResolvedContext): string {
  if (ctx.source === "local_config") return ` [project: ${ctx.project}, from .aivault.json]`;
  if (ctx.source === "global_config") return ` [project: ${ctx.project}, from last session]`;
  return "";
}

export async function resolveContext(
  serverBasePath: string,
  args: { project?: string | undefined; path?: string | undefined; workspace_root?: string | undefined }
): Promise<ResolvedContext | UnresolvedContext> {
  // Explicit project takes priority
  const projectName = args.project?.trim();
  if (projectName) {
    const basePath = args.path ? resolveBasePath(args.path) : serverBasePath;
    return { ok: true, project: projectName, basePath, source: "provided" };
  }

  // Step 1: .aivault.json in workspace_root
  if (args.workspace_root) {
    const local = await readLocalConfig(args.workspace_root);
    if (local) {
      const basePath = local.path ? resolveBasePath(local.path) : serverBasePath;
      logger.info(`Auto-discovered project "${local.project}" from .aivault.json`);
      return { ok: true, project: local.project, basePath, source: "local_config" };
    }
  }

  // Step 2: global config (lastProject + globalVaultPath)
  const globalCfg = await readGlobalConfig();
  if (globalCfg.lastProject) {
    const basePath = globalCfg.globalVaultPath
      ? resolveBasePath(globalCfg.globalVaultPath)
      : serverBasePath;
    logger.info(`Using last known project "${globalCfg.lastProject}" from global config`);
    return { ok: true, project: globalCfg.lastProject, basePath, source: "global_config" };
  }

  // Step 3: needs user input
  return {
    ok: false,
    response: { content: [{ type: "text", text: NEEDS_INPUT_MESSAGE }] },
  };
}

// Like resolveContext but also persists the resolved project as lastProject
export async function resolveContextAndRemember(
  serverBasePath: string,
  args: { project?: string | undefined; path?: string | undefined; workspace_root?: string | undefined }
): Promise<ResolvedContext | UnresolvedContext> {
  const result = await resolveContext(serverBasePath, args);
  if (result.ok) {
    await updateLastProject(result.project).catch((err) =>
      logger.error("Failed to update lastProject", err)
    );
  }
  return result;
}
