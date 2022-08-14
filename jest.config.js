module.exports = {
    "roots": [
        "<rootDir>/test",
    ],
    "testMatch": [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)"
        // "**/matcher.test.ts"
    ],
    "transform": {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
}
