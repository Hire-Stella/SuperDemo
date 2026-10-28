import type { ZodTypeAny } from 'zod';

/** One value that was over its limit and was shortened. Lengths only, never content. */
export interface Clamp {
  path: string;
  kind: 'string' | 'array';
  from: number;
  to: number;
}

/*
 * The slice of zod's internals this reads. Matched on `typeName` rather than
 * `instanceof`: the contract and this package can resolve different copies of
 * zod, and `instanceof` is false across copies.
 */
interface Def {
  typeName?: string;
  innerType?: ZodTypeAny;
  type?: ZodTypeAny;
  checks?: { kind: string; value?: number }[];
  maxLength?: { value: number } | null;
}

/**
 * Shorten over-long strings and arrays to the limits the schema declares.
 *
 * A model told "max 120 chars" in prose will sometimes write 121, and the
 * contract would then reject the whole generation over a tagline — page copy,
 * knowledge notes and agent brief all discarded. The consumers already truncate
 * to these same limits, so shortening first loses nothing they would have kept.
 *
 * The limits come from the schema itself, so they cannot drift from it. Only
 * `max` on strings and arrays is touched: a missing field, a wrong type, a bad
 * enum value or a too-short string is passed through unchanged for the schema
 * to reject. Returns a copy; the input is not mutated.
 */
export function clampToSchema(
  schema: ZodTypeAny,
  value: unknown,
  clamps: Clamp[] = [],
  path = '',
): unknown {
  const def = schema._def as Def;

  switch (def.typeName) {
    case 'ZodDefault':
    case 'ZodOptional':
    case 'ZodNullable':
      return def.innerType ? clampToSchema(def.innerType, value, clamps, path) : value;

    case 'ZodString': {
      const max = def.checks?.find((c) => c.kind === 'max')?.value;
      if (typeof value !== 'string' || max === undefined || value.length <= max) return value;
      let out = value.slice(0, max);
      // Do not leave half of a surrogate pair at the cut.
      const last = out.charCodeAt(out.length - 1);
      if (last >= 0xd800 && last <= 0xdbff) out = out.slice(0, -1);
      clamps.push({ path, kind: 'string', from: value.length, to: out.length });
      return out;
    }

    case 'ZodArray': {
      if (!Array.isArray(value) || !def.type) return value;
      const max = def.maxLength?.value;
      let items: unknown[] = value;
      if (max !== undefined && value.length > max) {
        items = value.slice(0, max);
        clamps.push({ path, kind: 'array', from: value.length, to: max });
      }
      const element = def.type;
      return items.map((item, i) => clampToSchema(element, item, clamps, `${path}[${i}]`));
    }

    case 'ZodObject': {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return value;
      const shape = (schema as unknown as { shape: Record<string, ZodTypeAny> }).shape;
      const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
      for (const [key, child] of Object.entries(shape)) {
        if (key in out) out[key] = clampToSchema(child, out[key], clamps, path ? `${path}.${key}` : key);
      }
      return out;
    }

    default:
      return value;
  }
}
