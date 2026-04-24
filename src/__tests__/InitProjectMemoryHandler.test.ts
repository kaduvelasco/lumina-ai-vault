import { describe, it, expect, vi, beforeEach } from "vitest";
import { InitProjectMemoryHandler } from "../handlers/InitProjectMemoryHandler.js";
import * as vault from "../vault.js";
import * as projectAnalyzer from "../analyzers/projectAnalyzer.js";

vi.mock("../vault.js", () => ({
  initProjectMemory: vi.fn(),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
  readLocalConfig: vi.fn().mockResolvedValue(null),
  registerSubProject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../analyzers/projectAnalyzer.js", () => ({
  analyzeProject: vi.fn(),
}));

describe("InitProjectMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: InitProjectMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new InitProjectMemoryHandler(basePath);
  });

  it("should initialize project memory with provided answers", async () => {
    vi.mocked(vault.initProjectMemory).mockResolvedValue("Project initialized");

    const result = await handler.execute({
      project: "my-project",
      description: "A test project",
      goal: "Testing",
    });

    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "my-project",
      expect.objectContaining({
        description: "A test project",
        goal: "Testing",
      }),
      undefined,
      undefined
    );
    expect(result.content[0]!.text).toBe("Project initialized");
  });

  it("should handle optional fields as undefined if not provided", async () => {
    vi.mocked(vault.initProjectMemory).mockResolvedValue("ok");
    await handler.execute({ project: "p" });

    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "p",
      {
        description: undefined,
        goal: undefined,
        phase: undefined,
        architectureOverview: undefined,
        components: undefined,
        languages: undefined,
        frameworks: undefined,
        infrastructure: undefined,
        nextSteps: undefined,
      },
      undefined,
      undefined
    );
  });

  it("should return error when auto_detect is true but workspace_root is missing", async () => {
    const result = await handler.execute({ project: "p", auto_detect: true });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("workspace_root is required");
    expect(vault.initProjectMemory).not.toHaveBeenCalled();
  });

  it("should call analyzeProject and merge results when auto_detect is true", async () => {
    vi.mocked(projectAnalyzer.analyzeProject).mockResolvedValue({
      description: "Auto detected description",
      languages: "TypeScript",
      frameworks: "Zod, MCP SDK",
      infrastructure: "Docker",
    });
    vi.mocked(vault.initProjectMemory).mockResolvedValue("Project initialized");

    const result = await handler.execute({
      project: "auto-project",
      workspace_root: "/my/project",
      auto_detect: true,
    });

    expect(projectAnalyzer.analyzeProject).toHaveBeenCalledWith("/my/project");
    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "auto-project",
      expect.objectContaining({
        description: "Auto detected description",
        languages: "TypeScript",
        frameworks: "Zod, MCP SDK",
        infrastructure: "Docker",
      }),
      "/my/project",
      undefined
    );
    expect(result.content[0]!.text).toContain("Project initialized");
    expect(result.content[0]!.text).toContain("Auto-detected fields");
  });

  it("should prefer explicit args over auto-detected values", async () => {
    vi.mocked(projectAnalyzer.analyzeProject).mockResolvedValue({
      description: "Auto description",
      languages: "JavaScript",
    });
    vi.mocked(vault.initProjectMemory).mockResolvedValue("ok");

    await handler.execute({
      project: "p",
      workspace_root: "/my/project",
      auto_detect: true,
      description: "Manual override",
    });

    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "p",
      expect.objectContaining({
        description: "Manual override",
        languages: "JavaScript",
      }),
      "/my/project",
      undefined
    );
  });
});
