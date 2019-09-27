export type Criteria =
  | 'string'
  | 'string[]'
  | 'number'
  | 'number[]'
  | 'boolean'
  | 'boolean[]'
  | 'function'
  | 'function[]'
  | { [idx: string]: Criteria }

export interface SchemaError {
  path: string
  expected: string
  got: string
}

function testPrimative(value: any, criteria: string, path: string[]) {
  if (typeof value === criteria) return []

  return [
    {
      path: path.join('.'),
      expected: criteria,
      got: typeof value
    }
  ]
}

function testPrimativeArray(value: any, criteria: string, path: string[]) {
  const type = criteria.replace('[]', '')

  if (!Array.isArray(value)) {
    return [
      {
        path: path.join('.'),
        expected: criteria,
        got: typeof value
      }
    ]
  }

  if (value.every(elem => typeof elem === type)) return []

  return [
    {
      path: path.join('.'),
      expected: criteria,
      got: 'any[]'
    }
  ]
}

export function validate(
  value: any,
  criteria: Criteria,
  path: string[] = []
): SchemaError[] {
  if (typeof criteria === 'object') {
    let errors = []

    if (typeof value !== 'object') {
      return [
        {
          path: path.join('.'),
          expected: 'object',
          got: typeof value
        }
      ]
    }

    for (let field in criteria) {
      errors.push(...validate(value[field], criteria[field], [...path, field]))
    }
    return errors
  }

  if (typeof criteria === 'string') {
    if (criteria.endsWith('[]')) {
      return testPrimativeArray(value, criteria, path)
    } else {
      return testPrimative(value, criteria, path)
    }
  }

  throw new Error(`Unknown criteria '${JSON.stringify(criteria)}`)
}

export function assertValue(value: any, schema: Criteria, name?: string) {
  let errors = validate(value, schema, name ? [name] : [])
  if (errors.length === 0) return

  throw new Error(createErrorMessage(errors))
}

export function createErrorMessage(errors: SchemaError[]) {
  const messages = errors.map(humanizeSchemaError).join('\n- ')

  return `Validation error: \n- ${messages}`
}

export function humanizeSchemaError(error: SchemaError) {
  return `Expected '${error.path}' to be ${error.expected} but got ${error.got}`
}
