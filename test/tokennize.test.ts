import { def, execute, is, li, or, tokennize } from "../src"

test("tokennize with string keywords", () => {
    or("a", "b", "c")
    expect(tokennize("abc"))
        .toEqual(["a", "b", "c"])
})

test("tokennize with regex keywords", () => {
    or("a", "b", is(/c/))
    expect(tokennize("abc"))
        .toEqual(["a", "b", "c"])
    or("a", "bb", is(/"xxx"/))
    expect(tokennize(`abb"xxx"dbb`))
        .toEqual(["a", "bb", `"xxx"`, "d", "bb"])
})
test("json tokennize", () => {
    const json = def(() => or(obj, arr))
    const value = def(() => or(
        str, num, bool, obj, arr,
    ))
    const str = def(is(/".*?"/))
    const num = def(is(/[0-9]+(.[0-9]+])?/))
    const bool = def(or("true", "false"))
    const obj = def(() => [
        "{",
        li(objEntry, ","),
        "}",
    ])
    const objEntry = def(
        str, ":", value
    )
    const arr = def(
        "[",
        li(value, ","),
        "]",
    )
    obj.hook = out => {
        console.log("obj hook", out.result);
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
    const jsonExample = `{"xxx":"this is example of json","yyy":123}`
    expect(tokennize(jsonExample))
        .toEqual([
            "{",
            `"xxx"`,
            ":",
            `"this is example of json"`,
            ",",
            `"yyy"`,
            ":",
            "123",
            "}",
        ])
    const out = execute(json, jsonExample)
    expect(out.isOk)
        .toEqual(true)
})

