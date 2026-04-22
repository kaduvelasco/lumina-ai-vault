import { z } from "zod";
import { BaseToolHandler } from "./base.js";
import { initProjectMemory, InitAnswers, resolveBasePath } from "../vault.js";

export class InitProjectMemoryHandler extends BaseToolHandler<
  z.ZodObject<{
    project: z.ZodString;
    path: z.ZodOptional<z.ZodString>;
    workspace_root: z.ZodOptional<z.ZodString>;
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
  public readonly description = `Initialize a project's memory files with structured content collected from the user.

Before calling this tool, ask the user the following questions (skip any they can't answer yet):
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
    path: z.string().optional().describe('Base path where the memory will be saved. If left blank, uses the default vault path. To use the default user directory, start the path with "HOME" (e.g., "HOME/custom-vault").'),
    workspace_root: z.string().optional().describe("Local root directory of the project where .aivault.json will be created (optional)."),
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

    const answers: InitAnswers = {
      description: args.description,
      goal: args.goal,
      phase: args.phase,
      architectureOverview: args.architecture_overview,
      components: args.components,
      languages: args.languages,
      frameworks: args.frameworks,
      infrastructure: args.infrastructure,
      nextSteps: args.next_steps,
    };

    const message = await initProjectMemory(
      resolvedPath,
      projectName,
      answers,
      args.workspace_root,
      args.path
    );
    return { content: [{ type: "text", text: message }] };
  }
}

