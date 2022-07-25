export type Token = string
export function isToken(arg: any): arg is Token {
    return typeof arg === "string"
}
export type Tokens = Token[]
export function isTokens(arg: any): arg is Tokens {
    return (
        arg instanceof Array &&
        isToken(arg[0])
    )
}
export type MatcherInput = {
    getNext(): Token | null
    setCursor(cursor: number): void
    getCursor(): number
    hasNext(): boolean
}

export type Scope = {
    [key: string]: CaptureNode
}
export function isScope(arg: any): arg is Scope {
    return (
        typeof arg === "object" &&
        !isToken(arg) &&
        !isTokens(arg)
    )
}
export type CaptureNode =
    Tokens[] |
    Scope |     //scope
    Scope[]     //arrayScope
export function isCaptureNode(arg: any): arg is CaptureNode {
    return (
        (
            arg instanceof Array &&
            //arg is Tokens[] || Scope[]
            (
                isTokens(arg[0]) || // arg is Tokens[]
                isScope(arg[0])     // arg is Scope[]
            )
        ) ||
        isScope(arg)                // arg is Scope
    )
}
export type Capture = { [name: string]: CaptureNode }
export type TreeNode = Token | null | TreeNode[]
export type MatcherOutput<R> = {
    capture: Capture
    match: Tokens
    result: R | undefined
    isOk: boolean
    tree: TreeNode
}
export type Matcher<R> = {
    type: string,
    debug: string,
    exec: (input: MatcherInput) => MatcherOutput<R>
}
export type Hook<R> = (output: MatcherOutput<R> | null) => unknown
export type ToMatcherArgUnit<R> = string | Matcher<R> | ToMatcherArgUnit<R>[]
export type ToMatcherArg<R> = ToMatcherArgUnit<R> | ToMatcherArgUnit<R>[]

export type Config = {
    ignoreCase: boolean;
    tree: boolean;
    ignoreString: string;
}

export type MatcherFactory<Args extends Array<any>, R> = (...args: Args) => Matcher<R>
