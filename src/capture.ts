import { Capture, Scope, Tokens } from "./types";

export const getCapture = (capture: Capture, name: string) => {
    if (!capture) return null
    const ans = capture[name]
    return ans ?? null
}
const NONE = Symbol()
type NONE = typeof NONE
export const getCaptureTokens = (capture: Capture, name: string, defaultTokens: Tokens[] | NONE = NONE): Tokens[] => {
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
export const getCaptureArrayScope = (capture: Capture, name: string, defaultScope: Scope[] | NONE = NONE): Scope[] => {
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
