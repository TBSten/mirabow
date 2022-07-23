import { Capture, Tokens } from "./types";

export const getCapture = (capture: Capture, name: string) => {
    if (!capture) return null
    const ans = capture[name]
    return ans
}
export const getCaptureTokens = (capture: Capture, name: string, defaultTokens?: Tokens) => {
    const ans = getCapture(capture, name)
    if (!(ans instanceof Array)) {
        if (defaultTokens) {
            return defaultTokens
        }
        throw new Error(`captured ${name} must be Token[] but ${ans}`)
    }
    return ans
}
export const isCaptureTokens = (capture: Capture, name: string) => {
    const ans = getCapture(capture, name)
    return ans instanceof Array
}

