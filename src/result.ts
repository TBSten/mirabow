import { Hook, MatcherOutput } from "./types";

export const resultHook = <R>(selector: (out: MatcherOutput) => R): Hook => {
    return (out) => {
        const ans = selector(out)
        out.result = [ans]
    }
}
