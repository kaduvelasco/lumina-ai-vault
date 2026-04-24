import { z } from "zod";
import { resolve, relative } from "path";
import { BaseToolHandler } from "./base.js";
import {
  initProjectMemory,
  InitAnswers,
  resolveBasePath,
  readLocalConfig,
  registerSubProject,
  SubProjectConfig,
} from "../vault.js";
import { readGlobalConfig, updateLastProject } from "../config.js";
import { analyzeProject } from "../analyzers/projectAnalyzer.js";
import { PATH_DESCRIPTION } from "./constants.js";
import { logger } from "../logger.js";

const NEEDS_PROJECT_MESSAGE = `Could not determine the project name automatically.

Please provide one of the following:
- "workspace_root": path to your project folder — the tool will read .aivault.json if present, or create one after initialization
- "project": explicit project name to initialize

If this is a brand-new project with no .aivault.json yet, provide both "project" and "workspace_root" so the tool can create the config file for you.`;

export class InitProjectMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
    auto_detect: z.ZodOptional<z.ZodBoolean>;
    description: z.ZodOptional<z.ZodString>;
    goal: z.ZodOptional<z.ZodString>;
    phase: z.ZodOptional<z.ZodString>;
    architecture_overview: z.ZodOptional<z.ZodString>;
    components: z.ZodOptional<z.ZodString>;
    languages: z.ZodOptional<z.ZodString>;
    frameworks: z.ZodOptional<z.ZodString>;
    infrastructure: z.ZodOptional<z.ZodString>;
    next_steps: z.ZodOptional<z.ZodString>;
  }>
