import { inspect } from "util";
import { getCaptureArrayScope, getCaptureTokens } from "./capture";
import { getConfig, treeNode } from "./config";
import { esc } from "./helper/escape";
import { _getAllHooks } from "./hook";
import { addIsKeywords, getIsKeywords, hitIsKeyword } from "./tokennize";
import { Capture, Hook, isScope, isTokens, Matcher, MatcherInput, MatcherOutput, Scope, Tokens, ToMatcherArg } from "./types";
import { toMatcher } from "./util";

export const emptyMatcherOutput = <R>(): MatcherOutput<R> => ({
    isOk: false,
    result: undefined,
    capture: {},
    match: [],
    tree: null,
})

export const is = <R>(arg: string | RegExp): Matcher<R> => {
    // if (typeof arg === "string") addIsKeywords(arg)
    addIsKeywords(arg)
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
            const inputToken = input.getNext()
            if (inputToken && regex.exec(inputToken)) {
                return {
                    isOk: true,
                    capture: {},
                    match: [inputToken],
                    result: undefined,
                    tree: treeNode(inputToken),
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
//キーワードを含めた任意の1トークン
export const token = <R>(): Matcher<R> => {
    return {
        type: "any",
        debug: `(any)`,
        exec: (input) => {
            const inputToken = input.getNext()
            if (inputToken) {
                return {
                    isOk: true,
                    capture: {},
                    match: [inputToken],
                    result: undefined,
                    tree: inputToken,
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
//キーワード以外の任意の1トークン
export const any = <R>(): Matcher<R> => {
    const matcher = debug("<any>", not<R>(anyKeyword<R>()))
    return matcher
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
                tree: [],
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
            const isArray = value instanceof Array
            // console.log(value, isArray && isScope(value[0]));
            if (isArray && isTokens(value[0])) {
                //value は Tokens
                const tokens = value as Tokens[]
                ans.capture[key] = [...getCaptureTokens(ans.capture, key), ...tokens]
            } else if (isArray && isScope(value[0])) {
                //value は Scope[]
                const scopes = value as Scope[]
                ans.capture[key] = [...getCaptureArrayScope(ans.capture, key), ...scopes]
            } else {
                //valueが不正
                throw new Error(`invalid value as CaptureNode key:${key} value:${inspect(value, { colors: false, depth: 10 })}`)
            }
        } else {
            //keyはまだキャプチャされたことがない
            ans.capture[key] = value
        }
    })
    //match
    ans.match = [...ans.match, ...out.match]
    //tree
    if (getConfig().tree) {
        if (!(ans.tree instanceof Array)) {
            throw new Error("MatcherOutput.tree must be Array")
        }
        ans.tree = [...ans.tree, out.tree]
    }
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
                    match: [...out.match],
                }
            }
            return emptyMatcherOutput()
        }
    }
}
export const capture = <R>(name: string, _matcher: ToMatcherArg<R> = token()): Matcher<R> => {
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
                    // [name]: [...(ans.capture[name] ?? []), ans.match],
                    [name]: [...(getCaptureTokens(ans.capture, name, [])), ans.match],
                } as Capture,
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
                tree: treeNode([]),
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
                    tree: null,
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
const _defId = () => Math.floor(Math.random() * 10 ^ 12) + ""
// export const define = (name: string) => <R>(..._matchers: ToMatcherArg<R>[]): Matcher<R> => {
//     const matcher = toMatcher(..._matchers)
//     _definedMatchers[name] = matcher
//     return {
//         ...matcher,
//         exec(input) {
//             const out = matcher.exec(input)
//             emitMatcherHook(name, out)
//             return out
//         }
//     }
// }
export const define = <R>(_matcher: (() => Matcher<R>) | Matcher<R>): Matcher<R> => {
    return {
        type: "define",
        debug: `define()`,
        exec(input) {
            const id = _defId()
            const matcher = _matcher instanceof Function ? _matcher() : _matcher
            _definedMatchers[id] = matcher
            const out = matcher.exec(input)
            emitMatcherHook(id, out)
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
    if (out.isOk && hook) {
        hook(out)
    }
}
export const scope = <R>(name: string,) => (...args: ToMatcherArg<R>[]): Matcher<R> => {
    const matcher = toMatcher(...args)
    return {
        type: "scope",
        debug: `scope(${name}){ ${matcher.debug} }`,
        exec(input) {
            const ans = matcher.exec(input)
            ans.capture = {
                [name]: {
                    ...ans.capture
                } as Scope
            }
            return ans
        }
    }
}
export const arrayScope = <R>(name: string) => (...args: ToMatcherArg<R>[]): Matcher<R> => {
    const matcher = toMatcher(...args)
    return {
        type: "scope",
        debug: `arrayScope(${name}){ ${matcher.debug} }`,
        exec(input) {
            const ans = matcher.exec(input)
            ans.capture = {
                [name]: [ans.capture]
            } as Scope
            return ans
        },
    }
}
//引数で指定したMatcherがisOk:falseを返したらをそれをtrueにして返す
export const not = <R>(matcher: Matcher<R>): Matcher<R> => {
    return {
        ...matcher,
        type: "not",
        debug: `!(${matcher.debug})`,
        exec(input) {
            const out = matcher.exec(input)
            return {
                ...out,
                isOk: !out.isOk,
            }
        }
    }
}
//何かしらのキーワード
export const anyKeyword = <R>(): Matcher<R> => {
    return {
        type: "someKeyword",
        debug: `someKeyword`,
        exec(input) {
            const inputToken = input.getNext()
            if (!inputToken) return emptyMatcherOutput()
            const keywords = getIsKeywords()
            const isHit = keywords.reduce((ans, keyword) => {
                if (ans || hitIsKeyword(keyword, inputToken)) {
                    return true
                }
                return ans
            }, false)
            return {
                isOk: isHit,
                capture: {},
                match: [inputToken],
                result: undefined,
                tree: inputToken,
            }
        },
    }
}
