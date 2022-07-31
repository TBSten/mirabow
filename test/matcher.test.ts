import { any, arrayScope, capture, def, execute, list, MatcherExecutor, opt, optional, or, repeat, scope, setConfig, token, toMatcher } from "../src"

test("is", () => {
    const matcher = toMatcher("a")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("a").isOk)
        .toBe(true)
})

test("any", () => {
    const matcher = toMatcher("x", any(), "z")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("xz").isOk)
        .toBe(false)
    expect(executor.execute("xxz").isOk)
        .toBe(false)
    expect(executor.execute("xyz").isOk)
        .toBe(true)
})

test("token", () => {
    const out = execute(["a", token(), "b"], `abb`)
    expect(out.isOk)
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
    const matcher = toMatcher("a", capture("test"), "c")
    const executor = new MatcherExecutor(matcher)
    const out = executor.execute("abc")
    expect(out.isOk)
        .toBe(true)
    expect(out.capture.test)
        .toEqual([["b"]])
})
test("repeat", () => {
    const matcher = toMatcher("a", repeat("b", token(), "d"), "e")
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
    const matcher = def(() =>
        [or(a, b), or("SUM", "AVG")]
    )
    const a = def(
        repeat(any(), ",")
    )
    const b = def(
        repeat("b")
    )
    a.hook = (out) => {
        return out.result.map(res => parseInt(res as string))
    }
    matcher.hook = (out) => {
        return [out.result.reduce<number>((ans, value) => ans + (value as number), 0)]
    }
    const out = execute(matcher, "1,2,3,SUM")
    expect(out.isOk)
        .toBe(true)
    expect(out.result[0])
        .toBe(6)
})

test("tree", () => {
    setConfig({ tree: true })
    const idA = def(() => "a")
    const idRep = def(() => repeat(idGrp, "d"))
    const idGrp = def(() => ["b", "c"])
    const executor = new MatcherExecutor(opt(idA), idRep, "e")
    executor.addHook("id-a", (out) => {
        console.log("id-a hook",);
    })
    const out = executor.execute("bcdbcde")
    expect(out.isOk)
        .toBe(true)
    expect(out.tree)
        .toEqual(
            [null, [[["b", "c"], "d"], [["b", "c"], "d"]], "e"]
        )
})
test("capture-scope", () => {
    const matcher = toMatcher(
        capture("cap-1", "a"),
        scope("scope-1")(
            capture("cap-2", "b"),
            scope("scope-2")(
                capture("cap-3", "c"),
                capture("cap-4", "d"),
            ),
            capture("cap-5", "e"),
        ),
        capture("cap-6", "f"),
    )
    const out = new MatcherExecutor(matcher).execute("abcdef")
    expect(out.capture)
        .toEqual({
            "cap-1": [["a"]],
            "scope-1": {
                "cap-2": [["b"]],
                "scope-2": {
                    "cap-3": [["c"]],
                    "cap-4": [["d"]]
                },
                "cap-5": [["e"]],
            },
            "cap-6": [["f"]],
        })
})
test("capture-scope-in-group", () => {
    const matcher = repeat(
        "(",
        arrayScope("ab-list")(repeat([
            capture("cap-ab", or("a", "b")),
            capture("cap-ab", or("a", "b")),
        ])
        ),
        ")",
    )
    const out = execute(matcher, "(ba)(aa)")
    expect(out.capture)
        .toEqual(expect.objectContaining({
            "ab-list": [
                {
                    "cap-ab": [["b"], ["a"]],
                },
                {
                    "cap-ab": [["a"], ["a"]],
                },
            ],
        }))
})

test("not", () => { })
test("anyKeyword", () => { })

test("is matcher in def", () => {
    const m1 = def(() =>
        ["N", "M", "L", m2]
    )
    const m2 = def(() =>
        ["N", "M", "L",]
    )
    const out = execute(m1, "NMLNML")
})

