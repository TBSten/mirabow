import { skipIgnoreString } from "../tokenize/skip"
import { toMatcher } from "../toMatcher"
import { LexerOutput, Matcher, MatcherLike, MatcherOutput } from "../type"
import { group, _updateGroupAns } from "./group"

export const repeat = <R>(..._matchers: MatcherLike<R>[]): Matcher<"repeat", R> => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group<R>(...matchers)
    return {
        ...matcher,
        type: "repeat",
        debug: `(${matcher.debug})*`,
        lex(input) {
            const repOut: LexerOutput = {
                ok: true,
                tokens: [],
                end: 0,
            }
            function skipIgnoreS() {
                const skip = skipIgnoreString(input)
                repOut.end = skip.end
                input.start = skip.end
            }
            let idx = input.start
            while (true) {
                skipIgnoreS()
                const mOut = matcher.lex(input)
                if (!mOut.ok) {
                    input.start = repOut.end
                    break
                }
                repOut.tokens.push(...mOut.tokens)
                repOut.end = mOut.end
                idx = mOut.end
            }
            skipIgnoreS()
            return repOut
        },
        exec(input) {
            let idx = input.getIndex()
            let ans: MatcherOutput<R> = {
                ok: true,
                capture: {},
                match: [],
                result: null,
            }
            while (input.hasNext()) {
                const out = matcher.exec(input)
                if (!out.ok) {
                    input.setIndex(idx)
                    break
                }
                ans = _updateGroupAns<R>(ans, out)
                idx = input.getIndex()
            }
            return ans
        },
    }
}