import { Config } from "types";

let _currentConfig: Config = {
    ignoreCase: false,
}

export const setConfig = (config: Partial<Config>) => {
    _currentConfig = {
        ..._currentConfig,
        ...config,
    }
}

export const getConfig = () => _currentConfig
