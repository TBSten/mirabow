export function esc(str: string) {
    return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}
