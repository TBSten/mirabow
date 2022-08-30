import { toMatcher } from "../toMatcher"
import { Matcher, MatcherLike } from "../type"
import { group } from "./group"
import { repeat } from "./repeat"

export const list = <R>(args: MatcherLike<R>[] | MatcherLike<R>, joiner: MatcherLike<R> = ","): Matcher<string, R> => {
    if (!(args instanceof Array)) args = [args]
    const matchers = toMatcher(...args)
    const joinMatcher = toMatcher(joiner)
    const listMatcher = group(matchers, repeat(joinMatcher, matchers))
    return listMatcher
}
