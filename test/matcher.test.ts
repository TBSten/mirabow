import { any, execute, optional, or, toMatcher } from "../src"

test("is", () => {
    const matcher = toMatcher("a")
    expect(execute(matcher, "a")?.isOk)
        .toBe(true)
})

test("any", () => {
    const matcher = toMatcher("a", any(), "c")
    expect(execute(matcher, "ac")?.isOk)
        .toBe(false)
    expect(execute(matcher, "abc")?.isOk)
        .toBe(true)
})

test("group", () => {
    const matcher = toMatcher("a", "b", "c")
    expect(execute(matcher, "abc")?.isOk)
        .toBe(true)
})

test("or", () => {
    const matcher = toMatcher("a", or("b", "B"), "c")
    expect(execute(matcher, "abc")?.isOk)
        .toBe(true)
    expect(execute(matcher, "aBc")?.isOk)
        .toBe(true)
})

test("capture", () => { })
test("repeat", () => { })

test("optional", () => {
    const matcher = toMatcher("a", optional("b", "c"), "d")
    expect(execute(matcher, "ad")?.isOk)
        .toBe(true)
    expect(execute(matcher, "abcd")?.isOk)
        .toBe(true)
    expect(execute(matcher, "abd")?.isOk)
        .toBe(false)
    expect(execute(matcher, "acd")?.isOk)
        .toBe(false)
})

test("list", () => { })
test("define-reference", () => { })
