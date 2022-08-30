import { toMatcher } from "../toMatcher";
import { DefinedMatcher, Matcher, MatcherLike } from "../type";

export const define = (
    ..._matcher: [() => MatcherLike] | MatcherLike[]
): DefinedMatcher => {
    const childMatcher: Matcher<string> | null = null
    const getChildMatcher = () => {
        if (childMatcher) return childMatcher
        return toMatcher(
            _matcher[0] instanceof Function ?
                _matcher[0]() :
                (_matcher as MatcherLike)
        )
    }
    const definedMatcher: DefinedMatcher = {
        type: "define",
        debug: `<defined>`,
        hooks: [],
        lex(input) {
            return getChildMatcher().lex(input)
        },
        exec(input) {
            const out = getChildMatcher().exec(input)
            if (!out.ok) {
                return out
            }
            definedMatcher.hooks.forEach(hook => hook(out))
            return out
        },
    }
    return definedMatcher
}
