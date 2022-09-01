import { getConfig } from '../config';
import { perfectMatch, startWith } from "../helper/regex";
import { esc, len } from '../helper/string';
import { Matcher, Token } from "../type";

export const is = (
    pattern: string | RegExp,
): Matcher<"is"> => {
    const patternRegex = () => {
        const regex = typeof pattern === "string" ?
            new RegExp(esc(pattern), getConfig().ignoreCase ? "i" : "") :
            pattern
        return new RegExp(`(${regex.source})`, regex.flags)
    }

    return {
        type: "is",
        debug: `"${pattern}"`,
        lex(input) {
            // let regex: RegExp = startWith(patternRegex())
            const regex = patternRegex()
            // regex = new RegExp(`^(${regex.source})`, regex.flags)
            const text = input.text.slice(input.start)
            const regexRes = text.match(startWith(regex))
            if (regexRes) {
                const matchedString = regexRes[0]
                const start = input.start
                const end = start + len(matchedString)
                const token: Token = {
                    text: matchedString,
                    start,
                    end,
                }
                return {
                    ok: true,
                    end,
                    tokens: [
                        token
                    ],
                }
            }
            // console.error(
            //     "is failed lex",
            //     "expect", regex,
            //     "recv", `"${text}"`,
            // )
            return {
                ok: false,
                tokens: [],
                end: input.start,
            }
        },
        exec(input) {
            let regex = perfectMatch(patternRegex())
            const nextToken = input.getNextToken()
            if (nextToken && regex.exec(nextToken.text)) {
                return {
                    ok: true,
                    capture: {},
                    match: [nextToken],
                    result: null,
                }
            }
            return {
                ok: false,
                capture: {},
                match: [],
                result: null,
            }
        },
    }
}

