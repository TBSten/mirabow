import { MirabowError } from "./error/MirabowError";
import { notImplementTokenizeError } from "./error/tokenize";
import { MatcherInput, MatcherOutput, SomeMatcher } from "./type";
import { tokens } from "./util";

export class MatcherExecutor {
    matcher: SomeMatcher
    constructor(matcher: SomeMatcher) {
        this.matcher = matcher
    }
    lex(text: string) {
        const errors: unknown[] = []
        try {
            const ans = this.matcher.lex({
                start: 0,
                text,
                raw: text,
            })
            if (!ans.ok || errors.length > 0) {
                return notImplementTokenizeError(`${text} tokenize with ${this.matcher.debug} failed`)
            }
            return ans.tokens
        } catch (e) {
            errors.push(e)
            return tokens(text, [])
        }
    }
    execute(text: string): MatcherOutput {
        try {
            const tokens = this.lex(text)
            let index = 0
            const input: MatcherInput = {
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
            }
            const execOut = this.matcher.exec(input)
            return execOut
        } catch (e) {
            return {
                raw: text,
                ok: false,
                capture: {},
                match: tokens(text, []),
                errors: [new MirabowError({
                    reason: e,
                    when: "exec",  //lexかもしれない
                })],
            }
        }

    }
}
export function execute(matcher: SomeMatcher, text: string) {
    return new MatcherExecutor(matcher).execute(text)
}