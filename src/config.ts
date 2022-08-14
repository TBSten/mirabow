import { Config, TreeNode } from "./types";

let _currentConfig: Config = {
    ignoreCase: false,
    tree: false,
    ignoreString: /\s/,
}

export const setConfig = (config: Partial<Config>) => {
    _currentConfig = {
        ..._currentConfig,
        ...config,
    }
}

export const getConfig = () => _currentConfig

export const treeNode = (node: TreeNode) => getConfig().tree ? node : null
