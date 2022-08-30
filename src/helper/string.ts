import { notImplement } from "../util"

export function isAscii(char: string) {
    if ([...char].length !== 1) {
        return notImplement("char must be one length string")
    }
    return !!char.match(/^[\x00-\x7e]*$/)
}
export const len = (text: string): number => {
    return [...text].length
}
export function esc(str: string) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}
