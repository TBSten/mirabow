import { toMatcher } from "../toMatcher"
import { MatcherLike, SomeMatcher } from "../type"
import { group } from "./group"
import { repeat } from "./repeat"

export const list = (args: MatcherLike[] | MatcherLike, joiner: MatcherLike = ","): SomeMatcher => {
    if (!(args instanceof Array)) args = [args]
    const matchers = toMatcher(...args)
    const joinMatcher = toMatcher(joiner)
    const listMatcher = group(matchers, repeat(joinMatcher, matchers))
    return listMatcher
}
