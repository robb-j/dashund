import { Dashund } from '../dashund'

export type Zone = Widget[]

export interface Widget {
  type: string
  [idx: string]: any
}

export interface WidgetFactory {
  createFromCLI(dashund: Dashund): Promise<Widget>
  requiredEndpoints?: string[]
  requiredTokens?: string[]
}
