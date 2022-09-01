import { getConfig } from "../config";
import { isAscii } from "../helper/string";
import { Matcher } from "../type";
import { notImplement } from "../util";

export const identifier = <R>(): Matcher<"identifier", R> => {
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
                    tokens: [],
                    end,
                }
            }
            return {
                ok: true,
                tokens: [
                    {
                        text: buf,
                        start: input.start,
                        end,
                    }
                ],
                end,
            }
        },
        exec(input) {
            const nextToken = input.getNextToken()
            if (nextToken) {
                return {
                    ok: true,
                    capture: {},
                    match: [nextToken],
                    result: null,
                }
            }
            // console.error("identifier failed exec", "expect identifier", "recv", nextToken);
            return {
                ok: false,
                capture: {},
                match: [],
                result: null,
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