export const notImplementExecError = (msg = "executing matcher , something invalid"): never => {
    throw new Error(msg)
}
