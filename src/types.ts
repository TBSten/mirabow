export type Token = string
export type Tokens = Token[]
export type MatcherInput = {
    getNext(): Token | null
    setCursor(cursor: number): void
    getCursor(): number
    hasNext(): boolean
}
export type MatcherOutput<R = undefined> = {
    capture: Record<string, Tokens[]>
    match: Tokens
    result: R | undefined
}
export type Matcher = {
    type: string,
    debug: string,
    exec: (input: MatcherInput) => MatcherOutput | null
}
export type Hook = (output: MatcherOutput | null) => unknown
export type ToMatcherArgUnit = string | Matcher | ToMatcherArgUnit[]
export type ToMatcherArg = ToMatcherArgUnit | ToMatcherArgUnit[]

export type Config = {
    ignoreCase: boolean;
}