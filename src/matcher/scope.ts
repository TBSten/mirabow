import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike } from "../type";

export const scope = <R>(name: string) => (...args: MatcherLike<R>[]): Matcher<"scope", R> => {
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