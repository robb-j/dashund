import { Dashund } from '../dashund'

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

export function validateWidgetFactory(value: any) {
  // TODO: ...
  return true
}
