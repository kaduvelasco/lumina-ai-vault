import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetVaultConfigHandler } from "../handlers/GetVaultConfigHandler.js";
import * as config from "../config.js";
import * as vault from "../vault.js";

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn(),
}));

vi.mock("../vault.js", () => ({
  readLocalConfig: vi.fn().mockResolvedValue(null),
}));

describe("GetVaultConfigHandler", () => {
  const basePath = "/tmp/vault";
  let handler: GetVaultConfigHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new GetVaultConfigHandler(basePath);
  });

  it("should have the correct tool name", () => {
    expect(handler.name).toBe("get_vault_config");
  });

  it("should accept empty input and workspace_root", () => {
    expect(() => handler.validate({})).not.toThrow();
    expect(() => handler.validate({ workspace_root: "/some/path" })).not.toThrow();
  });

  it("should report no global vault and no last project when config is empty", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({});

    const result = await handler.execute({});
    const data = JSON.parse(result.content[0]!.text);

    expect(data.active_vault).toBe(basePath);
    expect(data.global_vault_configured).toBe(false);
    expect(data.global_vault_path).toBeNull();
    expect(data.last_project).toBeNull();
  });

  it("should report global vault and last project when configured", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({
      globalVaultPath: "/custom/vault",
      lastProject: "caedauth",
    });

    const result = await handler.execute({});
    const data = JSON.parse(result.content[0]!.text);

    expect(data.global_vault_configured).toBe(true);
    expect(data.global_vault_path).toBe("/custom/vault");
    expect(data.last_project).toBe("caedauth");
  });

  it("should include local_config when workspace_root is provided and config is found", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({});
    vi.mocked(vault.readLocalConfig).mockResolvedValue({
      project: "caedauth",
      configRoot: "/mdle/dev/401",
      isSubProject: true,
      subProjectKey: "local/caedauth",
    });

    const result = await handler.execute({ workspace_root: "/mdle/dev/401/local/caedauth" });
    const data = JSON.parse(result.content[0]!.text);

    expect(data.local_config).toBeDefined();
    expect(data.local_config.project).toBe("caedauth");
    expect(data.local_config.is_subproject).toBe(true);
    expect(data.local_config.subproject_key).toBe("local/caedauth");
    expect(data.local_config.config_root).toBe("/mdle/dev/401");
  });

  it("should set local_config to null when workspace_root has no .aivault.json", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({});
    vi.mocked(vault.readLocalConfig).mockResolvedValue(null);

    const result = await handler.execute({ workspace_root: "/some/path" });
    const data = JSON.parse(result.content[0]!.text);

    expect(data.local_config).toBeNull();
  });

  it("should not include local_config when workspace_root is not provided", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({});

    const result = await handler.execute({});
    const data = JSON.parse(result.content[0]!.text);

    expect(data.local_config).toBeUndefined();
    expect(vault.readLocalConfig).not.toHaveBeenCalled();
  });
});
