import { tokennize } from "./tokennize";
import { Matcher } from "./types";
import { execMatcher } from "./util";

export const execute = (matcher: Matcher, src: string) => {
    const tokens = tokennize(src)
    return execMatcher(matcher, tokens)
}

