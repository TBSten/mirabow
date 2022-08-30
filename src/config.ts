import { Config } from "./type"

let _config: Config = {
    ignoreCase: false,
    ignoreString: /\s/,
}

export const getConfig = () => {
    return _config
}

export const setConfig = (newConfig: Partial<Config>) => {
    _config = {
        ..._config,
        ...newConfig,
    }
}
