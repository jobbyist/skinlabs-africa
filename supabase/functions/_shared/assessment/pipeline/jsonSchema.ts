/**
 * Minimal JSON Schema subset validator for the SKYNN AI v2 stage outputs.
 *
 * Each stage's schema is written once and used twice: as the tool
 * `input_schema` the model must fill, and to validate what comes back
 * before anything is persisted. Supports exactly the subset those schemas
 * use (object/array/string/integer/number/boolean, enum, required,
 * nullable via `type: [T, "null"]`, minItems/maxItems, minLength) — kept
 * dependency-free so the pipeline stays unit-testable under `bun test`
 * (the edge runtime's esm.sh zod import isn't resolvable there).
 */

export type JsonSchema = {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: Array<string | number | boolean | null>;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  description?: string;
  additionalProperties?: boolean;
};

function typeOf(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function typeMatches(expected: string, actual: string): boolean {
  if (expected === actual) return true;
  return expected === "number" && actual === "integer";
}

export function validateAgainstSchema(schema: JsonSchema, value: unknown, path = "$"): string[] {
  const errors: string[] = [];
  const actual = typeOf(value);

  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((t) => typeMatches(t, actual))) {
      return [`${path}: expected ${allowed.join("|")}, got ${actual}`];
    }
  }
  if (schema.enum && !schema.enum.includes(value as never)) {
    errors.push(`${path}: value not in enum`);
  }
  if (actual === "string" && schema.minLength !== undefined && (value as string).length < schema.minLength) {
    errors.push(`${path}: string shorter than ${schema.minLength}`);
  }
  if ((actual === "integer" || actual === "number") && typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path}: above maximum`);
  }
  if (actual === "array") {
    const arr = value as unknown[];
    if (schema.minItems !== undefined && arr.length < schema.minItems) errors.push(`${path}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && arr.length > schema.maxItems) errors.push(`${path}: more than ${schema.maxItems} items`);
    if (schema.items) arr.forEach((item, i) => errors.push(...validateAgainstSchema(schema.items!, item, `${path}[${i}]`)));
  }
  if (actual === "object" && schema.properties) {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) errors.push(`${path}.${key}: required`);
    }
    for (const [key, sub] of Object.entries(schema.properties)) {
      if (key in obj) errors.push(...validateAgainstSchema(sub, obj[key], `${path}.${key}`));
    }
  }
  return errors;
}
