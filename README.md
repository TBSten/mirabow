
![icon](doc/images/icon.png)

# MIRABOW

MIRABOW is a parser generator for parsing token sequences.

For example, describe the pattern "declaratively" as follows.

```typescript
import { execMatcher , toMatcher } from "mirabow"

//This represents a pattern
//this pattern match ["mi",<any token>,"bow",<Repeat "!" 0 or more times>]
const matcher = toMatcher(
    "mi", any(), capture("BOW") , repeat("!"),
)

//This represents the input
const data = [ "mi","ra","bow","!","!" ]

const result = execMatcher(matcher,data)
/*
{
    capture: {
        BOW: "bow"
    },
    match: [ "mi","ra","bow","!","!" ],
    result: undefined
}
*/

```

Can be used with either ESModule or CommonJS .
