import { toMatcher } from "../toMatcher";
import { Matcher, MatcherLike, MirabowError } from "../type";
import { tokens } from "../util";

export const or = (
    ..._matchers: MatcherLike[]
): Matcher<"or"> => {
    const matchers = _matchers.map(m => toMatcher(m))
    return {
        type: "or",
        debug: `(${matchers.map(m => m.debug).join("|")})`,
        lex(input) {
            const errors: MirabowError[] = []
            const start = input.start
            for (const matcher of matchers) {
                const out = matcher.lex(input)
                if (out.ok) {
                    return out
                }
                input.start = start
                errors.push(out.errors)
            }
            const error = Error(`or failed lex : none of (${matchers.map(m => m.debug).join(" ")})`)
            return {
                ok: false,
                tokens: tokens(input.raw, []),
                end: input.start,
                errors: [Object.assign(error, { childrenErrors: errors })],
            }
        },
        exec(input) {
            const errors: MirabowError[] = []
            const orStartIndex = input.getIndex()
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.ok) {
                    input.setIndex(orStartIndex)
                    errors.push(out.errors)
                    continue
                }
                return {
                    ...out,
                    ok: true,
                    capture: { ...out.capture },
                    match: out.match,
                    errors: [],
                }
            }
            const error = Error(`or failed exec : none of (${matchers.map(m => m.debug).join(" ")})`)
            return {
                ok: false,
                match: tokens(input.getRaw(), []),
                capture: {},
                raw: input.getRaw(),
                errors: [Object.assign(error, { childrenErrors: errors })],
            }
        }
    }
}
