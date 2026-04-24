import { z } from "zod";

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
    const shape = (this.inputSchema as unknown as z.ZodObject<z.ZodRawShape>).shape;
    if (!shape) return { type: "object", properties: {} };

    const properties: Record<string, object> = {};
    const required: string[] = [];

    for (const [key, raw] of Object.entries(shape)) {
      const field = raw as z.ZodTypeAny;
      properties[key] = this.fieldToJsonSchema(field);
      if (!field.isOptional()) required.push(key);
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  private fieldToJsonSchema(field: z.ZodTypeAny): object {
    const description = field.description;
    const desc = description ? { description } : {};

    let inner: z.ZodTypeAny = field;
    while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
      inner = (inner as z.ZodOptional<z.ZodTypeAny>).unwrap();
    }

    if (inner instanceof z.ZodString) return { type: "string", ...desc };
    if (inner instanceof z.ZodNumber) return { type: "number", ...desc };
    if (inner instanceof z.ZodBoolean) return { type: "boolean", ...desc };

    if (inner instanceof z.ZodEnum) {
      const opts = (inner as unknown as { options?: string[] }).options;
      return { type: "string", ...(Array.isArray(opts) ? { enum: opts } : {}), ...desc };
    }

    if (inner instanceof z.ZodArray) {
      const itemSchema = this.fieldToJsonSchema(
        (inner as z.ZodArray<z.ZodTypeAny>).element
      );
      return { type: "array", items: itemSchema, ...desc };
    }

    if (inner instanceof z.ZodObject) {
      const shape = (inner as z.ZodObject<z.ZodRawShape>).shape;
      const properties: Record<string, object> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(shape)) {
        const vField = v as z.ZodTypeAny;
        properties[k] = this.fieldToJsonSchema(vField);
        if (!vField.isOptional()) required.push(k);
      }
      return {
        type: "object",
        properties,
        ...(required.length > 0 ? { required } : {}),
        ...desc,
      };
    }

    return { type: "string", ...desc };
  }
}
