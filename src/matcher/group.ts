import { skipIgnoreString } from "../tokenize/skip";
import { toMatcher } from "../toMatcher";
import { LexerOutput, Matcher, MatcherLike, MatcherOutput } from "../type";
import { joinTokens, tokens } from "../util";

export const group = (
    ..._matchers: MatcherLike[]
): Matcher<"group"> => {
    const matchers = _matchers.map(m => toMatcher(m))
    return {
        type: "group",
        debug: `${matchers.map(m => m.debug).join(" ")}`,
        lex(input) {
            let grpOut: LexerOutput = {
                ok: true,
                tokens: tokens(input.raw, []),
                end: input.start,
                errors: [],
            }
            function skipIgnoreS() {
                const skip = skipIgnoreString(input)
                grpOut.end = skip.end
                input.start = skip.end
            }
            for (let matcher of matchers) {
                skipIgnoreS()
                const mOut = matcher.lex({
                    ...input,
                    start: grpOut.end,
                })
                if (mOut.ok) {
                    // grpOut.tokens.push(...mOut.tokens)
                    grpOut.tokens = joinTokens(input.raw, grpOut.tokens, mOut.tokens)
                    grpOut.end = mOut.end
                    input.start = mOut.end
                } else {
                    grpOut.ok = false
                    grpOut.errors.push(...mOut.errors)
                    // ここでbreakしなければ曖昧な一致ができる?!
                    break
                }
            }
            skipIgnoreS()
            return grpOut
        },
        exec(input) {
            let ans: MatcherOutput = {
                raw: input.getRaw(),
                ok: true,
                capture: {},
                match: tokens(input.getRaw(), []),
                errors: [],
            }
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.ok) {
                    ans.ok = false
                    ans.errors.push(...out.errors)
                    break
                }
                ans = _updateGroupAns(ans, out)
            }
            return ans
        },
    }
}
export function _updateGroupAns(prev: MatcherOutput, out: MatcherOutput) {
    if (!prev.ok) {
        return out
    }
    //prevをoutで更新
    let ans: MatcherOutput = {
        ...prev,
    }
    //capture
    Object.entries(out.capture).forEach(([key, value]) => {
        if (ans.capture[key]) {
            //keyは既にキャプチャされたことがある
            if (value?.tokens) {
                const tokens = value.tokens
                ans.capture[key] = {
                    ...ans.capture[key],
                    tokens: [...(ans.capture[key]?.tokens ?? []), ...tokens],
                }
            }
            if (value?.arrayScope) {
                const scopes = value.arrayScope
                ans.capture[key] = {
                    ...ans.capture[key],
                    arrayScope: [...(ans.capture[key]?.arrayScope ?? []), ...scopes],
                }
            }
            if (value?.scope) {
                const scope = value.scope
                ans.capture[key] = {
                    ...ans.capture[key],
                    scope,
                }
            }
        } else {
            //keyはまだキャプチャされたことがない
            ans.capture[key] = value
        }
    })
    //match
    // ans.match = [...ans.match, ...out.match]
    ans.match = joinTokens(out.raw, ans.match, out.match)
    return ans
}