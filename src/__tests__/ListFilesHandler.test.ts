import { describe, it, expect, vi, beforeEach } from "vitest";
import { ListFilesHandler } from "../handlers/ListFilesHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  listFiles: vi.fn(),
  listFilesWithMetadata: vi.fn(),
  readLocalConfig: vi.fn().mockResolvedValue(null),
  resolveBasePath: vi.fn((p: string) => `/resolved${p}`),
}));

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn().mockResolvedValue({}),
  updateLastProject: vi.fn().mockResolvedValue(undefined),
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

  it("should return needs-input message when no project can be discovered", async () => {
    const result = await handler.execute({});

    expect(result.content[0]!.text).toContain("Could not determine");
    expect(vault.listFiles).not.toHaveBeenCalled();
  });

  it("should return metadata when metadata=true", async () => {
    const mockMetadata = [
      { name: "memory.md", sizeBytes: 512, estimatedTokens: 128, lastModified: "2026-05-01" },
      { name: "stack.md", sizeBytes: 256, estimatedTokens: 64, lastModified: "2026-04-20" },
    ];
    vi.mocked(vault.listFilesWithMetadata).mockResolvedValue(mockMetadata);

    const result = await handler.execute({ project: "my-project", metadata: true });

    expect(vault.listFilesWithMetadata).toHaveBeenCalledWith(basePath, "my-project");
    expect(vault.listFiles).not.toHaveBeenCalled();
    expect(result.content[0]!.text).toContain("memory.md");
    expect(result.content[0]!.text).toContain("~128 tokens");
    expect(result.content[0]!.text).toContain("2026-05-01");
  });

  it("should return no-files message when metadata=true and project is empty", async () => {
    vi.mocked(vault.listFilesWithMetadata).mockResolvedValue([]);

    const result = await handler.execute({ project: "empty-project", metadata: true });

    expect(result.content[0]!.text).toContain('No files found in project "empty-project"');
  });
});
