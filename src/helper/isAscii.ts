import { throwMirabowError } from "../error"

export function isAscii(char: string) {
    if ([...char].length !== 1) {
        return throwMirabowError(e => e.notImplement)
    }
    return !!char.match(/^[\x00-\x7e]*$/)
}