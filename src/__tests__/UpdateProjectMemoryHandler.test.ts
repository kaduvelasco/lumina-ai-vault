import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateProjectMemoryHandler } from "../handlers/UpdateProjectMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  appendMemory: vi.fn().mockResolvedValue(undefined),
  writeMemory: vi.fn().mockResolvedValue(undefined),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
  readLocalConfig: vi.fn().mockResolvedValue(null),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

describe("UpdateProjectMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: UpdateProjectMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new UpdateProjectMemoryHandler(basePath);
  });

  it("should have the correct tool name", () => {
    expect(handler.name).toBe("update_project_memory");
  });

  it("should return early when no content fields are provided", async () => {
    const result = await handler.execute({ project: "my-project" });
    expect(result.content[0]!.text).toContain("Nothing to update");
    expect(vault.appendMemory).not.toHaveBeenCalled();
    expect(vault.writeMemory).not.toHaveBeenCalled();
  });

  it("should append progress and decisions", async () => {
    const result = await handler.execute({
      project: "my-project",
      progress: "## 2026-04-23\n- Finished auth module",
      decisions: "## 2026-04-23\n- Chose OAuth2 over LDAP",
    });

    expect(vault.appendMemory).toHaveBeenCalledWith(
      basePath,
      "my-project",
      "progress.md",
      "## 2026-04-23\n- Finished auth module"
    );
    expect(vault.appendMemory).toHaveBeenCalledWith(
      basePath,
      "my-project",
      "decisions.md",
      "## 2026-04-23\n- Chose OAuth2 over LDAP"
    );
    expect(vault.writeMemory).not.toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("Appended:");
    expect(result.content[0]!.text).toContain("progress.md");
    expect(result.content[0]!.text).toContain("decisions.md");
  });

  it("should overwrite next_steps, memory, architecture and stack", async () => {
    await handler.execute({
      project: "my-project",
      next_steps: "## Now\n- Add tests",
      memory: "# Memory\n## Overview\n- Name: my-project",
      architecture: "# Architecture\nMicroservices",
      stack: "# Stack\n## Languages\n- TypeScript",
    });

    expect(vault.writeMemory).toHaveBeenCalledWith(basePath, "my-project", "next_steps.md", "## Now\n- Add tests");
    expect(vault.writeMemory).toHaveBeenCalledWith(basePath, "my-project", "memory.md", "# Memory\n## Overview\n- Name: my-project");
    expect(vault.writeMemory).toHaveBeenCalledWith(basePath, "my-project", "architecture.md", "# Architecture\nMicroservices");
    expect(vault.writeMemory).toHaveBeenCalledWith(basePath, "my-project", "stack.md", "# Stack\n## Languages\n- TypeScript");
    expect(vault.appendMemory).not.toHaveBeenCalled();
  });

  it("should mix append and write in the same call", async () => {
    const result = await handler.execute({
      project: "my-project",
      progress: "## 2026-04-23\n- Done",
      next_steps: "## Now\n- Test",
    });

    expect(vault.appendMemory).toHaveBeenCalledTimes(1);
    expect(vault.writeMemory).toHaveBeenCalledTimes(1);
    expect(result.content[0]!.text).toContain("Appended:");
    expect(result.content[0]!.text).toContain("Overwritten:");
  });

  it("should return needs-input message when no project can be resolved", async () => {
    const result = await handler.execute({ progress: "Some work done" });
    expect(result.content[0]!.text).toContain("Could not determine");
    expect(vault.appendMemory).not.toHaveBeenCalled();
  });

  it("should use custom path when provided", async () => {
    await handler.execute({
      project: "my-project",
      path: "/custom",
      progress: "Done",
    });

    expect(vault.resolveBasePath).toHaveBeenCalledWith("/custom");
    expect(vault.appendMemory).toHaveBeenCalledWith("/resolved/custom", "my-project", "progress.md", "Done");
  });

  it("should report partial errors without failing entirely", async () => {
    vi.mocked(vault.appendMemory).mockRejectedValueOnce(new Error("Project not found"));

    const result = await handler.execute({
      project: "my-project",
      progress: "Done",
      next_steps: "## Now\n- Task",
    });

    expect(vault.writeMemory).toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("Errors:");
    expect(result.content[0]!.text).toContain("progress.md");
    expect((result as { isError?: boolean }).isError).toBeFalsy();
  });
});
