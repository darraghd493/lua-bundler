import { Expression } from "luaparse";

abstract class Method {
    public readonly name: string;
    public readonly types: string[];

    constructor(name: string, types: string[]) {
        this.name = name;
        this.types = types;
    }

    abstract generateExpression(expression: Expression): Expression;
}

export default Method;