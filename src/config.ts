import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".lumina-aivault");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface GlobalConfig {
  globalVaultPath?: string;
  lastProject?: string;
}

export async function readGlobalConfig(): Promise<GlobalConfig> {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as GlobalConfig;
  } catch {
    return {};
  }
}

export async function writeGlobalConfig(config: GlobalConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export async function updateLastProject(project: string): Promise<void> {
  const current = await readGlobalConfig();
  if (current.lastProject === project) return;
  await writeGlobalConfig({ ...current, lastProject: project });
}
