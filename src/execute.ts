import { throwMirabowError } from "./error";
import { tokennize } from "./tokennize";
import { Hook, Matcher, ToMatcherArg } from "./types";
import { execMatcher, prepareMatcher, toMatcher } from "./util";

// export const execute = (matcher: Matcher, src: string) => {
//     const tokens = tokennize(src)
//     return {
//         ...execMatcher(matcher, tokens),
//         tokens,
//     }
// }
let _currentExecutor: MatcherExecutor | null = null
export const _setCurrentExecutor = (executor: MatcherExecutor) => _currentExecutor = executor
export const _resetCurrentExecutor = () => _currentExecutor = null
export const _getCurrentExecutor = () => {
    if (_currentExecutor == null) return throwMirabowError(e => e.executor.cannotFind)
    return _currentExecutor
}


export class MatcherExecutor {
    matcher: Matcher
    _hooks: Record<string, Hook> = {}
    constructor(...matcher: ToMatcherArg[]) {
        this.matcher = toMatcher(matcher)
    }
    addHook(hookName: string, hook: Hook) {
        this._hooks[hookName] = hook
    }
    addHooks(hooks: Record<string, Hook>) {
        Object.entries(hooks).forEach(([hookName, hook]) => {
            this.addHook(hookName, hook)
        })
    }
    execute(src: string) {
        try {
            _setCurrentExecutor(this)
            prepareMatcher(this.matcher)
            const tokens = tokennize(src, this.matcher)
            const ans = {
                ...execMatcher(this.matcher, tokens),
                tokens,
            }
            return ans
        } catch (e) {
            return {
                isOk: false,
                tokens: [],
                capture: {},
                match: [],
                result: [],
                tree: [],
            }
        } finally {
            _resetCurrentExecutor()
        }
    }
}

export const execute = (
    matcher: ToMatcherArg,
    src: string,
    option?: Partial<{ hooks: Record<string, Hook> }>,
) => {
    const hooks = option?.hooks ?? {}
    const executor = new MatcherExecutor(matcher)
    executor.addHooks(hooks)
    const result = executor.execute(src)
    return result
}
