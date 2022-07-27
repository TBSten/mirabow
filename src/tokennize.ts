import { getConfig } from "./config";
import { esc } from "./helper/escape";
import { Tokens } from "./types";

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
export const getIsKeywords = () => sortKeywords(_isKeywords.values())
export const addIsKeywords = (isKeywords: Keyword) => _isKeywords.add(isKeywords)
export const hitIsKeyword = (keyword: Keyword, target: string) => {
    const regex = typeof keyword === "string" ? esc(keyword) : keyword.source
    const ignoreCase = getConfig().ignoreCase
    return !!target.match(new RegExp(`^${regex}$`, ignoreCase ? "i" : ""))
}

export const tokennize = (source: string, keywords: Keyword[] = getIsKeywords()): Tokens => {
    const escKeywords = sortKeywords(
        (keywords.map(s => typeof s === "string" ? esc(s) : s))
    ).map(keyword => keyword instanceof RegExp ? keyword.source : keyword)
    const ignoreString = getConfig().ignoreString
    const ignoreCase = getConfig().ignoreCase
    const regex = `(${escKeywords.join("|")})|${ignoreString}+`
    const ans: string[] = source
        .split(new RegExp(regex, ignoreCase ? "i" : ""))
        .filter(s => s && !s.match(new RegExp(`^${ignoreString}*$`)))
    return ans
}

