# lua-bundler

A bundler for Lua files with the core intention of adding custom function support.

> **Note:** The project is very *hacky* and is not recommended for production use. If you want to bundle Lua files, consider using [darklua](https://darklua.com/) on its own.

## Installation

1. Install [Aftman](https://github.com/LPGhatguy/aftman)
2. Run `aftman install`
3. Run `npm install`
4. Run `npm run bundle`

## Usage

lua-bundler only supports configuration through environment variables due to the original nature of the project.

### Environment Variables

Example:

```env
SCRIPT_DIR=src/script/ # Directory containing Lua files
SCRIPT_ENTRY=index.lua # Entry point of the script
SCRIPT_HEADER=header.lua # Header file to be included in the output (optional, is not processed)
PROCESSED_DIR=processed/ # Directory to output processed files
OUTPUT=main.lua # Output file

DARKLUA_CONFIG=darklua.json # darklua configuration file

GLOBAL_IMPORT=true # Form of script import - global or local (leads to nested functions and repeated code)
REPROCESS=true # Whether to reprocess the final output using darklua
HEADER_NEWLINE=true # Whether to add a newline after the header

# Example variables for getVar
__NAME=script
__VERSION=1.0.0
__RELEASE=dev
```

## Darklua

The usage of darklua permits support* for other languages such as LuaU, and that is the main reason for it's inclusion in the project.

*Support through removal. `luaparse` does not support syntax such as LuaU.

## Syntax

Check [SYNTAX.md](SYNTAX.md) for supported syntax.
