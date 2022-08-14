import { LexOutput } from "./types"


export const errors = {
    executor: {
        cannotFind: "can not find MatcherExecutor",
    },
    tokennize: {
        fail: (lexOut: LexOutput) => `failed tokennize . lex output:${JSON.stringify(lexOut)}`,
        missing: (lexOut: LexOutput) => `missing input . lexer could not read through the input . lex output:${JSON.stringify(lexOut)}`,
    },
    matcher: {
        define: `define matcher is not prepared . prease call this matcher's prepare`,
        output: {
            capture: {
                tokens: (capName: string, resv: unknown) => `capture ${capName} must be tokens , but ${resv}`,
                arrayScope: (capName: string, resv: unknown) => `capture ${capName} must be arrayScope , but ${resv}`,
            },
            tree: "MatcherOutput.tree must be Array",
        }
    },
    notImplement: "not implement error . An unexpected error occurred",
} as const

class MirabowError extends Error {
    constructor(reason: string) {
        super(reason)
    }
}

export const throwMirabowError = (reasonSelector: (e: typeof errors) => string): never => {
    throw new MirabowError(reasonSelector(errors))
}
