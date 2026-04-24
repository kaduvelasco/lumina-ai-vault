import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnregisterSubProjectHandler } from "../handlers/UnregisterSubProjectHandler.js";
import * as vault from "../vault.js";

vi.mock("../vault.js", () => ({
  readLocalConfig: vi.fn(),
  unregisterSubProject: vi.fn().mockResolvedValue(undefined),
}));

describe("UnregisterSubProjectHandler", () => {
  let handler: UnregisterSubProjectHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new UnregisterSubProjectHandler("/tmp/vault");
  });

  it("should have the correct tool name", () => {
    expect(handler.name).toBe("unregister_subproject");
  });

  it("should auto-detect sub-project key from workspace_root", async () => {
    vi.mocked(vault.readLocalConfig).mockResolvedValue({
      project: "caedauth",
      configRoot: "/mdle/dev/401",
      isSubProject: true,
      subProjectKey: "local/caedauth",
    });

    const result = await handler.execute({
      workspace_root: "/mdle/dev/401/local/caedauth",
    });

    expect(vault.unregisterSubProject).toHaveBeenCalledWith(
      "/mdle/dev/401",
      "local/caedauth"
    );
    expect(result.content[0]!.text).toContain("local/caedauth");
    expect(result.content[0]!.text).toContain("removed");
  });

  it("should use explicit config_root and subproject_key", async () => {
    const result = await handler.execute({
      config_root: "/mdle/dev/401",
      subproject_key: "local/groupmanager",
    });

    expect(vault.readLocalConfig).not.toHaveBeenCalled();
    expect(vault.unregisterSubProject).toHaveBeenCalledWith(
      "/mdle/dev/401",
      "local/groupmanager"
    );
    expect(result.content[0]!.text).toContain("local/groupmanager");
  });

  it("should return error when workspace_root has no .aivault.json", async () => {
    vi.mocked(vault.readLocalConfig).mockResolvedValue(null);

    const result = await handler.execute({
      workspace_root: "/some/path",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("No .aivault.json found");
  });

  it("should return error when workspace_root is not a sub-project", async () => {
    vi.mocked(vault.readLocalConfig).mockResolvedValue({
      project: "moodle-401",
      configRoot: "/mdle/dev/401",
      isSubProject: false,
    });

    const result = await handler.execute({
      workspace_root: "/mdle/dev/401",
    });

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("not registered as a sub-project");
    expect(vault.unregisterSubProject).not.toHaveBeenCalled();
  });

  it("should return error when neither workspace_root nor config_root+key are provided", async () => {
    const result = await handler.execute({});

    expect(result.isError).toBe(true);
    expect(result.content[0]!.text).toContain("Please provide");
    expect(vault.unregisterSubProject).not.toHaveBeenCalled();
  });

  it("should propagate errors from unregisterSubProject", async () => {
    vi.mocked(vault.unregisterSubProject).mockRejectedValue(
      new Error('Sub-project "local/x" not found')
    );

    await expect(
      handler.execute({ config_root: "/root", subproject_key: "local/x" })
    ).rejects.toThrow('Sub-project "local/x" not found');
  });
});
