import { getConfig } from "../config";

export function skipIgnoreString(src: string) {
    const ignore = getConfig().ignoreString.source
    const res = src.match(new RegExp(`^((${ignore})*)`))
    const len = [...res?.[1] ?? ""].length
    return len
}

