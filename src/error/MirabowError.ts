export class MirabowError<Reason extends string | unknown = unknown> extends Error {
    childrenErrors: MirabowError<unknown>[]
    reason: Reason
    when: "lex" | "exec"
    constructor({ reason, when, childrenErrors = [], }: {
        reason: Reason
        when: "lex" | "exec"
        childrenErrors?: MirabowError<unknown>[]
    }) {
        super()
        this.reason = reason
        this.when = when
        this.childrenErrors = childrenErrors
    }
}
