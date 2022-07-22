import { tokennize } from "./tokennize";
import { Hook, Matcher, ToMatcherArg } from "./types";
import { execMatcher, toMatcher } from "./util";

// export const execute = <R>(matcher: Matcher<R>, src: string) => {
//     const tokens = tokennize(src)
//     return {
//         ...execMatcher(matcher, tokens),
//         tokens,
//     }
// }

export class MatcherExecutor<R = undefined>{
    matcher: Matcher<R>
    _hooks: Record<string, Hook<any>> = {}
    constructor(...matcher: ToMatcherArg<R>[]) {
        this.matcher = toMatcher(matcher)
    }
    addHook(hookName: string, hook: Hook<R>) {
        this._hooks[hookName] = hook
    }
    addHooks(hooks: Record<string, Hook<R>>) {
        Object.entries(hooks).forEach(([hookName, hook]) => {
            this.addHook(hookName, hook)
        })
    }
    execute(src: string) {
        const tokens = tokennize(src)
        return {
            ...execMatcher(this.matcher, tokens),
            tokens,
        }
    }
}
