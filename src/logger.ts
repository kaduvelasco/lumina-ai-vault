/**
 * Logger utility that writes to stderr to avoid interfering with MCP stdout communication.
 */
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    process.stderr.write(`[INFO] ${message} ${args.length ? JSON.stringify(args) : ""}\n`);
  },
  error: (message: string, ...args: unknown[]) => {
    process.stderr.write(`[ERROR] ${message} ${args.length ? JSON.stringify(args) : ""}\n`);
  },
  warn: (message: string, ...args: unknown[]) => {
    process.stderr.write(`[WARN] ${message} ${args.length ? JSON.stringify(args) : ""}\n`);
  },
};
