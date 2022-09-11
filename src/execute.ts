import { notImplementTokenizeError } from "./error/tokenize";
import { MatcherOutput, SomeMatcher } from "./type";
import { tokens } from "./util";

export class MatcherExecutor {
    matcher: SomeMatcher
    constructor(matcher: SomeMatcher) {
        this.matcher = matcher
    }
    lex(text: string) {
        const ans = this.matcher.lex({
            start: 0,
            text,
            raw: text,
        })
        if (!ans.ok) {
            return notImplementTokenizeError(`${text} tokenize with ${this.matcher.debug} failed`)
        }
        return ans.tokens
    }
    execute(text: string): MatcherOutput {
        try {
            const tokens = this.lex(text)
            let index = 0
            const execOut = this.matcher.exec({
                getRaw() {
                    return text
                },
                getIndex() {
                    return index
                },
                hasNext() {
                    return index < tokens.base.length
                },
                setIndex(idx) {
                    index = idx
                },
                getNextToken() {
                    const ans = tokens.base[index]
                    index++
                    return ans
                },
            })
            return execOut
        } catch (e) {
            return {
                raw: text,
                ok: false,
                match: tokens(text, []),
                capture: {},
            }
        }

    }
}
export function execute(matcher: SomeMatcher, text: string) {
    return new MatcherExecutor(matcher).execute(text)
}