# Syntax

## include

include executes a script from within the script source directory.

Usage:

```lua
<table> include(<string> scriptPath)
```

Example:

```lua
local module = include("path/to/module")
```

## getVar

getVar returns the value of an environment variable.

Usage:

```lua
<string> getVar(<string> variableName)
<number> getVar("number:" .. <string> variableName)
<bool> getVar("bool:" .. <string> variableName)
```

Example:

```lua
local variable = getVar("example_variable")
```

**Note:** found by `VAR_{uppercaseName}` in environment properties.
