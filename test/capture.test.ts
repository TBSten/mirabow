import { arrayScope, cap, execute, li, opt, or, token } from "../src";

test("Capture Query", () => {
    const out = execute([
        li([
            arrayScope("cmds")(
                cap("cmd", or(
                    "get",
                    "put",
                    ["yarn", "add"]
                )),
                opt(cap("arg", token())),
            )
        ], ";"),
    ], "get -a; put -f; get -s; yarn add mirabow")
    expect(out.isOk)
        .toBe(true)
    // const cmds = new CQuery(out.capture)
    //     .arrayScope("cmds")
    //     .tokens("cmd")
    // expect(cmds)
    //     .toEqual([
    //         ["get"],
    //         ["put"],
    //         ["get"],
    //         ["yarn", "add"],
    //     ])
})


