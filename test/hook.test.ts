import { addHook, cap, def, MatcherExecutor } from "../src"

test("hook", () => {
    const id = "test"
    const matcher = def(id)("a", cap("t"), "c")
    let tmp = ""    //tmpが更新されたらhookが呼ばれたことになる
    addHook(id, (out) => {
        tmp = out?.capture["t"].join("") ?? ""
    })
    const executor = new MatcherExecutor(matcher)
    const out = executor.execute(`abc`)
    // const out = execute(matcher, `abc`)
    expect(out.isOk)
        .toBe(true)
    expect(tmp)
        .toBe("b")
})

