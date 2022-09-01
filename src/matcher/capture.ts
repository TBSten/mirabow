import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike } from "../type";

export const capture = (name: string, _matcher: MatcherLike): Matcher<"capture"> => {
    const matcher = toMatcher(_matcher)
    return {
        ...matcher,
        type: "capture",
        exec(input) {
            const out = matcher.exec(input)
            if (!out.ok) {
                return out
            }
            if (!out.capture[name]) {
                out.capture[name] = {}
            }
            out.capture[name]!.tokens = [
                ...(out.capture[name]?.tokens ?? []),
                out.match,
            ]
            return out
        },
    }
}