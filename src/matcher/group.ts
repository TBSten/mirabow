import { skipIgnoreString } from "../tokenize/skip";
import { toMatcher } from "../toMatcher";
import { LexerOutput, Matcher, MatcherLike, MatcherOutput } from "../type";

export const group = <R>(
    ..._matchers: MatcherLike<R>[]
): Matcher<"group", R> => {
    const matchers = _matchers.map(m => toMatcher(m))
    return {
        type: "group",
        debug: `${matchers.map(m => m.debug).join(" ")}`,
        lex(input) {
            const grpOut: LexerOutput = {
                ok: true,
                tokens: [],
                end: input.start,
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
                    grpOut.tokens.push(...mOut.tokens)
                    grpOut.end = mOut.end
                    input.start = mOut.end
                } else {
                    grpOut.ok = false
                    // ここでbreakしなければ曖昧な一致ができる?!
                    break
                }
            }
            skipIgnoreS()
            return grpOut
        },
        exec(input) {
            let ans: MatcherOutput<R> = {
                ok: true,
                capture: {},
                match: [],
                result: null,
            }
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.ok) {
                    ans.ok = false
                    break
                }
                ans = _updateGroupAns(ans, out)
            }
            return ans
        },
    }
}
export function _updateGroupAns<R>(prev: MatcherOutput<R>, out: MatcherOutput<R>) {
    if (!prev.ok) {
        return out
    }
    //prevをoutで更新
    let ans: MatcherOutput<R> = {
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
    ans.match = [...ans.match, ...out.match]
    return ans
}