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
type CaptureNode = {
    tokens?: Tokens[],
    scope?: Scope,
    arrayScope?: Scope[],
}
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
export type Capture = Scope
export type TreeNode = Token | null | TreeNode[]
export type MatcherOutput = {
    capture: Capture
    match: Tokens
    result: unknown[]
    isOk: boolean
    tree: TreeNode
}
export type BaseMatcher = {
    type: string
    debug: string
    prepare?: () => void
    isPrepared: boolean
    exec: (input: MatcherInput) => MatcherOutput
}
export type DefinedMatcher = BaseMatcher & {
    type: "define"
    hook(out: MatcherOutput): unknown[] | void
}
export type Matcher = BaseMatcher | DefinedMatcher
export type Hook = (output: MatcherOutput | null) => unknown
export type ToMatcherArgUnit = string | RegExp | Matcher | ToMatcherArgUnit[]
export type ToMatcherArg = ToMatcherArgUnit | ToMatcherArgUnit[]

export type Config = {
    ignoreCase: boolean;
    tree: boolean;
    ignoreString: string;
}

export type MatcherFactory<Args extends Array<any>, R> = (...args: Args) => Matcher
