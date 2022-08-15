import { clearIsKeywords, def, execute, identifier, is, li, opt, or, prepareMatcher, re, repeat, setConfig, tokennize, toMatcher } from "../src"
test("tokennize with string keywords", () => {
    const m = re(or("a", "b", "c"))
    prepareMatcher(m)
    expect(tokennize("abc", m))
        .toEqual(["a", "b", "c"])
})

test("tokennize with regex keywords", () => {
    clearIsKeywords()
    let m = re(or("a", "b", is(/c/)))
    prepareMatcher(m)
    expect(tokennize("abc", m))
        .toEqual(["a", "b", "c"])
    m = re(or("a", "bb", is(/"xxx"/)))
    prepareMatcher(m)
    expect(tokennize(`abb"xxx"bb`, m))
        .toEqual(["a", "bb", `"xxx"`, "bb"])
})
test("json tokennize", () => {
    clearIsKeywords()
    setConfig({ ignoreString: /\s/ })
    const json = def(() => or(obj, arr))
    const value = def(() => or(
        str, num, bool, obj, arr,
    ))
    const str = def(is(/".*?"/))
    const num = def(is(/[0-9]+(\.[0-9]+])?/))
    const bool = def(or("true", "false"))
    const obj = def(() => [
        "{",
        opt(
            li(objEntry, ","),
        ),
        "}",
    ])
    const objEntry = def(
        str, ":", value
    )
    const arr = def(
        "[",
        opt(
            li(value, ","),
        ),
        "]",
    )
    obj.hook = out => {
        const ans: Record<string, unknown> = {}
        for (let i = 0; i < out.result.length; i += 2) {
            const key = out.result[i] as string
            const value = out.result[i + 1]
            ans[key] = value
        }
        return [ans]
    }
    objEntry.hook = out => {
        return [out.result[0], out.result[1]]
    }
    str.hook = out => [(out.match[0] as string)!.slice(1, -1)]
    num.hook = out => [parseFloat(out.match[0])]
    const jsonExample = `{
        "xxx":"this is example of json",
        "yyy":123,
        "zzz":true,
        "arr":[1,2]
    }`
    prepareMatcher(json)
    expect(tokennize(jsonExample, json))
        .toEqual([
            "{",
            ...[
                `"xxx"`,
                ":",
                `"this is example of json"`,
            ],
            ",",
            ...[
                `"yyy"`,
                ":",
                "123",
            ],
            ",",
            ...[
                `"zzz"`,
                ":",
                "true",
            ],
            ",",
            ...[
                `"arr"`,
                ":",
                "[",
                "1",
                ",",
                "2",
                "]",
            ],
            "}",
        ])
    const out = execute(json, jsonExample)
    expect(out.isOk)
        .toEqual(true)
})

test("prepare circular", () => {
    const exp = def(() => ["[", opt(term), "]"])
    const term = def(() => exp)
    prepareMatcher(exp)
    tokennize("[[[[[]]]]]", exp)
})


test("oreore tokennize", () => {
    const oreore = def(() => repeat([line, re(";")]))
    const line = def(() => or(
        defVar,
        defFun,
        callFun,
    ))
    const defVar = def(() => [
        opt("var"), varName, "=", calc,
    ])
    const defFun = def(() => [
        "fun", varName, "(", ")", "{",
        repeat(line),
        "}",
    ])
    const callFun = def(() => [
        varName, "(", ")"
    ])
    const varName = def(identifier())
    const calc = def(() => or(
        /[1-9][0-9]*/,
        varName,
    ))
    prepareMatcher(oreore)
    let program = `var x = 10; var abc = edf`.trim()
    let tokens = ["var", "x", "=", "10", ";", "var", "abc", "=", "edf",]
    expect(tokennize(program, oreore))
        .toEqual(tokens)
})

test("on fail tokennize", () => {
    setConfig({ tree: true })
    const matcher = toMatcher("create", "table", identifier())
    const out = execute(matcher, "create table tbl1()")
    expect(out.errors.length)
        .toBe(1)
})

