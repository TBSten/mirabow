import { addHook, cap, def, execute } from "../src"

test("hook", () => {
    const id = "test"
    const matcher = def(id)("a", cap("t"), "c")
    let tmp = ""    //tmpが更新されたらhookが呼ばれたことになる
    addHook(id, (out) => {
        console.log("hook");
        tmp = out?.capture["t"].join("") ?? ""
    })
    const out = execute(matcher, `abc`)
    console.log(out);
    expect(out.isOk)
        .toBe(true)
    expect(tmp)
        .toBe("b")
})
