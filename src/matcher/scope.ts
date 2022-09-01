import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike } from "../type";

export const scope = (name: string) => (...args: MatcherLike[]): Matcher<"scope"> => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "scope",
        debug: `scope`,
        exec(input) {
            const out = matcher.exec(input)
            const ans = { ...out }
            ans.capture = {
                [name]: {
                    ...(ans.capture[name] ?? {}),
                    scope: ans.capture,
                }
            }
            return ans
        }
    }
}