import { isCaptureNode, isScope, isToken, isTokens, Token, Tokens } from "../src"

const example = {
    token: "a" as Token,
    tokens: ["a", "b"] as Tokens,
    scope: {
        "cap": { tokens: [["a"]] },
    }
} as const

test("Token type guard", () => {
    expect(isToken(example.token))
        .toBe(true)
    expect(isToken(example.tokens))
        .toBe(false)
    expect(isToken(example.scope))
        .toBe(false)

    expect(isTokens(example.tokens))
        .toBe(true)
    expect(isTokens(example.token))
        .toBe(false)
    expect(isTokens(example.scope))
        .toBe(false)
})

test("Scope type guard", () => {
    expect(isScope(example.scope))
        .toBe(true)
    expect(isScope(example.token))
        .toBe(false)
    expect(isScope(example.tokens))
        .toBe(false)
})

test("CaptureNode type guard", () => {
    expect(isCaptureNode([example.tokens, example.tokens]))
        .toBe(true)
    expect(isCaptureNode([example.scope, example.scope]))
        .toBe(true)
    expect(isCaptureNode(example.scope))
        .toBe(true)
    expect(isCaptureNode(example.tokens))
        .toBe(false)
    expect(isCaptureNode(example.token))
        .toBe(false)
})
