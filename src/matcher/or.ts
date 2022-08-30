import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike } from "../type";

export const or = (
    ..._matchers: MatcherLike[]
): Matcher<"or"> => {
    const matchers = _matchers.map(m => toMatcher(m))
    return {
        type: "or",
        debug: `(${matchers.map(m => m.debug).join("|")})`,
        lex(input) {
            for (const matcher of matchers) {
                const out = matcher.lex(input)
                if (out.ok) {
                    return out
                }
            }
            return {
                ok: false,
                tokens: [],
                end: input.start,
            }
        },
        exec(input) {
            const orStartIndex = input.getIndex()
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.ok) {
                    input.setIndex(orStartIndex)
                    continue
                }
                return {
                    ...out,
                    ok: true,
                    capture: { ...out.capture },
                    match: [...out.match],
                }
            }
            return {
                ok: false,
                match: [],
                capture: {},
            }
        }
    }
}
