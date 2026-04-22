import { describe, it, expect, vi, beforeEach } from "vitest";
import { InitProjectMemoryHandler } from "../handlers/InitProjectMemoryHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  initProjectMemory: vi.fn(),
}));

describe("InitProjectMemoryHandler", () => {
  const basePath = "/tmp/vault";
  let handler: InitProjectMemoryHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new InitProjectMemoryHandler(basePath);
  });

  it("should initialize project memory with provided answers", async () => {
    vi.mocked(vault.initProjectMemory).mockResolvedValue("Project initialized");

    const result = await handler.execute({
      project: "my-project",
      description: "A test project",
      goal: "Testing",
    });

    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "my-project",
      expect.objectContaining({
        description: "A test project",
        goal: "Testing",
      }),
      undefined,
      undefined
    );
    expect(result.content[0]!.text).toBe("Project initialized");
  });

  it("should handle optional fields as undefined if not provided", async () => {
    vi.mocked(vault.initProjectMemory).mockResolvedValue("ok");
    await handler.execute({ project: "p" });

    expect(vault.initProjectMemory).toHaveBeenCalledWith(
      basePath,
      "p",
      {
        description: undefined,
        goal: undefined,
        phase: undefined,
        architectureOverview: undefined,
        components: undefined,
        languages: undefined,
        frameworks: undefined,
        infrastructure: undefined,
        nextSteps: undefined,
      },
      undefined,
      undefined
    );
  });
});
