import { getConfig } from "../config";
import { LexerInput } from "../type";

export function skipIgnoreString(input: LexerInput) {
    const ignore = getConfig().ignoreString.source
    const text = input.text.slice(input.start)
    const res = text.match(new RegExp(`^(${ignore}*)`))
    const len = [...res?.[1] ?? ""].length
    return {
        end: input.start + len,
    }
}