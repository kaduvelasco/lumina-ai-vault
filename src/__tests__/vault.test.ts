import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import {
  readLocalConfig,
  registerSubProject,
  unregisterSubProject,
} from "../vault.js";

async function writeConfig(dir: string, content: object): Promise<void> {
  await writeFile(join(dir, ".aivault.json"), JSON.stringify(content, null, 2));
}

async function readConfig(dir: string): Promise<object> {
  return JSON.parse(await readFile(join(dir, ".aivault.json"), "utf-8")) as object;
}

describe("readLocalConfig", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "lumina-vault-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("returns null when no .aivault.json exists anywhere in the tree", async () => {
    const deep = join(root, "a", "b", "c");
    await mkdir(deep, { recursive: true });
    expect(await readLocalConfig(deep)).toBeNull();
  });

  it("finds .aivault.json at the workspace_root itself", async () => {
    await writeConfig(root, { project: "my-project" });
    const result = await readLocalConfig(root);
    expect(result).not.toBeNull();
    expect(result!.project).toBe("my-project");
    expect(result!.configRoot).toBe(root);
    expect(result!.isSubProject).toBe(false);
  });

  it("walks up directories to find .aivault.json", async () => {
    await writeConfig(root, { project: "root-project" });
    const deep = join(root, "src", "utils");
    await mkdir(deep, { recursive: true });

    const result = await readLocalConfig(deep);
    expect(result).not.toBeNull();
    expect(result!.project).toBe("root-project");
    expect(result!.configRoot).toBe(root);
    expect(result!.isSubProject).toBe(false);
  });

  it("detects sub-project when workspace_root matches a subprojects key", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: {
        "local/caedauth": { project: "caedauth" },
        "local/groupmanager": { project: "groupmanager" },
      },
    });

    const caedauthDir = join(root, "local", "caedauth");
    await mkdir(caedauthDir, { recursive: true });

    const result = await readLocalConfig(caedauthDir);
    expect(result).not.toBeNull();
    expect(result!.project).toBe("caedauth");
    expect(result!.isSubProject).toBe(true);
    expect(result!.subProjectKey).toBe("local/caedauth");
    expect(result!.configRoot).toBe(root);
  });

  it("detects sub-project from a nested folder inside the sub-project directory", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: {
        "local/caedauth": { project: "caedauth" },
      },
    });

    const deep = join(root, "local", "caedauth", "classes", "task");
    await mkdir(deep, { recursive: true });

    const result = await readLocalConfig(deep);
    expect(result!.project).toBe("caedauth");
    expect(result!.isSubProject).toBe(true);
    expect(result!.subProjectKey).toBe("local/caedauth");
  });

  it("matches the longest sub-project key when keys overlap", async () => {
    await writeConfig(root, {
      project: "root",
      subprojects: {
        plugins: { project: "all-plugins" },
        "plugins/auth": { project: "auth-plugin" },
      },
    });

    const dir = join(root, "plugins", "auth", "tests");
    await mkdir(dir, { recursive: true });

    const result = await readLocalConfig(dir);
    expect(result!.project).toBe("auth-plugin");
    expect(result!.subProjectKey).toBe("plugins/auth");
  });

  it("uses root project when workspace_root is inside project but not a sub-project", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: {
        "local/caedauth": { project: "caedauth" },
      },
    });

    const unrelated = join(root, "local", "other-plugin");
    await mkdir(unrelated, { recursive: true });

    const result = await readLocalConfig(unrelated);
    expect(result!.project).toBe("moodle-401");
    expect(result!.isSubProject).toBe(false);
  });

  it("resolves sub-project path from config", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: {
        "local/caedauth": {
          project: "caedauth",
          path: "HOME/.lumina-aivault/knowledge",
        },
      },
    });

    const dir = join(root, "local", "caedauth");
    await mkdir(dir, { recursive: true });

    const result = await readLocalConfig(dir);
    expect(result!.path).toBe("HOME/.lumina-aivault/knowledge");
  });

  it("returns null for invalid JSON", async () => {
    await writeFile(join(root, ".aivault.json"), "{ invalid json }");
    expect(await readLocalConfig(root)).toBeNull();
  });

  it("returns null when project field is missing", async () => {
    await writeConfig(root, { path: "/some/path" });
    expect(await readLocalConfig(root)).toBeNull();
  });
});

describe("registerSubProject", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "lumina-vault-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("adds a new sub-project to an existing config", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      path: "HOME/.lumina-aivault/knowledge",
    });

    await registerSubProject(root, "local/caedauth", { project: "caedauth" });

    const config = await readConfig(root) as { subprojects?: Record<string, object> };
    expect(config.subprojects).toBeDefined();
    expect(config.subprojects!["local/caedauth"]).toEqual({ project: "caedauth" });
  });

  it("preserves existing sub-projects when adding a new one", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: { "local/caedauth": { project: "caedauth" } },
    });

    await registerSubProject(root, "local/groupmanager", { project: "groupmanager" });

    const config = await readConfig(root) as { subprojects?: Record<string, object> };
    expect(Object.keys(config.subprojects!)).toHaveLength(2);
    expect(config.subprojects!["local/caedauth"]).toEqual({ project: "caedauth" });
    expect(config.subprojects!["local/groupmanager"]).toEqual({ project: "groupmanager" });
  });

  it("updates an existing sub-project entry", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: { "local/caedauth": { project: "caedauth" } },
    });

    await registerSubProject(root, "local/caedauth", {
      project: "caedauth",
      path: "/new/path",
    });

    const config = await readConfig(root) as { subprojects?: Record<string, { path?: string }> };
    expect(config.subprojects!["local/caedauth"]!.path).toBe("/new/path");
  });

  it("preserves other root fields (project, path) when updating subprojects", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      path: "HOME/.lumina-aivault/knowledge",
    });

    await registerSubProject(root, "local/caedauth", { project: "caedauth" });

    const config = await readConfig(root) as { project: string; path: string };
    expect(config.project).toBe("moodle-401");
    expect(config.path).toBe("HOME/.lumina-aivault/knowledge");
  });
});

describe("unregisterSubProject", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "lumina-vault-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("removes the specified sub-project key", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: {
        "local/caedauth": { project: "caedauth" },
        "local/groupmanager": { project: "groupmanager" },
      },
    });

    await unregisterSubProject(root, "local/caedauth");

    const config = await readConfig(root) as { subprojects?: Record<string, object> };
    expect(config.subprojects!["local/caedauth"]).toBeUndefined();
    expect(config.subprojects!["local/groupmanager"]).toBeDefined();
  });

  it("removes the subprojects key when the last entry is removed", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: { "local/caedauth": { project: "caedauth" } },
    });

    await unregisterSubProject(root, "local/caedauth");

    const config = await readConfig(root) as { subprojects?: unknown };
    expect(config.subprojects).toBeUndefined();
  });

  it("throws when .aivault.json does not exist", async () => {
    await expect(
      unregisterSubProject(root, "local/caedauth")
    ).rejects.toThrow("No .aivault.json found");
  });

  it("throws when the sub-project key does not exist", async () => {
    await writeConfig(root, {
      project: "moodle-401",
      subprojects: { "local/caedauth": { project: "caedauth" } },
    });

    await expect(
      unregisterSubProject(root, "local/nonexistent")
    ).rejects.toThrow('Sub-project "local/nonexistent" not found');
  });
});
