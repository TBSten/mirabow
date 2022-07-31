import { inspect } from "util";
import { getCaptureArrayScope, getCaptureTokens } from "./capture";
import { getConfig, treeNode } from "./config";
import { esc } from "./helper/escape";
import { addIsKeywords, getIsKeywords, hitIsKeyword } from "./tokennize";
import { Capture, DefinedMatcher, isScope, isTokens, Matcher, MatcherInput, MatcherOutput, Scope, Tokens, ToMatcherArg } from "./types";
import { prepareMatcher, toMatcher } from "./util";

export const emptyMatcherOutput = (): MatcherOutput => ({
    isOk: false,
    result: [],
    capture: {},
    match: [],
    tree: null,
})

export const is = (arg: string | RegExp): Matcher => {
    return {
        type: "is",
        debug: `"${arg}"`,
        isPrepared: false,
        prepare() {
            addIsKeywords(arg)
        },
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
                    result: [],
                    tree: treeNode(inputToken),
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
//キーワードを含めた任意の1トークン
export const token = (): Matcher => {
    return {
        type: "any",
        debug: `(any)`,
        isPrepared: false,
        exec: (input) => {
            const inputToken = input.getNext()
            if (inputToken) {
                return {
                    isOk: true,
                    capture: {},
                    match: [inputToken],
                    result: [inputToken],
                    tree: inputToken,
                }
            } else {
                return emptyMatcherOutput()
            }
        }
    }
}
//キーワード以外の任意の1トークン
export const any = (): Matcher => {
    const matcher = debug("<any>", not(anyKeyword()))
    return matcher
}
export const group = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    // if (matchers.length === 1) return matchers[0]
    return {
        type: "group",
        debug: `${matchers.map(m => m.debug).join(" ")}`,
        isPrepared: false,
        prepare() {
            matchers.forEach(m => {
                prepareMatcher(m)
            })
        },
        exec: (input) => {
            let ans: MatcherOutput = {
                isOk: true,
                capture: {},
                match: [],
                result: [],
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
function _updateGroupAns(prev: MatcherOutput, out: MatcherOutput) {
    if (!prev.isOk) {
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
    //result
    ans.result.push(...out.result)
    return ans
}
export const or = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    return {
        type: "or",
        debug: `${matchers.map(m => m.debug).join("|")}`,
        isPrepared: false,
        prepare() {
            matchers.forEach(m => prepareMatcher(m))
        },
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
export const capture = (name: string, _matcher: ToMatcherArg = token()): Matcher => {
    const matcher = toMatcher(_matcher)
    return {
        type: "capture",
        debug: `<${matcher.debug}>`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
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
export const repeat = (..._matchers: ToMatcherArg[]): Matcher => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group(...matchers)
    return {
        type: "repeat",
        debug: `(${matchers.map(m => m.debug).join(" ")})*`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        exec(input) {
            let cur = input.getCursor()
            let ans: MatcherOutput = {
                isOk: true,
                capture: {},
                match: [],
                result: [],
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
export const optional = (...args: ToMatcherArg[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        type: "optional",
        debug: `(${matcher.debug})?`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        exec(input) {
            const optStartCur = input.getCursor()
            const matcherOut = matcher.exec(input)
            if (!matcherOut.isOk) {
                input.setCursor(optStartCur)
                return {
                    isOk: true,
                    capture: {},
                    match: [],
                    result: [],
                    tree: null,
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
        prepare() {
            prepareMatcher(matcher)
        },
        exec(input) {
            const ans = matcher.exec(input)
            if (hook) hook(input, ans)
            return ans
        },
    }
}
export const define = (..._matcher: [(() => ToMatcherArg)] | ToMatcherArg[]) => {
    console.log("define");
    let preparedMatcher: Matcher | null = null
    const definedMatcher: DefinedMatcher = {
        type: "define",
        debug: `define(???)`,
        isPrepared: false,
        prepare() {
            preparedMatcher = toMatcher(
                _matcher[0] instanceof Function ?
                    _matcher[0]() :
                    (_matcher as ToMatcherArg[])
            )
            prepareMatcher(preparedMatcher)
            preparedMatcher.debug = `debug(${preparedMatcher.debug})`
        },
        exec(input) {
            if (!preparedMatcher) throw new Error(`define matcher is not prepared . prease call this matcher's prepare`)
            let out = preparedMatcher!.exec(input)
            if (!out.isOk) {
                return out
            }
            // emit matcher hook by out
            const newResult = definedMatcher.hook(out)
            if (newResult) {
                out.result = newResult
            }
            return out
        },
        hook(out) {
            return out.result
        },
    }
    return definedMatcher
}
export const scope = (name: string,) => (...args: ToMatcherArg[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        type: "scope",
        debug: `scope(${name}){ ${matcher.debug} }`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
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
export const arrayScope = (name: string) => (...args: ToMatcherArg[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        type: "scope",
        debug: `arrayScope(${name}){ ${matcher.debug} }`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
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
export const not = (matcher: Matcher): Matcher => {
    return {
        ...matcher,
        type: "not",
        debug: `!(${matcher.debug})`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
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
export const anyKeyword = (): Matcher => {
    return {
        type: "someKeyword",
        debug: `someKeyword`,
        isPrepared: false,
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
                result: [inputToken],
                tree: inputToken,
            }
        },
    }
}
