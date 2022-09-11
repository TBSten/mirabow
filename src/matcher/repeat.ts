import { skipIgnoreString } from "../tokenize/skip"
import { toMatcher } from "../toMatcher"
import { LexerOutput, Matcher, MatcherLike, MatcherOutput } from "../type"
import { joinTokens, tokens } from "../util"
import { group, _updateGroupAns } from "./group"

export const repeat = (..._matchers: MatcherLike[]): Matcher<"repeat"> => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group(...matchers)
    return {
        ...matcher,
        type: "repeat",
        debug: `(${matcher.debug})*`,
        lex(input) {
            const repOut: LexerOutput = {
                ok: true,
                tokens: tokens(input.raw, []),
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
                // repOut.tokens.push(...mOut.tokens)
                repOut.tokens = joinTokens(input.raw, repOut.tokens, mOut.tokens)
                repOut.end = mOut.end
                idx = mOut.end
            }
            skipIgnoreS()
            return repOut
        },
        exec(input) {
            let idx = input.getIndex()
            let ans: MatcherOutput = {
                ok: true,
                capture: {},
                match: tokens(input.getRaw(), []),
                raw: input.getRaw(),
            }
            while (input.hasNext()) {
                const out = matcher.exec(input)
                if (!out.ok) {
                    input.setIndex(idx)
                    break
                }
                ans = _updateGroupAns(ans, out)
                idx = input.getIndex()
            }
            return ans
        },
    }
}