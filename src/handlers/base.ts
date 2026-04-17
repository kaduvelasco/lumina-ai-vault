import { z } from "zod";

/**
 * Base class for all MCP tool handlers.
 * Encapsulates validation logic, tool metadata, and execution.
 */
export abstract class BaseToolHandler<T extends z.ZodTypeAny> {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly inputSchema: T;

  /**
   * Validates the input arguments against the schema.
   */
  public validate(args: unknown): z.infer<T> {
    return this.inputSchema.parse(args);
  }

  /**
   * Executes the tool logic.
   * Framework handles JSON-RPC wrapping and errors.
   */
  public abstract execute(args: z.infer<T>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;

  /**
   * Returns the tool definition for MCP registration.
   */
  public getDefinition() {
    // Convert Zod schema to JSON Schema for MCP
    // Note: Simple manual conversion for now, can be improved with zod-to-json-schema if needed
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.getJsonSchema(),
    };
  }

  private getJsonSchema() {
    // This is a simplified conversion for the MCP protocol.
    // For complex schemas, consider using 'zod-to-json-schema' package.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = (this.inputSchema as any)._def.shape?.();
    if (!shape) return { type: "object", properties: {} };

    const properties: Record<string, { type: string; description?: string }> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const zValue = value as z.ZodTypeAny;
      const description = zValue.description;

      let type = "string";
      if (zValue instanceof z.ZodNumber) type = "number";
      if (zValue instanceof z.ZodBoolean) type = "boolean";
      if (zValue instanceof z.ZodArray) type = "array";
      if (zValue instanceof z.ZodObject) type = "object";

      properties[key] = {
        type,
        ...(description ? { description } : {}),
      };

      if (!zValue.isOptional()) {
        required.push(key);
      }
    }
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }
}
