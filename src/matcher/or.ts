import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike } from "../type";
import { tokens } from "../util";

export const or = (
    ..._matchers: MatcherLike[]
): Matcher<"or"> => {
    const matchers = _matchers.map(m => toMatcher(m))
    return {
        type: "or",
        debug: `(${matchers.map(m => m.debug).join("|")})`,
        lex(input) {
            const start = input.start
            for (const matcher of matchers) {
                const out = matcher.lex(input)
                if (out.ok) {
                    return out
                }
                input.start = start
            }
            return {
                ok: false,
                tokens: tokens(input.raw, []),
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
                    match: out.match,
                }
            }
            return {
                ok: false,
                match: tokens(input.getRaw(), []),
                capture: {},
                raw: input.getRaw(),
            }
        }
    }
}
