import { toMatcher } from "../toMatcher";
import { DefinedMatcher, Matcher, MatcherLike } from "../type";

export const define = <R>(
    ..._matcher: [() => MatcherLike<R>] | MatcherLike<R>[]
): DefinedMatcher<R> => {
    const childMatcher: Matcher<string, R> | null = null
    const getChildMatcher = () => {
        if (childMatcher) return childMatcher
        return toMatcher(
            _matcher[0] instanceof Function ?
                _matcher[0]() :
                (_matcher as MatcherLike<R>)
        )
    }
    const definedMatcher: DefinedMatcher<R> = {
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
