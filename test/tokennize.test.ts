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

