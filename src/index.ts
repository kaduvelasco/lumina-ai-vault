#!/usr/bin/env node

import { runServer } from "./server.js";

runServer(process.argv[2] || undefined).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
