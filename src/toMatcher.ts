
import { group } from "./matcher/group"
import { is } from "./matcher/is"
import { Matcher, MatcherLike } from "./type"

export const toMatcher = (
    ...matcherLikes: MatcherLike[]
): Matcher<string> => {
    if (matcherLikes.length === 1) {
        const like = matcherLikes[0]
        if (typeof like === "string" || like instanceof RegExp) {
            return is(like)
        } else if (like instanceof Array) {
            return group(...like)
        } else {
            return like
        }
    } else {
        return group(...matcherLikes)
    }
}
