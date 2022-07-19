import { getConfig } from "config";
import { esc } from "helper/escape";
import { _getAllHooks } from "hook";
import { _isKeywords } from "tokennize";
import { Hook, Matcher, MatcherInput, MatcherOutput, ToMatcherArg } from "types";
import { toMatcher } from "./util";


export const is = (arg: string | RegExp): Matcher => {
    if (typeof arg === "string") _isKeywords.add(arg)
    return {
        type: "is",
        debug: `"${arg}"`,
        exec: (input) => {
            let regex: RegExp;
            if (typeof arg === "string") {
                if (getConfig().ignoreCase) {
                    regex = new RegExp(esc(arg), "i")
                } else {
                    regex = new RegExp(esc(arg))
                }
            } else {
                regex = arg
            }
            const inputStr = input.getNext()
            if (inputStr && regex.exec(inputStr)) {
                return {
                    capture: {},
                    match: [inputStr],
                    result: undefined,
                }
            } else {
                return null
            }
        }
    }
}
export const any = (): Matcher => {
    return {
        type: "any",
        debug: `(any)`,
        exec: (input) => {
            const inputStr = input.getNext()
            if (inputStr) {
                return {
                    capture: {},
                    match: [inputStr],
                    result: undefined,
                }
            } else {
                return null
            }
        }
    }
}
export const group = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    return {
        type: "group",
        debug: `${matchers.map(m => m.debug).join(" ")}`,
        exec: (input) => {
            let ans: MatcherOutput | null = {
                capture: {},
                match: [],
                result: undefined,
            }
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out) {
                    ans = null
                    break;
                }
                ans = _updateGroupAns(ans, out)
            }
            return ans
        }
    }
}
function _updateGroupAns(prev: MatcherOutput | null, out: MatcherOutput) {
    if (!prev) {
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
            ans.capture[key] = [...ans.capture[key], ...value]
        } else {
            //keyはまだキャプチャされたことがない
            ans.capture[key] = value
        }
    })
    //match
    ans.match = [...ans.match, ...out.match]
    return ans
}
export const or = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    return {
        type: "or",
        debug: `${matchers.map(m => m.debug).join("|")}`,
        exec: (input) => {
            let ans: MatcherOutput | null = null
            const orStartCursor = input.getCursor()
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out) {
                    //inputを元に戻す
                    input.setCursor(orStartCursor)
                    continue
                }
                return {
                    ...out,
                    capture: { ...out.capture },
                    match: [...out.match]
                }
            }
            return ans
        }
    }
}
export const capture = (name: string, _matcher: ToMatcherArg = any()): Matcher => {
    const matcher = toMatcher(_matcher)
    return {
        type: "capture",
        debug: `<${matcher.debug}>`,
        exec(input) {
            const ans = matcher.exec(input)
            if (!ans) {
                return null
            }
            return {
                ...ans,
                capture: {
                    ...ans.capture,
                    [name]: [...(ans.capture[name] ?? []), ans.match],
                },
            }
        },
    }
}
export const repeat = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group(...matchers)
    return {
        type: "repeat",
        debug: `(${matchers.map(m => m.debug).join(" ")})*`,
        exec(input) {
            let cur = input.getCursor()
            let ans: MatcherOutput = {
                capture: {},
                match: [],
                result: undefined,
            }
            while (input.hasNext()) {
                const out = matcher.exec(input)
                if (!out) {
                    input.setCursor(cur)
                    break
                }
                ans = _updateGroupAns(ans, out)
                cur = input.getCursor()
            }
            return ans
        },
    }
}
export const optional = (...args: ToMatcherArg[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        type: "optional",
        debug: `(${matcher.debug})?`,
        exec(input) {
            const optStartCur = input.getCursor()
            const matcherOut = matcher.exec(input)
            if (!matcherOut) {
                input.setCursor(optStartCur)
                return {
                    capture: {},
                    match: [],
                    result: undefined,
                }
            }
            return matcherOut
        },
    }
}
export const list = (args: ToMatcherArg[] | ToMatcherArg, joiner: ToMatcherArg = ","): Matcher => {
    if (!(args instanceof Array)) args = [args]
    const matchers = toMatcher(...args)
    const joinMatcher = toMatcher(joiner)
    const listMatcher = group(matchers, repeat(joinMatcher, matchers))
    return listMatcher
}
export const debug = (
    debug: string,
    _matcher: ToMatcherArg,
    hook?: (input: MatcherInput, output: MatcherOutput | null) => unknown,
): Matcher => {
    const matcher = toMatcher(_matcher)
    return {
        ...matcher,
        debug,
        exec(input) {
            const ans = matcher.exec(input)
            if (hook) hook(input, ans)
            return ans
        },
    }
}
const _definedMatchers: Record<string, Matcher> = {}
export const define = (name: string) => (..._matchers: ToMatcherArg[]): Matcher => {
    const matcher = toMatcher(..._matchers)
    _definedMatchers[name] = matcher
    return {
        ...matcher,
    }
}
export const reference = (name: string): Matcher => {
    return {
        type: "lazy",
        debug: `$${name}`,
        exec(input) {
            const matcher = _definedMatchers[name]
            const ans = matcher.exec(input)
            const hook = _getAllHooks()[name] as Hook | undefined
            if (hook) {
                hook(ans)
            }
            return ans
        }
    }
}