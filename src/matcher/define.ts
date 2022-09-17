import { toMatcher } from "../toMatcher";
import { DefinedMatcher, MatcherLike, SomeMatcher } from "../type";

export const define = (
    ..._matcher: [() => MatcherLike] | MatcherLike[]
): DefinedMatcher => {
    let childMatcher: SomeMatcher | null = null
    const getChildMatcher = () => {
        if (childMatcher) return childMatcher
        childMatcher = toMatcher(
            _matcher[0] instanceof Function ?
                _matcher[0]() :
                (_matcher as MatcherLike)
        )
        return childMatcher
    }
    const definedMatcher: DefinedMatcher = {
        type: "define",
        get debug() {
            return childMatcher !== null ? `(${childMatcher.debug})` : `<defined>`
        },
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
