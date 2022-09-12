
import { arrayScope, cap, capture, def, execute, identifier, li, MatcherOutput, numberLiteral, opt, or, repeat } from "../src";
import { i } from "./util";

type Detail<T extends string> = {}
type SelectDetail = Detail<"select"> & {
    select: string[]
    from: string[]
}
type InsertDetail = Detail<"insert"> & {
    tbl: string
    cols: string[]
    select?: SelectDetail
}

test("list result", () => {
    const name = def(() => [opt("not"), identifier()])
    const select = def(
        "select", li(capture("select", name), ","),
        "from", li(capture("from", name), ",")
    )
    const insert = def(
        "insert", "into",
        capture("tbl", name),
        "(",
        li(capture("cols", name), ","),
        ")",
        opt(select),
    )
    const stmt = def(or(select, insert,))
    const stmts = def(repeat(arrayScope("stmt")(stmt), repeat(";")))

    select.hooks.push((out) => {
        const select = out.capture["select"]?.tokens?.map(token => token.text(" "))
        const from = out.capture["from"]?.tokens?.map(token => token.text(""))
        const captureNode = {
            result: {
                select,
                from,
            } as SelectDetail,
        }
        out.capture["detail"] = captureNode
        out.capture["select"] = captureNode
    })
    insert.hooks.push((out) => {
        const tbl = out.capture["tbl"]?.tokens?.[0].text()
        const cols = out.capture["cols"]?.tokens?.map(token => token.text())
        const select = out.capture["select"]?.result
        const captureNode = {
            result: {
                tbl,
                cols,
                select,
            } as InsertDetail,
        }
        out.capture["detail"] = captureNode
        out.capture["insert"] = captureNode
    })

    let text: string
    let out: MatcherOutput
    text = `insert into tbl(col1,col2) select a from b  ;  insert into tbl(col1,col2)`
    out = execute(stmts, text)
    expect(out.ok).toBe(true)
    expect(out.capture.stmt?.arrayScope?.map(stmt => stmt.detail?.result))
        .toEqual([
            {
                tbl: "tbl",
                cols: ["col1", "col2"],
                select: {
                    select: ["a"],
                    from: ["b"],
                },
            },
            {
                tbl: "tbl",
                cols: ["col1", "col2"],
            },
        ])
})

test("program lang", () => {
    const val = def(cap("val-name", identifier()), or("<-", "<="), cap("val-num", numberLiteral))
    const print = def("print", cap("print-target", identifier()))
    // const line = def(or(print, val), repeat(";"))
    const line = def(or(val, print), repeat(";"))
    const program = def(repeat(line))

    const variables: Record<string, number> = {
        x: 123,
    }
    val.hooks.push(out => {
        const name = out.capture["val-name"]?.tokens?.[0].text()
        const num = out.capture["val-num"]?.tokens?.[0].text()
        i("val", name, num);
        if (name && num && parseFloat(num)) variables[name] = parseFloat(num)
    })
    print.hooks.push(out => {
        const target = out.capture["print-target"]?.tokens?.[0].text()
        i("print", target && variables[target])
    })

    const s = performance.now()
    const out = execute(program, `x <= 100 ; x <= 200 ; print x`)
    const e = performance.now()
    i("time", e - s, variables, out)

    expect(out.ok).toBe(true)

})
