import { getConfig } from "./config";
import { esc } from "./helper/escape";
import { _getAllHooks } from "./hook";
import { addIsKeywords } from "./tokennize";
import { Hook, Matcher, MatcherInput, MatcherOutput, ToMatcherArg } from "./types";
import { toMatcher } from "./util";

export const emptyMatcherOutput = <R>(): MatcherOutput<R> => ({
    isOk: false,
    result: undefined,
    capture: {},
    match: [],
})

export const is = <R>(arg: string | RegExp): Matcher<R> => {
    if (typeof arg === "string") addIsKeywords(arg)
    return {
        type: "is",
        debug: `"${arg}"`,
        exec: (input: MatcherInput) => {
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
                    isOk: true,
                    capture: {},
                    match: [inputStr],
                    result: undefined,
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
export const any = <R>(): Matcher<R> => {
    return {
        type: "any",
        debug: `(any)`,
        exec: (input) => {
            const inputStr = input.getNext()
            if (inputStr) {
                return {
                    isOk: true,
                    capture: {},
                    match: [inputStr],
                    result: undefined,
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
export const group = <R>(..._matchers: ToMatcherArg<R>[]): Matcher<R> => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    return {
        type: "group",
        debug: `${matchers.map(m => m.debug).join(" ")}`,
        exec: (input) => {
            let ans: MatcherOutput<R> = {
                isOk: true,
                capture: {},
                match: [],
                result: undefined,
            }
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.isOk) {
                    ans.isOk = false
                    break
                }
                ans = _updateGroupAns(ans, out)
            }
            return ans
        }
    }
}
function _updateGroupAns<R>(prev: MatcherOutput<R>, out: MatcherOutput<R>) {
    if (!prev.isOk) {
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
export const or = <R>(..._matchers: ToMatcherArg<R>[]): Matcher<R> => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    return {
        type: "or",
        debug: `${matchers.map(m => m.debug).join("|")}`,
        exec: (input) => {
            const orStartCursor = input.getCursor()
            for (const m of matchers) {
                const out = m.exec(input)
                if (!out.isOk) {
                    //inputを元に戻す
                    input.setCursor(orStartCursor)
                    continue
                }
                //mにマッチしたのでoutを返す
                return {
                    ...out,
                    isOk: true,
                    capture: { ...out.capture },
                    match: [...out.match]
                }
            }
            return emptyMatcherOutput()
        }
    }
}
export const capture = <R>(name: string, _matcher: ToMatcherArg<R> = any()): Matcher<R> => {
    const matcher = toMatcher(_matcher)
    return {
        type: "capture",
        debug: `<${matcher.debug}>`,
        exec(input) {
            const ans = matcher.exec(input)
            if (!ans.isOk) {
                return emptyMatcherOutput()
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
export const repeat = <R>(..._matchers: ToMatcherArg<R>[]): Matcher<R> => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group(...matchers)
    return {
        type: "repeat",
        debug: `(${matchers.map(m => m.debug).join(" ")})*`,
        exec(input) {
            let cur = input.getCursor()
            let ans: MatcherOutput<R> = {
                isOk: true,
                capture: {},
                match: [],
                result: undefined,
            }
            while (input.hasNext()) {
                const out = matcher.exec(input)
                if (!out.isOk) {
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
export const optional = <R>(...args: ToMatcherArg<R>[]): Matcher<R> => {
    const matcher = toMatcher(...args)
    return {
        type: "optional",
        debug: `(${matcher.debug})?`,
        exec(input) {
            const optStartCur = input.getCursor()
            const matcherOut = matcher.exec(input)
            if (!matcherOut.isOk) {
                input.setCursor(optStartCur)
                return {
                    isOk: true,
                    capture: {},
                    match: [],
                    result: undefined,
                }
            }
            return matcherOut
        },
    }
}
export const list = <R>(args: ToMatcherArg<R>[] | ToMatcherArg<R>, joiner: ToMatcherArg<R> = ","): Matcher<R> => {
    if (!(args instanceof Array)) args = [args]
    const matchers = toMatcher(...args)
    const joinMatcher = toMatcher(joiner)
    const listMatcher = group(matchers, repeat(joinMatcher, matchers))
    return listMatcher
}
export const debug = <R>(
    debug: string,
    _matcher: ToMatcherArg<R>,
    hook?: (input: MatcherInput, output: MatcherOutput<R> | null) => unknown,
): Matcher<R> => {
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
const _definedMatchers: Record<string, Matcher<any>> = {}
export const define = (name: string) => <R>(..._matchers: ToMatcherArg<R>[]): Matcher<R> => {
    const matcher = toMatcher(..._matchers)
    _definedMatchers[name] = matcher
    return {
        ...matcher,
        exec(input) {
            const out = matcher.exec(input)
            emitMatcherHook(name, out)
            return out
        }
    }
}
export const reference = <R>(name: string): Matcher<R> => {
    return {
        type: "lazy",
        debug: `$${name}`,
        exec(input) {
            const matcher = _definedMatchers[name]
            const ans = matcher.exec(input)
            // const hook = _getAllHooks()[name] as Hook | undefined
            // if (hook) {
            //     hook(ans)
            // }
            emitMatcherHook(name, ans)
            return ans
        }
    }
}
const emitMatcherHook = <R>(name: string, out: MatcherOutput<R>) => {
    const hook = _getAllHooks()[name] as Hook<R> | undefined
    if (hook) {
        hook(out)
    }
}

