import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteProjectHandler } from "../handlers/DeleteProjectHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  deleteProject: vi.fn(),
}));

describe("DeleteProjectHandler", () => {
  const basePath = "/tmp/vault";
  let handler: DeleteProjectHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new DeleteProjectHandler(basePath);
  });

  it("should require confirmation to delete", async () => {
    const result = await handler.execute({ project: "my-project", confirm: false });

    expect(vault.deleteProject).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("confirm: true");
  });

  it("should delete project when confirmed", async () => {
    vi.mocked(vault.deleteProject).mockResolvedValue();
    const result = await handler.execute({ project: "my-project", confirm: true });

    expect(vault.deleteProject).toHaveBeenCalledWith(basePath, "my-project");
    expect(result.content[0].text).toContain('Project "my-project" deleted');
  });

  it("should validate input correctly", () => {
    expect(() => handler.validate({ project: "p", confirm: true })).not.toThrow();
    expect(() => handler.validate({ confirm: true })).toThrow();
  });
});
