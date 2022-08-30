import { } from "./matcher/is"
import { Token } from "./type"

export const token = (text: string, start = 0): Token => {
    return {
        text,
        start,
        end: start,
    }
}
export const notImplement = (msg = "something invalid"): never => {
    throw new Error(msg)
}
