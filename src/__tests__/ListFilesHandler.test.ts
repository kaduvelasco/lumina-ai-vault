import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListFilesHandler } from "../handlers/ListFilesHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  listFiles: vi.fn(),
}));

describe("ListFilesHandler", () => {
  const basePath = "/tmp/vault";
  let handler: ListFilesHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ListFilesHandler(basePath);
  });

  it("should return a list of files when they exist", async () => {
    const mockFiles = ["file1.md", "file2.md"];
    vi.mocked(vault.listFiles).mockResolvedValue(mockFiles);

    const result = await handler.execute({ project: "my-project" });

    expect(vault.listFiles).toHaveBeenCalledWith(basePath, "my-project");
    expect(result.content[0]!.text).toContain("file1.md");
    expect(result.content[0]!.text).toContain("file2.md");
  });

  it("should return a helpful message when no files are found", async () => {
    vi.mocked(vault.listFiles).mockResolvedValue([]);

    const result = await handler.execute({ project: "my-project" });

    expect(result.content[0]!.text).toContain('No files found in project "my-project"');
  });
});
