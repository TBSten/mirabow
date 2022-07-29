import { group, is } from "./matcher"
import { Matcher, Tokens, ToMatcherArg } from "./types"

export const toMatcher = (...args: ToMatcherArg[]): Matcher => {
    const first = args[0]
    if (args.length === 1) {
        if (typeof first === "string") {
            return is(first)
        } else if (first instanceof Array) {
            return group(...first.map(a => toMatcher(a)))
        } else {
            return first
        }
    } else {
        return group(...args.map(a => toMatcher(a)))
    }
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
