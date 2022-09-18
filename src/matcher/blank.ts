import { Matcher } from "../type";
import { is } from "./is";

export const blank = (): Matcher<"is"> => {
    // return {
    //     debug: `(blank)`,
    //     type: `blank`,
    //     lex(input) {
    //         return {
    //             ok: true,
    //             tokens: tokens(input.raw, []),
    //             end: input.start,
    //         }
    //     },
    //     exec(input) {
    //         return {
    //             ok: true,
    //             capture: {},
    //             match: tokens(input.getRaw(), []),
    //             raw: input.getRaw(),
    //         }
    //     },
    // }
    return is("")
}
