import { capture, define, group, is, list, optional, or, repeat } from "./matcher"

//matcher
export const g = group
export const grp = group
export const c = capture
export const cap = capture
export const r = repeat
export const re = repeat
export const opt = optional
export const li = list
export const def = define

export const enclosedToken = (encloser: string) => is(new RegExp(`${encloser}.*?${encloser}`))
export const stringLiteral = () => or(enclosedToken(`"`), enclosedToken(`'`),)
export const integerLiteral = is(/[1-9][0-9]*/)
export const numberLiteral = is(/[1-9][0-9]*(\.[1-9][0-9]*)?/)
