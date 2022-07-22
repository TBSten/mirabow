import { Hook } from "./types"

const _hooks: Record<string, Hook<any>> = {}
export const addHook = <R>(name: string, hook: Hook<R>) => {
    _hooks[name] = hook
}
export const addHooks = <R>(hooks: Record<string, Hook<R>>) => {
    Object.entries(hooks).forEach(([name, hook]) => {
        addHook(name, hook)
    })
}
export const _getAllHooks = () => _hooks
