import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoadProjectContextHandler } from "../handlers/LoadProjectContextHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  loadProjectContext: vi.fn(),
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
    expect(result.content[0].text).toBe("# Context: p\n\nContent");
  });
});
