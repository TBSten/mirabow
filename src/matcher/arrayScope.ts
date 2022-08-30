import { toMatcher } from "../toMatcher"
import { Matcher, MatcherLike } from "../type"

export const arrayScope = (name: string) => <R>(...args: MatcherLike<R>[]): Matcher<"scope", R> => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "scope",
        debug: `arrayScope(${name}){ ${matcher.debug} }`,
        exec(input) {
            const out = matcher.exec(input)
            const ans = { ...out }
            ans.capture = {
                [name]: {
                    ...(ans.capture[name] ?? {}),
                    arrayScope: [ans.capture],
                }
            }
            return ans
        },
    }
}