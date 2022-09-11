import { inspect } from "util";
import { Token } from "../src";
import { tokens } from "../src/util";

export const lines = (...lines: string[]) => lines.join(" ")
export const i = (...args: any[]) => {
    args = args.map(arg => inspect(arg, { depth: 100, colors: true, breakLength: 80 }))
    console.log(...args);
};

export const testTokens = (rawText: string, token: Token[]) => {
    // return { ...tokens(token), text: expect.anything() }
    const ans = tokens(rawText, token)
    ans.text = expect.anything()
    return ans
}
