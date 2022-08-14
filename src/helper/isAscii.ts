export function isAscii(char: string) {
    if ([...char].length !== 1) {
        throw new Error("not implement char must be 1 length")
    }
    return !!char.match(/^[\x00-\x7e]*$/)
}