> {
  public readonly name = "init_project_memory";
  public readonly description = `Initialize a project's memory files with structured content.

FOLLOW THIS FLOW before calling this tool:

--- STEP 1: VAULT SELECTION ---
If the user has not explicitly specified a vault path, call get_vault_config first.
If global_vault_configured is true, ask the user:
  "A global vault is configured at <global_vault_path>. Do you want to use it for this project? (yes/no)"
  - If yes: pass that path as the \`path\` argument.
  - If no: leave \`path\` empty to use the current default.

--- STEP 2: PROJECT / SUB-PROJECT DISCOVERY ---
Always provide workspace_root if you know the project folder.

The tool will automatically detect whether this is:
  - A NEW TOP-LEVEL PROJECT: no .aivault.json found in any parent directory.
    → Creates vault + .aivault.json at workspace_root.
  - A NEW SUB-PROJECT: a .aivault.json exists in a parent directory (e.g. the repo root),
    but workspace_root is not yet registered.
    → Creates vault for the sub-project and registers it in the parent's .aivault.json.
    → Explicitly provide "path" if the sub-project vault should be stored at a custom location.
  - AN EXISTING PROJECT / SUB-PROJECT RE-INIT: already registered in .aivault.json.
    → Re-initializes only files that are empty or still contain the blank template.

--- STEP 3: PROJECT DATA ---
Ask the user: "How do you want to define the project data?
  1. Auto-analyze the project (recommended — I will read the project files)
  2. Enter manually"

If option 1:
  - Set auto_detect: true and pass workspace_root with that path.
  - The tool will analyze the project files and fill in the data automatically.
  - Skip all the manual questions below.

If option 2:
  - Ask the user the following questions (skip any they can't answer yet):
    1. What is the project description? (what does it do?)
    2. What is the main goal or objective?
    3. What is the current development phase? (planning / mvp / active / maintenance)
    4. Describe the system architecture in a sentence or two.
    5. What are the main components? (comma-separated)
    6. What programming languages are used?
    7. What frameworks and libraries are used?
    8. What infrastructure is used? (cloud provider, database, containers, etc.)
    9. What are the immediate next tasks?

Only files that are empty or contain the blank template will be written — existing content is never overwritten.`;

  public readonly inputSchema = z.object({
    project: z
      .string()
      .min(1)
      .optional()
      .describe(
        "Project name. If omitted, auto-discovered from workspace_root (.aivault.json). Required if workspace_root is not provided."
      ),
    path: z
      .string()
      .optional()
      .describe(
        PATH_DESCRIPTION +
          " For sub-projects: specify a custom vault location different from the parent project."
      ),
    workspace_root: z
      .string()
      .optional()
      .describe(
        "Local root directory of the project or sub-project. Used to auto-discover .aivault.json and to detect whether this is a new sub-project. Required when auto_detect is true."
      ),
    auto_detect: z
      .boolean()
      .optional()
      .describe(
        "When true, the tool analyzes the project files at workspace_root and infers description, languages, frameworks, and infrastructure automatically."
      ),
    description: z.string().optional().describe("What the project does"),
    goal: z.string().optional().describe("Main goal or objective"),
    phase: z.string().optional().describe("Current phase: planning / mvp / active / maintenance"),
    architecture_overview: z.string().optional().describe("Brief architecture description"),
    components: z.string().optional().describe("Main components, comma-separated"),
    languages: z.string().optional().describe("Programming languages"),
    frameworks: z.string().optional().describe("Frameworks and libraries"),
    infrastructure: z.string().optional().describe("Infrastructure and hosting"),
    next_steps: z.string().optional().describe("Immediate next tasks, comma or newline separated"),
  });

  constructor(private basePath: string) {
    super();
  }

  async execute(args: z.infer<typeof this.inputSchema>) {
    if (args.auto_detect && !args.workspace_root) {
      return {
        content: [{ type: "text", text: "Error: workspace_root is required when auto_detect is true." }],
        isError: true,
      };
    }

    // --- Resolve project name and vault path ---
    let projectName = args.project?.trim();
    let resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;
    let isNewSubProject = false;
    let subProjectKey: string | undefined;
    let subProjectConfigRoot: string | undefined;

    const localConfig = args.workspace_root ? await readLocalConfig(args.workspace_root) : null;

    if (localConfig) {
      if (!projectName) {
        projectName = localConfig.project;
        if (localConfig.path && !args.path) resolvedPath = resolveBasePath(localConfig.path);
      }

      // Detect a new sub-project: .aivault.json found in a PARENT directory and this
      // workspace_root is not yet registered in subprojects
      if (
        args.workspace_root &&
        !localConfig.isSubProject &&
        localConfig.configRoot !== resolve(args.workspace_root)
      ) {
        isNewSubProject = true;
        subProjectKey = relative(localConfig.configRoot, resolve(args.workspace_root)).replace(
          /\\/g,
          "/"
        );
        subProjectConfigRoot = localConfig.configRoot;
        // Use the sub-project's explicit path; fall back to default vault path
        if (!args.path) resolvedPath = this.basePath;
      }
    }

    if (!projectName) {
      // Fall back to lastProject for re-initialization only
      const globalCfg = await readGlobalConfig();
      if (globalCfg.lastProject) {
        projectName = globalCfg.lastProject;
        if (globalCfg.globalVaultPath && !args.path) {
          resolvedPath = resolveBasePath(globalCfg.globalVaultPath);
        }
        logger.info(`init_project_memory: using last known project "${projectName}"`);
      }
    }

    if (!projectName) {
      return { content: [{ type: "text", text: NEEDS_PROJECT_MESSAGE }] };
    }

    // --- Auto-detect project data ---
    let detected: InitAnswers = {};
    if (args.auto_detect && args.workspace_root) {
      detected = await analyzeProject(args.workspace_root);
    }

    const answers: InitAnswers = {
      description: args.description ?? detected.description,
      goal: args.goal ?? detected.goal,
      phase: args.phase ?? detected.phase,
      architectureOverview: args.architecture_overview ?? detected.architectureOverview,
      components: args.components ?? detected.components,
      languages: args.languages ?? detected.languages,
      frameworks: args.frameworks ?? detected.frameworks,
      infrastructure: args.infrastructure ?? detected.infrastructure,
      nextSteps: args.next_steps ?? detected.nextSteps,
    };

    // For new sub-projects: don't create .aivault.json at workspace_root;
    // register in the parent's .aivault.json instead.
    const workspaceRootForConfig = isNewSubProject ? undefined : args.workspace_root;

    const message = await initProjectMemory(
      resolvedPath,
      projectName,
      answers,
      workspaceRootForConfig,
      args.path ? resolvedPath : undefined
    );

    // Register new sub-project in parent .aivault.json
    let subProjectNote = "";
    if (isNewSubProject && subProjectKey && subProjectConfigRoot) {
      const entry: SubProjectConfig = { project: projectName };
      if (args.path) entry.path = resolvedPath;
      await registerSubProject(subProjectConfigRoot, subProjectKey, entry);
      subProjectNote =
        `\n\nSub-project "${projectName}" registered in ${subProjectConfigRoot}/.aivault.json` +
        ` under key "${subProjectKey}".` +
        ` Vault: ${resolvedPath}/${projectName}`;
    }

    await updateLastProject(projectName).catch((err) =>
      logger.error("Failed to update lastProject", err)
    );

    const autoDetectNote = args.auto_detect
      ? "\n\nAuto-detected fields: " +
        Object.entries(detected)
          .filter(([, v]) => v !== undefined)
          .map(([k]) => k)
          .join(", ")
      : "";

    return { content: [{ type: "text", text: message + subProjectNote + autoDetectNote }] };
  }
}
