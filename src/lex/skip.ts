import { getConfig } from "../config";

export function skipIgnoreString(src: string) {
    const ignore = getConfig().ignoreString
    let idx = 0
    for (let char of [...src]) {
        if (char.match(ignore)) {
            idx++
        } else {
            break
        }
    }
    return idx
}

