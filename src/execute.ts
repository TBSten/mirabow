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
let _currentExecutor: MatcherExecutor<unknown> | null = null
export const _setCurrentExecutor = <R>(executor: MatcherExecutor<R>) => _currentExecutor = executor
export const _resetCurrentExecutor = () => _currentExecutor = null
export const _getCurrentExecutor = () => {
    if (_currentExecutor == null) throw new Error("can not find MatcherExecutor")
    return _currentExecutor
}


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
        _setCurrentExecutor(this)
        const tokens = tokennize(src)
        const ans = {
            ...execMatcher<R>(this.matcher, tokens),
            tokens,
        }
        _resetCurrentExecutor()
        return ans
    }
}

export const execute = <R>(
    matcher: ToMatcherArg<R>[],
    src: string,
    option?: Partial<{ hooks: Record<string, Hook<R>> }>,
) => {
    const hooks = option?.hooks ?? {}
    const executor = new MatcherExecutor(...matcher)
    executor.addHooks(hooks)
    const result = executor.execute(src)
    return result
}
