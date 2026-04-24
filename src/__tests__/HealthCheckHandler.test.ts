import { describe, it, expect, vi, beforeEach } from "vitest";
import { HealthCheckHandler } from "../handlers/HealthCheckHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  checkProjectHealth: vi.fn(),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
  readLocalConfig: vi.fn().mockResolvedValue(null),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

describe("HealthCheckHandler", () => {
  const basePath = "/tmp/vault";
  let handler: HealthCheckHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new HealthCheckHandler(basePath);
  });

  it("should have the correct tool name and description", () => {
    expect(handler.name).toBe("check_project_health");
    expect(handler.description).toContain("health");
  });

  it("should validate input correctly", () => {
    expect(() => handler.validate({ project: "my-project" })).not.toThrow();
    expect(() => handler.validate({})).not.toThrow();
    expect(() => handler.validate({ project: "" })).toThrow();
  });

  it("should report a healthy project", async () => {
    vi.mocked(vault.checkProjectHealth).mockResolvedValue({
      project: "my-project",
      files: {
        "memory.md": "ok",
        "architecture.md": "ok",
        "stack.md": "ok",
        "decisions.md": "ok",
        "progress.md": "ok",
        "next_steps.md": "ok",
      },
      isHealthy: true,
    });

    const result = await handler.execute({ project: "my-project" });

    expect(vault.checkProjectHealth).toHaveBeenCalledWith(basePath, "my-project");
    expect(result.content[0]!.text).toContain("HEALTHY");
    expect(result.content[0]!.text).toContain("memory.md");
    expect((result as { isError?: boolean }).isError).toBeFalsy();
  });

  it("should report an unhealthy project with missing files", async () => {
    vi.mocked(vault.checkProjectHealth).mockResolvedValue({
      project: "my-project",
      files: {
        "memory.md": "ok",
        "architecture.md": "missing",
        "stack.md": "ok",
        "decisions.md": "ok",
        "progress.md": "missing",
        "next_steps.md": "ok",
      },
      isHealthy: false,
    });

    const result = await handler.execute({ project: "my-project" });

    expect(result.content[0]!.text).toContain("UNHEALTHY");
    expect(result.content[0]!.text).toContain("MISSING");
    expect(result.content[0]!.text).toContain("Recommendation");
    expect((result as { isError?: boolean }).isError).toBe(true);
  });

  it("should use the custom path when provided", async () => {
    vi.mocked(vault.checkProjectHealth).mockResolvedValue({
      project: "my-project",
      files: { "memory.md": "ok" },
      isHealthy: true,
    });

    await handler.execute({ project: "my-project", path: "/custom" });

    expect(vault.resolveBasePath).toHaveBeenCalledWith("/custom");
    expect(vault.checkProjectHealth).toHaveBeenCalledWith("/resolved/custom", "my-project");
  });

  it("should use basePath when no custom path is provided", async () => {
    vi.mocked(vault.checkProjectHealth).mockResolvedValue({
      project: "my-project",
      files: { "memory.md": "ok" },
      isHealthy: true,
    });

    await handler.execute({ project: "my-project" });

    expect(vault.resolveBasePath).not.toHaveBeenCalled();
    expect(vault.checkProjectHealth).toHaveBeenCalledWith(basePath, "my-project");
  });

  it("should propagate errors from checkProjectHealth", async () => {
    vi.mocked(vault.checkProjectHealth).mockRejectedValue(
      new Error('Project not found: "unknown"')
    );

    await expect(handler.execute({ project: "unknown" })).rejects.toThrow(
      'Project not found: "unknown"'
    );
  });

  it("should return needs-input message when no project can be discovered", async () => {
    const result = await handler.execute({});
    expect(result.content[0]!.text).toContain("Could not determine");
  });
});
