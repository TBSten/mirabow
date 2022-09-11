
import { arrayScope, cap, capture, def, execute, identifier, li, MatcherOutput, numberLiteral, opt, or, repeat } from "../src";

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
    const line = def(or(val, print))
    const program = def(repeat(line, repeat(";")))

    const out = execute(program, `x <= 10 ; y <= 20 ; x <= 100 ; print x`)

    expect(out.ok).toBe(true)

})
