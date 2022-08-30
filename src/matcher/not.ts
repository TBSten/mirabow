import { toMatcher } from "../toMatcher"
import { Matcher, MatcherLike } from "../type"

export const not = <R>(_matcher: MatcherLike<R>): Matcher<"not", R> => {
    const matcher = toMatcher(_matcher)
    return {
        ...matcher,
        type: "not",
        debug: `not(${matcher.debug})`,
        exec(input) {
            const out = matcher.exec(input)
            return {
                ...out,
                ok: !out.ok,
            }
        }
    }
}