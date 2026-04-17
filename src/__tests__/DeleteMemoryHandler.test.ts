import { describe, it, expect, vi, beforeEach } from "vitest";
import { DeleteMemoryHandler } from "../handlers/DeleteMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  deleteMemory: vi.fn(),
  MEMORY_FILES: ["memory.md"],
}));

describe("DeleteMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: DeleteMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new DeleteMemoryHandler(basePath);
  });

  it("should delete memory file", async () => {
    vi.mocked(vault.deleteMemory).mockResolvedValue();

    const result = await handler.execute({
      project: "p",
      filename: "custom.md",
    });

    expect(vault.deleteMemory).toHaveBeenCalledWith(basePath, "p", "custom.md");
    expect(result.content[0].text).toContain("Deleted: p/custom.md");
  });
});
