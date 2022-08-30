export const notImplementTokenizeError = (msg = `tokenize , something invalid`): never => {
    throw new Error(msg)
}
