import { Matcher } from "../type";
import { tokens } from "../util";

export const blank = (): Matcher<"blank"> => {
    return {
        debug: `(blank)`,
        type: `blank`,
        lex(input) {
            return {
                ok: true,
                tokens: tokens(input.raw, []),
                end: input.start,
            }
        },
        exec(input) {
            return {
                ok: true,
                capture: {},
                match: tokens(input.getRaw(), []),
                raw: input.getRaw(),
            }
        },
    }
}
