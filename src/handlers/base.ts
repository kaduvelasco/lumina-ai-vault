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
    const shape = (this.inputSchema as unknown as z.ZodObject<z.ZodRawShape>).shape;
    if (!shape) return { type: "object", properties: {} };

    const properties: Record<string, { type: string; description?: string }> = {};
    const required: string[] = [];

    for (const [key, raw] of Object.entries(shape)) {
      const field = raw as z.ZodTypeAny;
      const description = field.description;

      // Unwrap ZodOptional / ZodDefault to determine the underlying type
      let inner: z.ZodTypeAny = field;
      while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
        inner = (inner as z.ZodOptional<z.ZodTypeAny>).unwrap();
      }

      let type = "string";
      if (inner instanceof z.ZodNumber) type = "number";
      if (inner instanceof z.ZodBoolean) type = "boolean";
      if (inner instanceof z.ZodArray) type = "array";
      if (inner instanceof z.ZodObject) type = "object";

      properties[key] = { type, ...(description ? { description } : {}) };

      if (!field.isOptional()) {
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
