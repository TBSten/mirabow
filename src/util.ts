import { throwMirabowError } from "./error";
import { group, is } from "./matcher";
import { Matcher, Tokens, ToMatcherArg } from "./types";

export const toMatcher = (...args: ToMatcherArg[]): Matcher => {
    let ans;
    const first = args[0]
    if (args.length <= 0) {
        return throwMirabowError(e => e.notImplement)
    } else if (args.length === 1) {
        if (typeof first === "string" || first instanceof RegExp) {
            ans = is(first)
        } else if (first instanceof Array) {
            ans = group(...first.map(a => toMatcher(a)))
        } else {
            ans = first
        }
    } else {
        ans = group(...args.map(a => toMatcher(a)))
    }
    return ans
}
export const prepareMatcher = (matcher: Matcher) => {
    if (matcher.isPrepared) return
    matcher.isPrepared = true
    matcher.prepare?.()
}
export const execMatcher = (
    matcher: ToMatcherArg,
    data: Tokens,
) => {
    let cur = 0
    const ans = toMatcher(matcher).exec({
        getCursor() {
            return cur
        },
        setCursor(cursor: number) {
            cur = cursor
        },
        getNext() {
            const ans = data[cur]
            cur++
            return ans ?? null
        },
        hasNext() {
            return cur < data.length
        },
    })
    return ans
}
