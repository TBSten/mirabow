import { esc } from "helper/escape"
import { Tokens } from "./types"

export const _isKeywords = new Set<string>()

export const tokennize = (source: string, keywords: string[] = Array.from(_isKeywords)): Tokens => {
    const escKeywords = keywords.map(s => esc(s)).sort((a, b) => b.length - a.length)
    const ans: string[] = source
        .split(new RegExp(`(${escKeywords.join("|")})|\\s+`, "i"))
        .filter(s => s && !s.match(new RegExp("^\\s*$")))
    return ans
}

