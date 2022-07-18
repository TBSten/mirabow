
//matcher

export type Token = string
export type Tokens = Token[]
export type MatcherInput = {
    getNext(): Token | null
    setCursor(cursor: number): void
    getCursor(): number
    hasNext(): boolean
}
export type MatcherOutput<R = undefined> = {
    capture: Record<string, Tokens[]>
    match: Tokens
    result: R | undefined
}
export type Matcher = {
    type: string,
    debug: string,
    exec: (input: MatcherInput) => MatcherOutput | null
}

function esc(str: string) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}
const isKeywords = new Set<string>()
export const is = (arg: string | RegExp): Matcher => {
    if (typeof arg === "string") isKeywords.add(arg)
    return {
        type: "is",
        debug: `"${arg}"`,
        exec: (input) => {
            let regex: RegExp;
            if (typeof arg === "string") {
                regex = new RegExp(esc(arg), "i")
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
            const hook = _hooks[name] as Hook | undefined
            if (hook) {
                hook(ans)
            }
            return ans
        }
    }
}

//shortcut
export const g = group
export const grp = group
export const c = capture
export const cap = capture
export const r = repeat
export const re = repeat
export const opt = optional
export const li = list
export const def = define
export const ref = reference

//hook
type Hook = (output: MatcherOutput | null) => unknown
const _hooks: Record<string, Hook> = {}
export const addHook = (name: string, hook: Hook) => {
    _hooks[name] = hook
}

//util

export type ToMatcherArgUnit = string | Matcher | ToMatcherArgUnit[]
export type ToMatcherArg = ToMatcherArgUnit | ToMatcherArgUnit[]
export const toMatcher = (...args: ToMatcherArg[]): Matcher => {
    const first = args[0]
    if (args.length === 1) {
        if (typeof first === "string") {
            return is(first)
        } else if (first instanceof Array) {
            return group(...first.map(a => toMatcher(a)))
        } else {
            return first
        }
    } else {
        return group(...args.map(a => toMatcher(a)))
    }
}
export const execMatcher = (
    matcher: ToMatcherArg,
    data: Tokens,
) => {
    let cur = 0
    const ans = toMatcher(matcher).exec({
        getCursor() {
            return cur
        },
        setCursor(cursor: number) {
            cur = cursor
        },
        getNext() {
            const ans = data[cur]
            cur++
            return ans ?? null
        },
        hasNext() {
            return cur < data.length
        },
    })
    return ans
}

export const tokennize = (source: string, keywords: string[] = Array.from(isKeywords)): Tokens => {
    const escKeywords = keywords.map(s => esc(s)).sort((a, b) => b.length - a.length)
    const ans: string[] = source
        .split(new RegExp(`(${escKeywords.join("|")})|\\s+`, "i"))
        .filter(s => s && !s.match(new RegExp("^\\s*$")))
    return ans
}

