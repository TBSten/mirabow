import { getConfig } from "../config";
import { isAscii } from "../helper/string";
import { Matcher } from "../type";
import { notImplement, tokens } from "../util";

export const identifier = (): Matcher<"identifier"> => {
    return {
        type: "identifier",
        debug: `<identifier>`,
        lex(input) {
            const ignore = getConfig().ignoreString
            const text = input.text.slice(input.start)
            let end = input.start
            let buf = ""

            for (let char of [...text]) {
                // charはidentifierとして不正な文字
                if (
                    ignore.exec(char) ||
                    !_isIdentifierChar(char)
                ) {
                    break
                }
                // charはidentifierとして有効な文字
                buf += char
                end++

            }
            if (buf === "") {
                // console.error("identifier failed lex",);
                return {
                    ok: false,
                    tokens: tokens(input.raw, []),
                    end,
                }
            }
            return {
                ok: true,
                tokens: tokens(input.raw, [
                    {
                        text: buf,
                        start: input.start,
                        end,
                    }
                ]),
                end,
            }
        },
        exec(input) {
            const nextToken = input.getNextToken()
            if (nextToken) {
                return {
                    ok: true,
                    capture: {},
                    match: tokens(input.getRaw(), [nextToken]),
                    raw: input.getRaw(),
                }
            }
            // console.error("identifier failed exec", "expect identifier", "recv", nextToken);
            return {
                ok: false,
                capture: {},
                match: tokens(input.getRaw(), []),
                raw: input.getRaw(),
            }
        },
    }
}
function _isIdentifierChar(str: string) {
    const strList = [...str]
    if (strList.length !== 1) {
        return notImplement("str must be one length string")
    }
    const char = strList[0]
    return (
        /[a-zA-Z0-9_$]/.test(char) ||
        !isAscii(char)
    )
}