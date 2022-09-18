import { MirabowError } from "./error/MirabowError"

export type Token = {
    text: string,
    start: number,
    end: number,
}
export type Tokens = {
    text(joiner?: string): string
    start: number
    end: number
    base: Token[]
}

export type LexerInput = {
    text: string,
    start: number,
    raw: string
}
export type LexerOutput = {
    ok: boolean
    tokens: Tokens,
    end: number,
    errors: MirabowError[],
}
export type Lexer = (input: LexerInput) => LexerOutput

export type MatcherInput = {
    getRaw(): string
    getNextToken(): Token | undefined
    getIndex(): number
    setIndex(idx: number): void
    hasNext(): boolean
}
export type ResultType = unknown
export type MatcherOutput = {
    raw: string
    ok: boolean
    match: Tokens
    capture: CaptureScope
    errors: MirabowError[]
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
export type MatcherLikeUnit = string | RegExp | SomeMatcher
export type MatcherLike = MatcherLikeUnit | MatcherLikeUnit[]
export type SomeMatcher = Matcher<string>

export type CaptureScope = {
    [key: string]: CaptureNode | undefined
}
export type CaptureNode = {
    tokens?: Tokens[]
    scope?: CaptureScope
    arrayScope?: CaptureScope[]
    result?: ResultType
}
export type Hook = (out: MatcherOutput) => void


export type Config = {
    ignoreCase: boolean
    ignoreString: RegExp
}
