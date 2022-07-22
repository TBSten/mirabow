import { Hook } from "./types"

const _hooks: Record<string, Hook> = {}
export const addHook = (name: string, hook: Hook) => {
    _hooks[name] = hook
}
export const addHooks = (hooks: Record<string, Hook>) => {
    Object.entries(hooks).forEach(([name, hook]) => {
        addHook(name, hook)
    })
}
export const _getAllHooks = () => _hooks
