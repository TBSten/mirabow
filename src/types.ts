export type Token = string
export type Tokens = Token[]
export type MatcherInput = {
    getNext(): Token | null
    setCursor(cursor: number): void
    getCursor(): number
    hasNext(): boolean
}

export type CaptureNode = Tokens | { [name: string]: CaptureNode }
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
}

export type MatcherFactory<Args extends Array<any>, R> = (...args: Args) => Matcher<R>
