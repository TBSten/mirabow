export type Token = string
export type Tokens = Token[]
export type MatcherInput = {
    getNext(): Token | null
    setCursor(cursor: number): void
    getCursor(): number
    hasNext(): boolean
}
// export type MatcherOutput<R = undefined> = {
export type MatcherOutput<R> = {
    capture: Record<string, Tokens[]>
    match: Tokens
    result: R | undefined
    isOk: boolean
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
}

export type MatcherFactory<Args extends Array<any>, R> = (...args: Args) => Matcher<R>
