import { Scope, Tokens } from "./types";

export const getCapture = (capture: Scope, name: string) => {
    if (!capture) return null
    const ans = capture[name]
    return ans ?? null
}
const NONE = Symbol()
type NONE = typeof NONE
export const getCaptureTokens = (capture: Scope, name: string, defaultTokens: Tokens[] | NONE = NONE): Tokens[] => {
    const ans = getCapture(capture, name)
    if (!(ans instanceof Array)) {
        if (defaultTokens !== NONE) {
            return defaultTokens
        }
        throw new Error(`captured ${name} must be Token[] but ${ans}`)
    }
    if (!(ans[0] instanceof Array)) {
        throw new Error(`captured ${name} must be Token[] but ${ans}`)
    }
    return ans as Tokens[]
}
export const getCaptureArrayScope = (capture: Scope, name: string, defaultScope: Scope[] | NONE = NONE): Scope[] => {
    const ans = getCapture(capture, name)
    if (!(ans instanceof Array)) {
        if (defaultScope !== NONE) {
            return defaultScope
        }
        throw new Error(`captured ${name} must be Scope[] but ${ans}`)
    }
    if (ans[0] instanceof Array) {
        throw new Error(`captured ${name} must be Scope[] but ${ans}`)
    }
    return ans as Scope[]
}

/*
capture = {
    key1:[
        {
            items:[["a","b"]],
            key2:[["c"]],
        },
        {
            items:[["c"]],
            key1:[["a","b"]],
        },
    ]
}

const items = new CaptureQuery(capture)
    .arrayScope("key1")
    .Tokens("items")
items.forEach((item)=>{
    //item === ["a","b"],["c"]
})
*/
export class CaptureQuery {
    _scopes: Scope[]
    constructor(scope: Scope | Scope[]) {
        if (scope instanceof Array) {
            this._scopes = scope
        } else {
            this._scopes = [scope]
        }
    }
    arrayScope(key: string) {
        return new CaptureQuery(this._scopes.reduce((ans, scope) => {
            if (scope[key]) {
                ans.push(...getCaptureArrayScope(scope, key))
            }
            return ans
        }, [] as Scope[]))
    }
    tokens(key: string) {
        return this._scopes.reduce((ans, scope) => {
            if (scope[key]) {
                ans.push(...getCaptureTokens(scope, key))
            }
            return ans
        }, [] as Tokens[])
    }
    words(key: string, join: string = "") {
        return this.tokens(key).map(tokens => tokens.join(join))
    }
    scopes() {
        return this._scopes
    }
}
export const CapQuery = CaptureQuery
export const CQuery = CaptureQuery
