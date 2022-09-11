import { } from "./matcher/is"
import { Token, Tokens } from "./type"

export const token = (text: string, start = 0): Token => {
    return {
        text,
        start,
        end: start,
    }
}
export const tokens = (rawText: string, tokens: Token[]): Tokens => {
    if (tokens.length <= 0) {
        return {
            text() {
                return ""
            },
            start: 0,
            end: 0,
            base: tokens,
        }
    }
    return {
        text(): string {
            // return this.base.map(token => token.text).join(joiner)
            return rawText.substring(this.start, this.end)
        },
        get start(): number {
            return this.base[0].start
        },
        get end(): number {
            return this.base[this.base.length - 1].end
        },
        base: tokens,
    }
}
export const joinTokens = (rawText: string, _tokens1: Token[] | Tokens, _tokens2: Token[] | Tokens): Tokens => {
    const tokens1 = _tokens1 instanceof Array ? _tokens1 : _tokens1.base
    const tokens2 = _tokens2 instanceof Array ? _tokens2 : _tokens2.base
    return tokens(rawText, [...tokens1, ...tokens2])
}
export const notImplement = (msg = "something invalid"): never => {
    throw new Error(msg)
}
