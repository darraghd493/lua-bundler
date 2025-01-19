import { Expression } from "luaparse";
import { env } from "process";

import Method from "../Method";

enum Literal {
    STRING,
    NUMBER,
    BOOLEAN
}

class MethodGetVar extends Method {
    constructor() {
        super("getVar", ["StringCallExpression"]);
    }

    generateExpression(expression: Expression): Expression {
        let expressionArgument: Expression = (expression as any).argument;
        if (expressionArgument == null || (expression as any).arguments != null) {
            const expressionArguments = (expression as any).arguments;
            if (expressionArguments.length !== 0) {
                expressionArgument = expressionArguments[0];
            }
        }

        if (expressionArgument.type !== "StringLiteral") {
            throw new Error("getVar function must have a string literal as an argument");
        }

        const rawName = expressionArgument.raw.substring(1, expressionArgument.raw.length - 1);
        
        const literal: Literal = rawName.startsWith("number:") ? Literal.NUMBER :
                rawName.startsWith("bool:") ? Literal.BOOLEAN : Literal.STRING;

        const name = literal === Literal.STRING ? rawName : rawName.substring(rawName.indexOf(":") + 1);
        const value = env["__" + name];
        
        if (!value) {
            throw new Error("getVar function must have a defined variable as an argument");
        }

        switch (literal) {
            case Literal.NUMBER:
                return {
                    type: "NumericLiteral",
                    value: Number.parseFloat(value),
                    raw: value.toString()
                };
            case Literal.BOOLEAN:
                return {
                    type: "BooleanLiteral",
                    value: value === "true",
                    raw: value.toString()
                };
        }

        return {
            type: "StringLiteral",
            value: value,
            raw : "\"" + value + "\""
        };
    }
}

export default MethodGetVar;