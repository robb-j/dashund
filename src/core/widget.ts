import { Dashund } from '../dashund'
import { assertValue, Criteria } from '../utils'

export type Zone = Widget[]

export interface Widget {
  type: string
  id: string
  [idx: string]: any
}

export interface WidgetFactory {
  createFromCLI(dashund: Dashund): Promise<Widget>
  requiredEndpoints?: string[]
  requiredTokens?: string[]
}

export function validateWidgetFactory(value: any, name?: string) {
  const schema: Criteria = {
    createFromCLI: 'function',
    requiredEndpoints: 'string[]',
    requiredTokens: 'string[]'
  }
  assertValue(value, schema, name)
}
