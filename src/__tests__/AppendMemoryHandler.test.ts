import { describe, it, expect, vi, beforeEach } from "vitest";
import { AppendMemoryHandler } from "../handlers/AppendMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  appendMemory: vi.fn(),
  MEMORY_FILES: ["memory.md"],
}));

describe("AppendMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: AppendMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new AppendMemoryHandler(basePath);
  });

  it("should append content to file", async () => {
    vi.mocked(vault.appendMemory).mockResolvedValue();

    const result = await handler.execute({
      project: "p",
      filename: "f.md",
      content: "extra content",
    });

    expect(vault.appendMemory).toHaveBeenCalledWith(basePath, "p", "f.md", "extra content");
    expect(result.content[0].text).toContain("Appended to: p/f.md");
  });
});
