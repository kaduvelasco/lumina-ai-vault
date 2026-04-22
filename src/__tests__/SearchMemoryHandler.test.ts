import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchMemoryHandler } from "../handlers/SearchMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  searchMemory: vi.fn(),
}));

describe("SearchMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: SearchMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new SearchMemoryHandler(basePath);
  });

  it("should return search results", async () => {
    vi.mocked(vault.searchMemory).mockResolvedValue({
      results: [{ project: "p1", file: "m.md", line: 10, text: "matched line" }],
      truncated: false,
    });

    const args = handler.validate({ query: "search-term" });
    const result = await handler.execute(args);

    expect(vault.searchMemory).toHaveBeenCalledWith(basePath, "search-term", undefined, 100, 0);
    expect(result.content[0]!.text).toContain("p1/m.md:10");
    expect(result.content[0]!.text).toContain("matched line");
  });

  it("should handle empty search results", async () => {
    vi.mocked(vault.searchMemory).mockResolvedValue({
      results: [],
      truncated: false,
    });

    const args = handler.validate({ query: "not-found" });
    const result = await handler.execute(args);

    expect(result.content[0]!.text).toBe('No results for "not-found"');
  });

  it("should show truncation message when limit is reached", async () => {
    vi.mocked(vault.searchMemory).mockResolvedValue({
      results: [{ project: "p", file: "f", line: 1, text: "t" }],
      truncated: true,
    });

    const args = handler.validate({ query: "q", limit: 1 });
    const result = await handler.execute(args);

    expect(result.content[0]!.text).toContain("(limit of 1 results reached)");
  });
});
