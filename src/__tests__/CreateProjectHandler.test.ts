import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateProjectHandler } from "../handlers/CreateProjectHandler.js";
import * as vault from "../vault.js";

// Mock the vault module
vi.mock("../vault.js", () => ({
  createProject: vi.fn(),
  MEMORY_FILES: ["memory.md", "architecture.md"],
}));

describe("CreateProjectHandler", () => {
  const basePath = "/tmp/vault";
  let handler: CreateProjectHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new CreateProjectHandler(basePath);
  });

  it("should validate input correctly", () => {
    expect(() => handler.validate({ name: "my-project" })).not.toThrow();
    expect(() => handler.validate({})).toThrow();
    expect(() => handler.validate({ name: "" })).toThrow();
  });

  it("should create a project successfully", async () => {
    vi.mocked(vault.createProject).mockResolvedValue({
      dir: "/tmp/vault/my-project",
      created: true,
    });

    const result = await handler.execute({ name: "my-project" });

    expect(vault.createProject).toHaveBeenCalledWith(basePath, "my-project");
    expect(result.content[0].text).toContain('Project "my-project" created');
    expect(result.isError).toBeUndefined();
  });

  it("should handle already existing project", async () => {
    vi.mocked(vault.createProject).mockResolvedValue({
      dir: "/tmp/vault/my-project",
      created: false,
    });

    const result = await handler.execute({ name: "my-project" });

    expect(result.content[0].text).toContain('Project "my-project" already exists');
  });
});
