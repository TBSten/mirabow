import { notImplementTokenizeError } from "./error/tokenize";
import { Matcher, MatcherOutput } from "./type";

export class MatcherExecutor<R> {
    matcher: Matcher<string, R>
    constructor(matcher: Matcher<string, R>) {
        this.matcher = matcher
    }
    lex(text: string) {
        const ans = this.matcher.lex({
            start: 0,
            text,
        })
        if (!ans.ok) {
            return notImplementTokenizeError(`${text} tokenize with ${this.matcher.debug} failed`)
        }
        return ans.tokens
    }
    execute(text: string): MatcherOutput<R> {
        try {
            const tokens = this.lex(text)
            let index = 0
            const execOut = this.matcher.exec({
                getIndex() {
                    return index
                },
                hasNext() {
                    return index < tokens.length
                },
                setIndex(idx) {
                    index = idx
                },
                getNextToken() {
                    const ans = tokens[index]
                    index++
                    return ans
                },
            })
            return execOut
        } catch (e) {
            return {
                ok: false,
                match: [],
                capture: {},
                result: null,
            }
        }

    }
}
export function execute<R>(matcher: Matcher<string, R>, text: string) {
    return new MatcherExecutor(matcher).execute(text)
}