import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { initProjectMemory, InitAnswers, resolveBasePath } from "../vault.js";
import { analyzeProject } from "../analyzers/projectAnalyzer.js";
import { PATH_DESCRIPTION } from "./constants.js";

export class InitProjectMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
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

--- STEP 2: PROJECT DATA ---
Ask the user: "How do you want to define the project data?
  1. Auto-analyze the project (recommended — I will read the project files)
  2. Enter manually"

If option 1:
  - Ask: "What is the root directory of the project?" (e.g. /home/user/projects/my-app)
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
    project: z.string().min(1).describe("Project name (alphanumeric, hyphens, underscores)"),
    path: z.string().optional().describe(PATH_DESCRIPTION),
    workspace_root: z
      .string()
      .optional()
      .describe(
        "Local root directory of the project. Required when auto_detect is true. Also used to create .aivault.json."
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
    const projectName = args.project.trim();
    const resolvedPath = args.path ? resolveBasePath(args.path) : this.basePath;

    let detected: InitAnswers = {};
    if (args.auto_detect) {
      if (!args.workspace_root) {
        return {
          content: [
            {
              type: "text",
              text: "Error: workspace_root is required when auto_detect is true.",
            },
          ],
          isError: true,
        };
      }
      detected = await analyzeProject(args.workspace_root);
    }

    // Explicit args take precedence over auto-detected values
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

    const message = await initProjectMemory(
      resolvedPath,
      projectName,
      answers,
      args.workspace_root,
      args.path ? resolvedPath : undefined
    );

    const suffix = args.auto_detect
      ? "\n\nAuto-detected fields: " +
        Object.entries(detected)
          .filter(([, v]) => v !== undefined)
          .map(([k]) => k)
          .join(", ")
      : "";

    return { content: [{ type: "text", text: message + suffix }] };
  }
}
