import { LexOutput } from "./types"

export type MirabowErrorDetail = string | { detail: string, constructor: typeof MirabowError }
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

type MirabowErrorType = "unknown" | "tokennize" | "execute"
class MirabowError extends Error {
    type: MirabowErrorType
    constructor(reason: string, type: MirabowErrorType = "execute") {
        super(reason)
        this.type = type
    }
}

export const throwMirabowError = (reasonSelector: (e: typeof errors) => MirabowErrorDetail): never => {
    const detail = reasonSelector(errors)
    if (typeof detail === "string") {
        throw new MirabowError(detail)
    } else {
        throw new detail.constructor(detail.detail)
    }
}

