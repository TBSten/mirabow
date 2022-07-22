import { any, capture, def, define, list, MatcherExecutor, opt, optional, or, ref, repeat, setConfig, toMatcher } from "../src"

test("is", () => {
    const matcher = toMatcher("a")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("a").isOk)
        .toBe(true)
})

test("any", () => {
    const matcher = toMatcher("a", any(), "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("ac").isOk)
        .toBe(false)
    expect(executor.execute("abc").isOk)
        .toBe(true)
})

test("group", () => {
    const matcher = toMatcher("a", "b", "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abc").isOk)
        .toBe(true)
})

test("or", () => {
    const matcher = toMatcher("a", or("b", "B"), "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abc").isOk)
        .toBe(true)
    expect(executor.execute("aBc").isOk)
        .toBe(true)
})

test("capture", () => {
    const matcher = toMatcher("a", capture("test", any()), "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abc").isOk)
        .toBe(true)
    expect(executor.execute("abc").capture.test)
        .toEqual([["b"]])
})
test("repeat", () => {
    const matcher = toMatcher("a", repeat("b", any(), "d"), "e")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abcdbdde").isOk)
        .toBe(true)
    expect(executor.execute("abcdbde").isOk)
        .toBe(false)
})

test("optional", () => {
    const matcher = toMatcher("a", optional("b", "c"), "d")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("ad").isOk)
        .toBe(true)
    expect(executor.execute("abcd").isOk)
        .toBe(true)
    expect(executor.execute("abd").isOk)
        .toBe(false)
    expect(executor.execute("acd").isOk)
        .toBe(false)
})

test("list", () => {
    const matcher = toMatcher("(", list(or("a", "b", "c"), "-"), ")")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("(a-b-c)").isOk)
        .toBe(true)
    expect(executor.execute("(a-b-c-)").isOk)
        .toBe(false)
})
test("define-reference", () => {
    define("bin")(repeat(or("0", "1")))
    const matcher = toMatcher(ref("bin"), "+", ref("bin"))
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("01+10").isOk)
        .toBe(true)
    expect(executor.execute("011+010").isOk)
        .toBe(true)
})

test("tree", () => {
    setConfig({ tree: true })
    const executor = new MatcherExecutor(opt(def("id-a")("a")), def("id-rep")(repeat(def("id-grp")(["b", "c"]), "d")), "e")
    executor.addHook("id-a", (out) => {
        console.log("id-a hook", out);
    })
    const out = executor.execute("bcdbcde")
    expect(out.isOk)
        .toBe(true)
    expect(out.tree)
        .toEqual(
            [null, [[["b", "c"], "d"], [["b", "c"], "d"]], "e"]
        )
})

