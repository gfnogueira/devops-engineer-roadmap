import { readFileSync } from 'node:fs';
import { Ajv2020 } from 'ajv/dist/2020.js';

export interface ValidationIssue {
  /** JSON Pointer to the offending or missing property; empty string means root. */
  path: string;
  keyword: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: ValidationIssue[] };

const schema = JSON.parse(
  readFileSync(new URL('../curriculum/schema/curriculum.schema.json', import.meta.url), 'utf8'),
);

const ajv = new Ajv2020({
  strict: true,
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
  ownProperties: true,
});

// Compile the trusted local schema once. Input cannot supply a schema or remote reference.
const validate = ajv.compile(schema);

/** Validate already parsed JSON structure without mutating it or checking graph semantics. */
export function validateCurriculum(input: unknown): ValidationResult {
  if (validate(input)) {
    return { valid: true, errors: [] };
  }

  return {
    valid: false,
    errors: (validate.errors ?? []).map((error) => {
      const property: unknown = error.keyword === 'required'
        ? error.params.missingProperty
        : error.keyword === 'additionalProperties'
          ? error.params.additionalProperty
          : undefined;
      const suffix = typeof property === 'string'
        ? `/${property.replace(/~/g, '~0').replace(/\//g, '~1')}`
        : '';

      return {
        path: `${error.instancePath}${suffix}`,
        keyword: error.keyword,
        message: error.message ?? 'Structural validation failed',
      };
    }),
  };
}
