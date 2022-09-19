import { capture, define, group, is, list, optional, or, repeat } from "../matcher"
import { Hook, MatcherLike } from "../type"

export const def = define
export const cap = capture
export const grp = group
export const li = list
export const opt = optional
export const re = repeat

export const enclosedToken = (encloser: string) => is(new RegExp(`${encloser}.*?${encloser}`))
export const stringLiteral = or(enclosedToken(`"`), enclosedToken(`'`),)
export const integerLiteral = is(/(0|[1-9][0-9]*)/)
export const numberLiteral = is(/(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*))?/)

export const withHook = (like: MatcherLike, hook: Hook | Hook[]) => {
    const matcher = def(() => like)
    matcher.hooks.push(...(hook instanceof Array ? hook : [hook]))
    return matcher
}
