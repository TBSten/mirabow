import { is, or, tokennize } from "../src"

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
    // const str = is(/".*?"/)
    // const num = is(/[0-9]+(.[0-9]+])?/)
    // const bool = or("true", "false")
    // const obj = toMatcher(
    //     "{",
    //     li([str, ":", ref("value")], ","),
    //     "}",
    // )
    // const arr = toMatcher(
    //     "[",
    //     li(ref("value"), ","),
    //     "]",
    // )
    // def("value")(or(
    //     str, num, bool, obj, arr,
    // ))
    // expect(tokennize(`{"xxx":""}`))
    //     .toEqual([
    //         "{",
    //         `"xxx"`,
    //         ":",
    //         `""`,
    //         "}",
    //     ])
})

