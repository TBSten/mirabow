import { _getCurrentExecutor } from "./execute"
import { Hook } from "./types"

// const _hooks: Record<string, Hook<any>> = {}

export const _addHook = <R>(name: string, hook: Hook<R>) => {
    _getCurrentExecutor()._hooks[name] = hook
}
export const _addHooks = <R>(hooks: Record<string, Hook<R>>) => {
    Object.entries(hooks).forEach(([name, hook]) => {
        _addHook(name, hook)
    })
}
export const _getAllHooks = () => _getCurrentExecutor()._hooks
