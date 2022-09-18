import { arrayScope, cap, capture, CaptureScope, def, execute, identifier, list, MatcherExecutor, optional, or, repeat, scope, setConfig, toMatcher } from "../src"
import { blank } from "../src/matcher/blank"
import { testTokens } from "./util"

beforeEach(() => {
    setConfig({
        ignoreCase: true,
        ignoreString: /\s/
    })
})


test("is", () => {
    const text = "a"
    const matcher = toMatcher("a")
    let res = execute(matcher, text)
    expect(res.ok)
        .toBe(true)
    expect(res.match)
        .toEqual(testTokens(text, [{ text: "a", start: 0, end: 1 }]))
    res = execute(matcher, "A")
    expect(res.ok)
        .toBe(true)
    expect(res.match)
        .toEqual(testTokens(text, [{ text: "A", start: 0, end: 1 }]))
})

test("group", () => {
    const matcher = toMatcher("a", "b", "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abc").ok)
        .toBe(true)
})

test("or", () => {
    setConfig({ ignoreCase: true })
    const matcher = toMatcher("a", or("b", "B"), "c")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abc").ok)
        .toBe(true)
    expect(executor.execute("aBc").ok)
        .toBe(true)
})

test("capture", () => {
    const text = "a b c"
    const matcher = toMatcher("a", capture("test", "b"), "c")
    const executor = new MatcherExecutor(matcher)
    const out = executor.execute(text)
    expect(out.ok)
        .toBe(true)
    expect(out.capture.test?.tokens)
        .toEqual([testTokens(text, [{ text: "b", start: 2, end: 3, }])])
})
test("repeat", () => {
    const matcher = toMatcher("a", repeat("b", or("c", "d"), "d"), "e")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("abcdbdde").ok)
        .toBe(true)
    expect(executor.execute("abcdbde").ok)
        .toBe(false)
})

test("optional", () => {
    const matcher = toMatcher("a", optional("b", "c"), "d")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("ad").ok)
        .toBe(true)
    expect(executor.execute("abcd").ok)
        .toBe(true)
    expect(executor.execute("abd").ok)
        .toBe(false)
    expect(executor.execute("acd").ok)
        .toBe(false)
})

test("list", () => {
    const matcher = toMatcher("(", list(or("a", "b", "c"), "-"), ")")
    const executor = new MatcherExecutor(matcher)
    expect(executor.execute("(a-b-c)").ok)
        .toBe(true)
    expect(executor.execute("(a-b-c-)").ok)
        .toBe(false)
})
test("define-reference", () => {
    const matcher = def(() =>
        [or(a, b), or("SUM", "AVG")]
    )
    const a = def(() =>
        repeat(a_num, ",")
    )
    const a_num = def(/[0-9]+/)
    const b = def(
        repeat("b")
    )
    // a_num.hook = (out) => {
    //     return [parseFloat(out.match[0])]
    // }
    // a.hook = (out) => {
    //     return out.result.map(res => parseInt(res as string))
    // }
    // matcher.hook = (out) => {
    //     return [out.result.reduce<number>((ans, value) => ans + (value as number), 0)]
    // }
    const out = execute(matcher, "1,2,3,SUM")
    expect(out.ok)
        .toBe(true)
    // expect(out.result[0])
    //     .toBe(6)
})

// test("tree", () => {
//     setConfig({ tree: true })
//     const idA = def(() => "a")
//     const idRep = def(() => repeat(idGrp, "d"))
//     const idGrp = def(() => ["b", "c"])
//     const executor = new MatcherExecutor(opt(idA), idRep, "e")
//     executor.addHook("id-a", (out) => {
//         console.log("id-a hook",);
//     })
//     const out = executor.execute("bcdbcde")
//     expect(out.ok)
//         .toBe(true)
//     expect(out.tree)
//         .toEqual(
//             [null, [[["b", "c"], "d"], [["b", "c"], "d"]], "e"]
//         )
// })
test("capture-scope", () => {
    const text = "abcdef"
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
    const out = new MatcherExecutor(matcher).execute(text)
    expect(out.ok).toBe(true)
    expect(out.capture)
        .toEqual<CaptureScope>({
            "cap-1": { tokens: [testTokens(text, [{ text: "a", start: 0, end: 1 }])] },
            "scope-1": {
                scope: {
                    "cap-2": { tokens: [testTokens(text, [{ text: "b", start: 1, end: 2, }])] },
                    "scope-2": {
                        scope: {
                            "cap-3": { tokens: [testTokens(text, [{ text: "c", start: 2, end: 3, }])] },
                            "cap-4": { tokens: [testTokens(text, [{ text: "d", start: 3, end: 4, }])] }
                        }
                    },
                    "cap-5": { tokens: [testTokens(text, [{ text: "e", start: 4, end: 5, }])] }
                },
            },
            "cap-6": { tokens: [testTokens(text, [{ text: "f", start: 5, end: 6, }])] },
        })
})
test("capture-scope-in-group", () => {
    const text = "(ba)(aa)"
    const matcher = repeat(
        "(",
        arrayScope("ab-list")(repeat([
            capture("cap-ab", or("a", "b")),
            capture("cap-ab", or("a", "b")),
        ])
        ),
        ")",
    )
    const out = execute(matcher, text)
    expect(out.capture)
        .toEqual(expect.objectContaining({
            "ab-list": {
                arrayScope: [
                    {
                        "cap-ab": {
                            tokens: [
                                testTokens(text, [{ text: "b", start: 1, end: 2 }]),
                                testTokens(text, [{ text: "a", start: 2, end: 3 }]),
                            ]
                        },
                    },
                    {
                        "cap-ab": {
                            tokens: [
                                testTokens(text, [{ text: "a", start: 5, end: 6 }]),
                                testTokens(text, [{ text: "a", start: 6, end: 7 }]),
                            ]
                        },
                    },
                ]
            },
        } as CaptureScope))
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
test("duplicate CaptureNode name", () => {
    const condition = def(() => [identifier(), or("=", "<>"), identifier()])
    const m = def(() => [
        list(
            cap("or-conditions", arrayScope("or-conditions")(list(
                cap("and-conditions", condition)
                , "and"
            )))
            , "or"
        )
    ])
    const out = execute(m, `a = b or c <> d and e = f`)
    expect(out.ok)
        .toBe(true)
})

test("repeatable capture", () => {
    const m = def(repeat(capture("num", /[0-9]/)))
    const out = execute(m, `98765`)
    expect(out.capture["num"]?.tokens?.map(num => num.text()))
        .toEqual([
            "9", "8", "7", "6", "5",
        ])
})

test("blank", () => {
    const m1 = def(blank(), "select", blank(), "from", blank(),)
    const out1 = execute(m1, `select from`)
    expect(out1.ok)
        .toBe(true)
})

