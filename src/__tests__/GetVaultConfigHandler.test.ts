import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetVaultConfigHandler } from "../handlers/GetVaultConfigHandler.js";
import * as config from "../config.js";

vi.mock("../config.js", () => ({
  readGlobalConfig: vi.fn(),
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

  it("should accept empty input", () => {
    expect(() => handler.validate({})).not.toThrow();
  });

  it("should report no global vault when config is empty", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({});

    const result = await handler.execute({});
    const data = JSON.parse(result.content[0]!.text);

    expect(data.active_vault).toBe(basePath);
    expect(data.global_vault_configured).toBe(false);
    expect(data.global_vault_path).toBeNull();
  });

  it("should report global vault when configured", async () => {
    vi.mocked(config.readGlobalConfig).mockResolvedValue({
      globalVaultPath: "/custom/vault",
    });

    const result = await handler.execute({});
    const data = JSON.parse(result.content[0]!.text);

    expect(data.global_vault_configured).toBe(true);
    expect(data.global_vault_path).toBe("/custom/vault");
  });
});
