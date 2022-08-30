import { toMatcher } from "../toMatcher"
import { Matcher, MatcherLike } from "../type"

export const optional = <R>(...args: MatcherLike<R>[]): Matcher<"optional", R> => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "optional",
        debug: `(${matcher.debug})?`,
        lex(input) {
            const start = input.start
            const out = matcher.lex(input)
            if (out.ok) {
                return out
            } else {
                input.start = start
                return {
                    ok: true,
                    tokens: [],
                    end: input.start,
                }
            }
        },
        exec(input) {
            const optStartIdx = input.getIndex()
            const matcherOut = matcher.exec(input)
            if (!matcherOut.ok) {
                input.setIndex(optStartIdx)
                return {
                    ok: true,
                    capture: {},
                    match: [],
                    result: null,
                }
            }
            return matcherOut
        },
    }
}