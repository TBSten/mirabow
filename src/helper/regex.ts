export const startWith = (regex: RegExp) => new RegExp("^" + regex.source, regex.flags)
export const perfectMatch = (regex: RegExp) => new RegExp("^" + regex.source + "$", regex.flags)
