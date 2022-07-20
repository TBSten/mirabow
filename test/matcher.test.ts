import { any, capture, define, execute, list, optional, or, ref, repeat, toMatcher } from "../src"

test("is", () => {
    const matcher = toMatcher("a")
    expect(execute(matcher, "a").isOk)
        .toBe(true)
})

test("any", () => {
    const matcher = toMatcher("a", any(), "c")
    expect(execute(matcher, "ac").isOk)
        .toBe(false)
    expect(execute(matcher, "abc").isOk)
        .toBe(true)
})

test("group", () => {
    const matcher = toMatcher("a", "b", "c")
    expect(execute(matcher, "abc").isOk)
        .toBe(true)
})

test("or", () => {
    const matcher = toMatcher("a", or("b", "B"), "c")
    expect(execute(matcher, "abc").isOk)
        .toBe(true)
    expect(execute(matcher, "aBc").isOk)
        .toBe(true)
})

test("capture", () => {
    const matcher = toMatcher("a", capture("test", any()), "c")
    expect(execute(matcher, "abc").isOk)
        .toBe(true)
    expect(execute(matcher, "abc").capture.test)
        .toEqual([["b"]])
})
test("repeat", () => {
    const matcher = toMatcher("a", repeat("b", any(), "d"), "e")
    expect(execute(matcher, "abcdbdde").isOk)
        .toBe(true)
    expect(execute(matcher, "abcdbde").isOk)
        .toBe(false)
})

test("optional", () => {
    const matcher = toMatcher("a", optional("b", "c"), "d")
    expect(execute(matcher, "ad").isOk)
        .toBe(true)
    expect(execute(matcher, "abcd").isOk)
        .toBe(true)
    expect(execute(matcher, "abd").isOk)
        .toBe(false)
    expect(execute(matcher, "acd").isOk)
        .toBe(false)
})

test("list", () => {
    const matcher = toMatcher("(", list(or("a", "b", "c"), "-"), ")")
    expect(execute(matcher, "(a-b-c)").isOk)
        .toBe(true)
    expect(execute(matcher, "(a-b-c-)").isOk)
        .toBe(false)
})
test("define-reference", () => {
    define("bin")(repeat(or("0", "1")))
    const matcher = toMatcher(ref("bin"), "+", ref("bin"))
    expect(execute(matcher, "01+10").isOk)
        .toBe(true)
    expect(execute(matcher, "011+010").isOk)
        .toBe(true)
})
