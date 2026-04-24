import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadProjectContextHandler } from "../handlers/LoadProjectContextHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  loadProjectContext: vi.fn(),
  readLocalConfig: vi.fn().mockResolvedValue(null),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

describe("LoadProjectContextHandler", () => {
  const basePath = "/tmp/vault";
  let handler: LoadProjectContextHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new LoadProjectContextHandler(basePath);
  });

  it("should return project context", async () => {
    vi.mocked(vault.loadProjectContext).mockResolvedValue("# Context: p\n\nContent");

    const result = await handler.execute({ project: "p" });

    expect(vault.loadProjectContext).toHaveBeenCalledWith(basePath, "p");
    expect(result.content[0]!.text).toBe("# Context: p\n\nContent");
  });

  it("should return needs-input message when no project can be discovered", async () => {
    const result = await handler.execute({});

    expect(result.content[0]!.text).toContain("Could not determine");
    expect(vault.loadProjectContext).not.toHaveBeenCalled();
  });
});
