import { capture, define, group, is, list, optional, or, repeat } from "../matcher"

export const def = define
export const cap = capture
export const grp = group
export const li = list
export const opt = optional
export const re = repeat

export const enclosedToken = (encloser: string) => is(new RegExp(`${encloser}.*?${encloser}`))
export const stringLiteral = () => or(enclosedToken(`"`), enclosedToken(`'`),)
export const integerLiteral = is(/(0|[1-9][0-9])*/)
export const numberLiteral = is(/(0|[1-9][0-9])*(\.(0|[1-9][0-9])*)?/)
