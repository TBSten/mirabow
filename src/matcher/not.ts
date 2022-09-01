import { toMatcher } from "../toMatcher"
import { Matcher, MatcherLike } from "../type"

export const not = (_matcher: MatcherLike): Matcher<"not"> => {
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