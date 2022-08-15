import { throwMirabowError } from "./error";
import { tokennize } from "./tokennize";
import { ExecuteOutput, Hook, Matcher, MatcherLike, Tokens } from "./types";
import { execMatcher, prepareMatcher, toMatcher } from "./util";

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
    constructor(...matcher: MatcherLike[]) {
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
    execute(src: string): ExecuteOutput {
        let tokens: Tokens | null = null;
        try {
            _setCurrentExecutor(this)
            prepareMatcher(this.matcher)
            tokens = tokennize(src, this.matcher)
            const ans = {
                ...execMatcher(this.matcher, tokens),
                tokens,
                errors: [] as unknown[],
            }
            return ans
        } catch (e) {
            return {
                isOk: false,
                tokens: tokens ? tokens : [],
                capture: {},
                match: [],
                result: [],
                tree: [],
                errors: [e],
            }
        } finally {
            _resetCurrentExecutor()
        }
    }
}

export const execute = (
    matcher: MatcherLike,
    src: string,
    option?: Partial<{ hooks: Record<string, Hook> }>,
) => {
    const hooks = option?.hooks ?? {}
    const executor = new MatcherExecutor(matcher)
    executor.addHooks(hooks)
    const result = executor.execute(src)
    return result
}
