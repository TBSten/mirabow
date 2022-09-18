import { MirabowError } from "../error/MirabowError";
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
            const errors: MirabowError[] = []
            const start = input.start
            for (const matcher of matchers) {
                const out = matcher.lex(input)
                if (out.ok) {
                    return out
                }
                input.start = start
                errors.push(...out.errors)
            }
            const error = new MirabowError({
                reason: ``,
                when: "lex",
            })
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
                    errors.push(...out.errors)
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
            return {
                ok: false,
                match: tokens(input.getRaw(), []),
                capture: {},
                raw: input.getRaw(),
                errors: [new MirabowError({
                    when: "exec",
                    reason: `expect ${matchers.map(m => m.debug).join(" | ")} but invalid tokens`,
                    childrenErrors: errors,
                })],
            }
        }
    }
}
