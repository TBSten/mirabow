import { inspect } from "util";

export const lines = (...lines: string[]) => lines.join(" ")
export const i = (...args: any[]) => {
    args = args.map(arg => inspect(arg, { depth: 100, colors: true }))
    console.log(...args)
};
