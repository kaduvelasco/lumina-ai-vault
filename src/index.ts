#!/usr/bin/env node

import { runServer } from "./server.js";
import { runCli } from "./cli.js";

const args = process.argv.slice(2);

if (args[0] === "config") {
  runCli(args.slice(1)).catch((err: unknown) => {
    console.error("Error:", err);
    process.exit(1);
  });
} else {
  runServer(args[0] || undefined).catch((err: unknown) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
