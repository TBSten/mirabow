
export type Token = {
    text: string,
    start: number,
    end: number,
}

export type LexerInput = {
    text: string,
    start: number,
}
export type LexerOutput = {
    ok: boolean
    tokens: Token[],
    end: number,
}
export type Lexer = (input: LexerInput) => LexerOutput

export type MatcherInput = {
    getNextToken(): Token | undefined
    getIndex(): number
    setIndex(idx: number): void
    hasNext(): boolean
}
export declare type ResultType = unknown
export type MatcherOutput = {
    ok: boolean
    match: Token[]
    capture: CaptureScope
    result: ResultType | null
}
export type BasicMatcher<T extends string> = {
    type: T
    debug: string
    lex: Lexer
    exec(input: MatcherInput): MatcherOutput
}
export type DefinedMatcher = BasicMatcher<"define"> & {
    hooks: Hook[]
}
export type Matcher<T extends string> = BasicMatcher<T> | DefinedMatcher
export type MatcherLikeUnit = string | RegExp | Matcher<string>
export type MatcherLike = MatcherLikeUnit | MatcherLikeUnit[]

export type CaptureScope = {
    [key: string]: CaptureNode | undefined
}
export type CaptureNode = {
    tokens?: Token[][]
    scope?: CaptureScope
    arrayScope?: CaptureScope[]
}
export type Hook = (out: MatcherOutput) => void


export type Config = {
    ignoreCase: boolean
    ignoreString: RegExp
}
