import { createRequire } from "module";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const _require = createRequire(import.meta.url);
const { version } = _require("../package.json") as { version: string };
import { resolveBasePath } from "./vault.js";
import { createHandlers } from "./handlers/index.js";
import { logger } from "./logger.js";

export function createServer(basePath: string) {
  logger.info(`Starting Lumina AI Vault server at ${basePath}`);

  const server = new Server({ name: "lumina-aivault", version }, { capabilities: { tools: {} } });

  const handlers = createHandlers(basePath);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: handlers.map((h) => h.getDefinition()),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    const handler = handlers.find((h) => h.name === name);
    if (!handler) {
      logger.warn(`Tool not found: ${name}`);
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    try {
      const validatedArgs = handler.validate(args);
      return await handler.execute(validatedArgs);
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.warn(`Invalid parameters for ${name}`, err.issues);
        return {
          content: [
            {
              type: "text",
              text: `Invalid parameters: ${err.issues.map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      logger.error(`Error executing ${name}`, err);
      if (err instanceof McpError) throw err;
      return {
        content: [
          {
            type: "text",
            text: `Error: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function runServer(basePath?: string) {
  const resolved = resolveBasePath(basePath);
  const server = createServer(resolved);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
