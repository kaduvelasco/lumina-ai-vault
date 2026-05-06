import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Base class for all MCP tool handlers.
 * Encapsulates validation logic, tool metadata, and execution.
 */
export abstract class BaseToolHandler<T extends z.ZodTypeAny> {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly inputSchema: T;

  public validate(args: unknown): z.infer<T> {
    return this.inputSchema.parse(args);
  }

  public abstract execute(args: z.infer<T>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;

  public getDefinition() {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.getJsonSchema(),
    };
  }

  private getJsonSchema() {
    const schema = zodToJsonSchema(this.inputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
    }) as Record<string, unknown>;
    // Strip the $schema meta-field — MCP clients don't need it
    delete schema["$schema"];
    return schema;
  }
}
