import { getConfig, treeNode } from "./config";
import { throwMirabowError } from "./error";
import { esc } from "./helper/escape";
import { isAscii } from "./helper/isAscii";
import { skipIgnoreString } from "./lex/skip";
import { addIsKeywords, getIsKeywords, hitAnyIsKeywords, hitIsKeyword } from "./tokennize";
import { DefinedMatcher, LexOutput, Matcher, MatcherInput, MatcherLike, MatcherOutput } from "./types";
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
        keywords: [arg],
        lex(src) {
            const ignoreCase = getConfig().ignoreCase
            const regexSrc = typeof arg === "string" ? esc(arg) : arg.source
            const regex = new RegExp(`^(${regexSrc})`, ignoreCase ? "i" : "")
            const regexRes = src.match(regex)
            if (regexRes) {
                const ans = regexRes[1]
                // console.log("is lex ok", arg, ">>>", `"${src}"`, ">>>", `"${ans}"`)
                return {
                    ok: true,
                    result: [ans],
                    index: [...ans].length,
                }
            } else {
                // console.log("is lex fail", arg, ">>>", `"${src}"`)
                return {
                    ok: false,
                    result: [],
                    index: 0,
                }
            }
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
export const identifier = (): Matcher => {
    return {
        type: "identifier",
        debug: `<identifier>`,
        isPrepared: false,
        lex(src) {
            const ignore = getConfig().ignoreString
            let index = 0
            let buf = ""
            for (let char of [...src]) {
                //異常系
                //charは空白文字
                if (ignore.exec(char)) {
                    break
                }
                //charは識別子として有効な文字ではない
                if (!_isIdentifierChar(char)) {
                    break
                }
                //正常系
                //charは識別子として有効な文字
                buf += char
                index++
            }
            if (buf === "") {
                return {
                    ok: false,
                    result: [],
                    index,
                }
            }
            return {
                ok: true,
                result: [buf],
                index,
            }
        },
        keywords: [],
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
function _isIdentifierChar(str: string) {
    const strList = [...str]
    if (strList.length !== 1) throwMirabowError(e => e.notImplement)
    const char = strList[0]
    return (
        /[a-zA-Z0-9_$]/.test(char) ||
        !isAscii(char)
    )
}
// //キーワード以外の任意の1トークン
// export const any = (): Matcher => {
//     const matcher = debug("<any>", not(anyKeyword()))
//     return matcher
// }
export const group = (..._matchers: MatcherLike[]): Matcher => {
    const matchers = _matchers.map(matcher => {
        return toMatcher(matcher)
    })
    const debug = matchers.map(m => m.debug).join(" ")
    return {
        type: "group",
        debug,
        isPrepared: false,
        prepare() {
            matchers.forEach(m => {
                prepareMatcher(m)
            })
        },
        keywords: [],
        lex: (src) => {
            const grpOut: LexOutput = {
                ok: true,
                result: [],
                index: 0,
            }
            function skipIgnoreS() {
                const skipLen = skipIgnoreString(src)
                grpOut.index += skipLen
                src = [...src].slice(skipLen).join("")
            }
            for (let matcher of matchers) {
                skipIgnoreS()
                const mOut = matcher.lex(src)
                if (mOut.ok) {
                    grpOut.index += mOut.index
                    grpOut.result.push(...mOut.result)
                    src = [...src].slice(mOut.index).join("")
                } else {
                    grpOut.ok = false
                    break
                }
            }
            // grpOut.index += skipIgnoreString(src)
            skipIgnoreS()
            return grpOut
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
                const out = executeMatcher(m, input)
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
            if (value.tokens) {
                const tokens = value.tokens
                ans.capture[key] = {
                    ...ans.capture[key],
                    tokens: [...(ans.capture[key].tokens ?? []), ...tokens],
                }
            }
            if (value.arrayScope) {
                const scopes = value.arrayScope
                ans.capture[key] = {
                    ...ans.capture[key],
                    arrayScope: [...(ans.capture[key].arrayScope ?? []), ...scopes],
                }
            }
            if (value.scope) {
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
    //tree
    if (getConfig().tree) {
        if (!(ans.tree instanceof Array)) {
            return throwMirabowError(e => e.matcher.output.tree)
        }
        ans.tree = [...ans.tree, out.tree]
    }
    //result
    ans.result.push(...out.result)
    return ans
}
export const or = (..._matchers: MatcherLike[]): Matcher => {
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
        keywords: [],
        lex: (src) => {
            for (let matcher of matchers) {
                const out = matcher.lex(src)
                if (out.ok) {
                    return out
                }
            }
            return {
                ok: false,
                index: 0,
                result: [],
            }
        },
        exec: (input) => {
            const orStartCursor = input.getCursor()
            for (const m of matchers) {
                const out = executeMatcher(m, input)
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
export const capture = (name: string, _matcher: MatcherLike = /.+/): Matcher => {
    const matcher = toMatcher(_matcher)
    return {
        ...matcher,
        type: "capture",
        debug: `<${matcher.debug}>`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        keywords: [],
        exec(input) {
            const out = executeMatcher(matcher, input)
            if (!out.isOk) {
                return emptyMatcherOutput()
            }
            if (!out.capture[name]) {
                out.capture[name] = {}
            }
            out.capture[name].tokens = [...(out.capture[name]?.tokens ?? []), out.match]
            return out
        },
    }
}
export const repeat = (..._matchers: MatcherLike[]): Matcher => {
    const matchers = _matchers.map(m => toMatcher(m))
    const matcher = group(...matchers)
    return {
        ...matcher,
        type: "repeat",
        debug: `(${matchers.map(m => m.debug).join(" ")})*`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        keywords: [],
        lex(src) {
            //matcher.lex().okがfalseになるまで繰り返す
            //ignoreStringのスキップも忘れずに
            const repOut: LexOutput = {
                ok: true,
                result: [],
                index: 0,
            }
            function skipIgnoreS() {
                const skipLen = skipIgnoreString(src)
                repOut.index += skipLen
                src = [...src].slice(skipLen).join("")
            }
            while (true) {
                skipIgnoreS()
                const mOut = matcher.lex(src)
                if (mOut.ok) {
                    repOut.result.push(...mOut.result)
                    repOut.index += mOut.index
                    src = [...src].slice(mOut.index).join("")
                } else {
                    break
                }
            }
            skipIgnoreS()
            return repOut
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
                const out = executeMatcher(matcher, input)
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
export const optional = (...args: MatcherLike[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "optional",
        debug: `(${matcher.debug})?`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        keywords: [],
        lex(src) {
            const out = matcher.lex(src)
            if (out.ok) {
                return out
            } else {
                return {
                    ok: true,
                    result: [],
                    index: 0,
                }
            }
        },
        exec(input) {
            const optStartCur = input.getCursor()
            const matcherOut = executeMatcher(matcher, input)
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
export const list = (args: MatcherLike[] | MatcherLike, joiner: MatcherLike = ","): Matcher => {
    if (!(args instanceof Array)) args = [args]
    const matchers = toMatcher(...args)
    const joinMatcher = toMatcher(joiner)
    const listMatcher = group(matchers, repeat(joinMatcher, matchers))
    return listMatcher
}
export const debug = (
    debug: string,
    _matcher: MatcherLike,
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
            const out = executeMatcher(matcher, input)
            if (hook) hook(input, out)
            return out
        },
    }
}
export const define = (..._matcher: [(() => MatcherLike)] | MatcherLike[]) => {
    let preparedMatcher: Matcher | null = null
    const definedMatcher: DefinedMatcher = {
        type: "define",
        debug: `define(???)`,
        isPrepared: false,
        prepare() {
            preparedMatcher = toMatcher(
                _matcher[0] instanceof Function ?
                    _matcher[0]() :
                    (_matcher as MatcherLike[])
            )
            prepareMatcher(preparedMatcher)
            preparedMatcher.debug = `debug(${preparedMatcher.debug})`
        },
        keywords: [],
        lex(src) {
            return preparedMatcher!.lex(src)
        },
        exec(input) {
            if (!preparedMatcher) return throwMirabowError(e => e.matcher.define)
            const out = executeMatcher(preparedMatcher, input)
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
export const scope = (name: string,) => (...args: MatcherLike[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "scope",
        debug: `scope(${name}){ ${matcher.debug} }`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        exec(input) {
            const out = executeMatcher(matcher, input)
            const ans = { ...out }
            ans.capture = {
                [name]: {
                    ...(ans.capture[name] ?? {}),
                    scope: ans.capture,
                }
            }
            return ans
        }
    }
}
export const arrayScope = (name: string) => (...args: MatcherLike[]): Matcher => {
    const matcher = toMatcher(...args)
    return {
        ...matcher,
        type: "scope",
        debug: `arrayScope(${name}){ ${matcher.debug} }`,
        isPrepared: false,
        prepare() {
            prepareMatcher(matcher)
        },
        exec(input) {
            const out = executeMatcher(matcher, input)
            const ans = { ...out }
            ans.capture = {
                [name]: {
                    ...(ans.capture[name] ?? {}),
                    arrayScope: [ans.capture],
                }
            }
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
            const out = executeMatcher(matcher, input)
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
        keywords: [],
        lex(src) {
            const keywords = getIsKeywords()
            const out = identifier().lex(src)
            if (out.ok && out.result[0] && hitAnyIsKeywords(out.result[0])) {
                return out
            } else {
                return {
                    ok: false,
                    index: 0,
                    result: [],
                }
            }
        },
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
                result: [],
                tree: inputToken,
            }
        },
    }
}

//Matcher内で他のMatcherを実行する
const executeMatcher = (matcher: Matcher, input: MatcherInput) => {
    return matcher.exec(input)
}

