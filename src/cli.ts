import { resolve } from "path";
import { homedir } from "os";
import { readGlobalConfig, writeGlobalConfig } from "./config.js";

function expandPath(raw: string): string {
  return resolve(raw.replace(/^(?:HOME|\$HOME|~)(?=[\\/]|$)/i, homedir()));
}

export async function runCli(args: string[]): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case "set-vault": {
      const rawPath = rest[0];
      if (!rawPath) {
        console.error("Usage: lumina-aivault config set-vault <path>");
        process.exit(1);
      }
      const vaultPath = expandPath(rawPath);
      const config = await readGlobalConfig();
      config.globalVaultPath = vaultPath;
      await writeGlobalConfig(config);
      console.log(`Global vault path set to: ${vaultPath}`);
      break;
    }

    case "get-vault": {
      const config = await readGlobalConfig();
      if (config.globalVaultPath) {
        console.log(`Global vault path: ${config.globalVaultPath}`);
      } else {
        console.log("No global vault configured. Using default.");
      }
      break;
    }

    case "unset-vault": {
      const config = await readGlobalConfig();
      delete config.globalVaultPath;
      await writeGlobalConfig(config);
      console.log("Global vault path removed. Using default.");
      break;
    }

    default:
      console.error(
        `Unknown config subcommand: "${subcommand ?? ""}"\nAvailable: set-vault, get-vault, unset-vault`
      );
      process.exit(1);
  }
}
