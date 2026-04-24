import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReadMemoryHandler } from "../handlers/ReadMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  readMemory: vi.fn(),
  MEMORY_FILES: ["memory.md"],
  readLocalConfig: vi.fn().mockResolvedValue(null),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
}));

describe("ReadMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: ReadMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ReadMemoryHandler(basePath);
  });

  it("should return file content", async () => {
    vi.mocked(vault.readMemory).mockResolvedValue("Some content");

    const result = await handler.execute({ project: "p", filename: "f.md" });

    expect(vault.readMemory).toHaveBeenCalledWith(basePath, "p", "f.md");
    expect(result.content[0]!.text).toBe("Some content");
  });

  it("should handle empty files", async () => {
    vi.mocked(vault.readMemory).mockResolvedValue("");

    const result = await handler.execute({ project: "p", filename: "f.md" });

    expect(result.content[0]!.text).toBe("(file is empty)");
  });

  it("should return needs-input message when no project can be discovered", async () => {
    const result = await handler.execute({ filename: "memory.md" });

    expect(result.content[0]!.text).toContain("Could not determine");
    expect(vault.readMemory).not.toHaveBeenCalled();
  });
});
