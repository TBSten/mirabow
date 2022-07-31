import { clearIsKeywords, def, getIsKeywords, is, li, or, prepareMatcher } from "../src"

test("keywords", () => {
    clearIsKeywords()
    const m = def(() => [part1, part2])
    const part1 = def(() => or("a", "b"))
    const part2 = def(() => ["c", "d"])
    prepareMatcher(m)
    expect(getIsKeywords())
        .toEqual(["a", "b", "c", "d"])
})
test("prepare", () => {
    //prepare時にjson->arr->value->arr->
    const json = def(() => or(obj, arr))
    const value = def(() => or(
        str,
        num,
        // bool,
        // obj, 
        // arr,
    ))
    const str = def(is(/".*?"/))
    const num = def(is(/[0-9]+(.[0-9]+])?/))
    // const bool = def("m")(or("true", "false"))
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
    prepareMatcher(json)
})
