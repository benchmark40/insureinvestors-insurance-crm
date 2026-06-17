import { z } from "zod";

/**
 * Build a partial "patch" schema from a full object schema.
 *
 * A plain `Schema.partial()` makes keys optional but KEEPS each field's inner
 * `.default(...)`. So parsing a single-field patch like `{ state: "BC" }`
 * returns the WHOLE object with every untouched field reset to its default
 * (`""`, `false`, etc.). Spreading that into a `db.x.update({ data })` silently
 * wipes every column the user didn't edit — e.g. autofilling a contact then
 * saving leaves only the last-written field behind.
 *
 * This strips the `.default()` wrappers first (keeping every other validator),
 * then makes the keys optional. An omitted key now parses to `undefined`, which
 * Prisma leaves untouched on update.
 */
export function toPatchSchema<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
): z.ZodType<Partial<z.infer<T>>> {
  const stripped = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      field instanceof z.ZodDefault ? field.removeDefault() : field,
    ]),
  ) as z.ZodRawShape;
  return z.object(stripped).partial() as unknown as z.ZodType<
    Partial<z.infer<T>>
  >;
}
