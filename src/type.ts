
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
export type MatcherOutput<R> = {
    ok: boolean
    match: Token[]
    capture: CaptureScope
    result: R | null
}
export type BasicMatcher<T extends string, R = null> = {
    type: T
    debug: string
    lex: Lexer
    exec(input: MatcherInput): MatcherOutput<R>
}
export type DefinedMatcher<R> = BasicMatcher<"define", R> & {
    hooks: Hook[]
}
export type Matcher<T extends string, R> = BasicMatcher<T, R> | DefinedMatcher<R>
export type MatcherLikeUnit<R> = string | RegExp | Matcher<string, R>
export type MatcherLike<R> = MatcherLikeUnit<R> | MatcherLikeUnit<R>[]

export type CaptureScope = {
    [key: string]: CaptureNode | undefined
}
export type CaptureNode = {
    tokens?: Token[][]
    scope?: CaptureScope
    arrayScope?: CaptureScope[]
}
export type Hook = <R>(out: MatcherOutput<R>) => void


export type Config = {
    ignoreCase: boolean
    ignoreString: RegExp
}
