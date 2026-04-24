import { describe, it, expect, vi, beforeEach } from "vitest";
import { WriteMemoryHandler } from "../handlers/WriteMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  writeMemory: vi.fn(),
  MEMORY_FILES: ["memory.md"],
  readLocalConfig: vi.fn().mockResolvedValue(null),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

describe("WriteMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: WriteMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WriteMemoryHandler(basePath);
  });

  it("should write content to file", async () => {
    vi.mocked(vault.writeMemory).mockResolvedValue();

    const result = await handler.execute({
      project: "my-project",
      filename: "test.md",
      content: "new content",
    });

    expect(vault.writeMemory).toHaveBeenCalledWith(
      basePath,
      "my-project",
      "test.md",
      "new content"
    );
    expect(result.content[0]!.text).toContain("Written: my-project/test.md");
  });

  it("should return needs-input message when no project can be discovered", async () => {
    const result = await handler.execute({ filename: "memory.md", content: "x" });

    expect(result.content[0]!.text).toContain("Could not determine");
    expect(vault.writeMemory).not.toHaveBeenCalled();
  });
});
