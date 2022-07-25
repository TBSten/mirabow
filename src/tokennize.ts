import { getConfig } from "./config"
import { esc } from "./helper/escape"
import { Tokens } from "./types"

const _isKeywords = new Set<string>()
export const getIsKeywords = () => Array.from(_isKeywords.values()).sort((a, b) => b.length - a.length)
export const addIsKeywords = (isKeywords: string) => _isKeywords.add(isKeywords)

export const tokennize = (source: string, keywords: string[] = Array.from(_isKeywords)): Tokens => {
    const escKeywords = keywords.map(s => esc(s)).sort((a, b) => b.length - a.length)
    const ignoreString = getConfig().ignoreString
    const ans: string[] = source
        .split(new RegExp(`(${escKeywords.join("|")})|${ignoreString}+`, "i"))
        .filter(s => s && !s.match(new RegExp(`^${ignoreString}*$`)))
    return ans
}

