import { Expression } from "luaparse";
import { existsSync } from "fs";
import { env } from "process";

import processor from "../../Processor";
import Method from "../Method";

class MethodInclude extends Method {
    constructor() {
        super("include", ["CallExpression", "StringCallExpression"]);
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
            throw new Error("include function must have a string literal as an argument");
        }
        
        const scriptPath = env.PROCESSED_DIR as string + expressionArgument.raw.substring(1, expressionArgument.raw.length - 1);
        if (!existsSync(scriptPath)) {
            throw new Error("include function must reference a valid script");
        }
        
        return {
            type: "CallExpression",
            base: {
                type: "Identifier",
                name: processor.insert(scriptPath)
            },
            arguments: []
        };
    }
}

export default MethodInclude;