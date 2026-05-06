# MCP Server Development — Lumina Standard

Comprehensive guide for developing Model Context Protocol (MCP) servers using TypeScript.
Defines architecture, implementation rules, and best practices for secure, protocol-compliant servers.

---

## Language

| Context | Language |
|---|---|
| Responses to the user | Brazilian Portuguese (pt-BR) |
| Code comments | English |

---

## Core Philosophy

MCP servers bridge AI assistants to external systems. Every decision must prioritize:

- **Reliability** — handle errors gracefully, never crash unexpectedly.
- **Discoverability** — tools must be self-documenting via clear JSON schemas.
- **Performance** — minimize latency, especially during initialization.
- **Protocol compliance** — strictly follow MCP spec and JSON-RPC 2.0.

---

## Critical Protocol Rules

These rules are non-negotiable. Violating any of them breaks the protocol.

### STDIO isolation

MCP uses **stdout exclusively** for JSON-RPC communication.

- **NEVER** use `console.log()` — it corrupts the transport layer.
- **ALWAYS** use `console.error()` for logging and debugging.

### Fast initialization

The `initialize` handler must respond immediately. Never perform during startup:

- Network requests
- Large file reads
- CPU-intensive operations

### Statelessness

Tools must be stateless by default. Avoid:

- Mutable global state
- Long-lived sessions
- Internal caches without explicit invalidation logic

---

## Project Structure

When creating a new MCP server project, always use this structure:

```text
src/
  index.ts           # Entry point and server bootstrap
  server/            # Transport and server configuration
  tools/             # Tool definitions and handlers
  resources/         # Resource implementations
  prompts/           # Prompt templates
  schemas/           # Shared Zod/JSON schemas
  services/          # Business logic (API/DB access)
  utils/             # Logging, helpers, constants
```

Each `tools/`, `resources/`, and `prompts/` entry is a self-contained module with its own schema, handler, and error handling.

---

## Implementation Rules

### Tool naming

Always use **verb-noun** format, lowercase, hyphen-separated.

```
search-files     ✔
generate-report  ✔
create-user      ✔
tool1            ✗
handler          ✗
do-stuff         ✗
```

### Input validation

Always validate inputs with **Zod** before any processing. Schema descriptions are mandatory — they are how the AI understands tool usage.

```typescript
import { z } from 'zod';

const SearchFilesSchema = z.object({
  query: z.string().min(1).describe('Search query string'),
  path:  z.string().optional().describe('Directory to search in, defaults to cwd'),
  limit: z.number().int().positive().optional().describe('Maximum number of results'),
});
```

### Tool handler — complete pattern

Every tool follows this structure exactly:

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

const InputSchema = z.object({
  target: z.string().min(1).describe('Target identifier'),
});

type Input = z.infer<typeof InputSchema>;

export const toolDefinition = {
  name: 'verb-noun',
  description: 'One clear sentence describing what this tool does and when to use it.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      target: { type: 'string', description: 'Target identifier' },
    },
    required: ['target'],
  },
};

export async function handleVerbNoun(args: unknown) {
  const input: Input = InputSchema.parse(args);

  try {
    const result = await myService(input.target);
    return {
      content: [
        { type: 'text', text: `Processed: ${input.target}` },
        { type: 'text', text: JSON.stringify(result, null, 2) },
      ],
    };
  } catch (error) {
    console.error('[verb-noun]', error);
    throw new McpError(ErrorCode.InternalError, `Failed to process: ${input.target}`);
  }
}
```

### Error handling

Use standard MCP error codes. Never expose raw error messages or stack traces to the client.

| Scenario | Error code |
|---|---|
| Invalid input (post-Zod) | `ErrorCode.InvalidParams` |
| External service failure | `ErrorCode.InternalError` |
| Resource not found | `ErrorCode.InvalidRequest` |
| Auth/permission denied | `ErrorCode.InvalidRequest` |

```typescript
// Zod validation errors — convert to InvalidParams
if (error instanceof z.ZodError) {
  throw new McpError(ErrorCode.InvalidParams, error.errors[0].message);
}
```

### Resources

Use resources to expose readable data via URIs. URI format: `scheme://category/identifier`.

```typescript
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'myserver://logs/app.log',
      name: 'Application log',
      mimeType: 'text/plain',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  if (uri === 'myserver://logs/app.log') {
    const content = await fs.readFile('/var/log/app.log', 'utf-8');
    return { contents: [{ uri, mimeType: 'text/plain', text: content }] };
  }
  throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
});
```

### Prompts

Use prompts for reusable instruction templates. Always declare arguments with descriptions.

```typescript
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'analyze-code',
      description: 'Generates a structured code review for the given file',
      arguments: [
        { name: 'filepath', description: 'Path to the file to review', required: true },
        { name: 'focus',    description: 'Area to focus on: security, performance, readability', required: false },
      ],
    },
  ],
}));
```

---

## Security Rules

Apply these without exception, regardless of the use case.

- **Restrict filesystem access** — define and enforce an allowlist of directories; never allow arbitrary path traversal.
- **No shell execution** — never run `exec`, `spawn`, or `eval` with user-provided input.
- **Sanitize all inputs** — treat every value from the client as untrusted, even after Zod validation.
- **Enforce timeouts** — wrap all external API and network calls with a timeout (suggest 10s default).
- **Never expose internals** — error messages returned to the client must not include stack traces, file paths, or system details.

```typescript
// Timeout wrapper pattern
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    ),
  ]);

const result = await withTimeout(externalApi.call(args), 10_000);
```

---

## TypeScript Configuration

Use strict mode without exceptions.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "outDir": "./dist"
  }
}
```

---

## Required Dependencies

```bash
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
```

| Package | Purpose |
|---|---|
| `@modelcontextprotocol/sdk` | MCP server/transport/types |
| `zod` | Input validation and schema inference |
| `typescript` | Language (strict mode required) |

---

## Anti-Patterns

Never do any of the following:

| Anti-pattern | Why |
|---|---|
| `console.log()` | Corrupts stdout/JSON-RPC transport |
| Synchronous blocking operations | Blocks the Node.js event loop |
| Mutable global state | Causes unpredictable behavior across tool calls |
| Returning raw strings as content | Violates MCP response format |
| Missing `try/catch` in tool handlers | Crashes the server on any unhandled error |
| Exposing stack traces to client | Security and information leak risk |
| Network calls during `initialize` | Causes initialization timeouts |
| Unrestricted file system access | Critical security vulnerability |

---

## Pre-commit Checklist

Before considering any tool implementation complete, verify:

- Tool name follows verb-noun format.
- Description is clear and tells the AI exactly when to use this tool.
- Zod schema covers all inputs with `.describe()` on every field.
- Handler is wrapped in `try/catch` with proper `McpError` throws.
- No `console.log()` anywhere in the file.
- Timeout applied to all external calls.
- Unit tests cover the happy path and at least two error paths.
