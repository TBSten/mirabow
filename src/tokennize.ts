import { getConfig } from "./config";
import { esc } from "./helper/escape";
import { Matcher, Tokens } from "./types";

export type Keyword = string | RegExp
const _isKeywords = new Set<Keyword>()
const sortKeywords = (keywords: Iterable<Keyword>) => Array.from(keywords).sort((a, b) => {
    if (a instanceof RegExp) {
        return -1
    } else if (b instanceof RegExp) {
        return 1
    } else {
        return b.length - a.length
    }
})
export const clearIsKeywords = () => _isKeywords.clear()
export const getIsKeywords = () => sortKeywords(_isKeywords.values())
export const addIsKeywords = (isKeywords: Keyword) => _isKeywords.add(isKeywords)
export const hitIsKeyword = (keyword: Keyword, target: string) => {
    const regex = typeof keyword === "string" ? esc(keyword) : keyword.source
    const ignoreCase = getConfig().ignoreCase
    return !!target.match(new RegExp(`^${regex}$`, ignoreCase ? "i" : ""))
}
export const hitAnyIsKeywords = (target: string) => {
    const keywords = getIsKeywords()
    for (let kw of keywords) {
        if (hitIsKeyword(kw, target)) {
            return true
        }
    }
    return false
}

export const tokennize = (source: string, matcher: Matcher): Tokens => {
    const sourceArr = [...source]
    const lexOut = matcher.lex(source)
    if (!lexOut.ok) {
        // console.error(lexOut)
        throw new Error(`failed tokennize . lex output:${JSON.stringify(lexOut)}`)
    }
    if (lexOut.index < sourceArr.length) {
        // console.error(lexOut)
        throw new Error(`missing input . lexer could not read through the input . lex output:${JSON.stringify(lexOut)}`)
    }
    return lexOut.result
}

