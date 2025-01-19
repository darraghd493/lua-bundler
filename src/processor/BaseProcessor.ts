import { Chunk, Expression, parse, Statement } from "luaparse";

import Stack from "../type/Stack";
import Method from "./types/Method";

import MethodGetVar from "./types/methods/getVar";
import MethodInclude from "./types/methods/include";

type Insert = { name: string, body: Statement[] };

abstract class BaseProcessor {
    protected stack = new Stack();
    private methods: Method[] = [
        new MethodGetVar(),
        new MethodInclude(),
    ];
    
    protected functions: string[] = [];
    protected cache: { [key: string]: string } = {};

    abstract process(path: string): string;
    abstract insert(path: string): string;
    protected abstract handleInserts(parser: Chunk): void;

    // Handler
    protected handle(data: string): Chunk {
        const parser = parse(data);

        this.functions = [];
        for (const statement of parser.body) {
            if (statement.type === "FunctionDeclaration" && statement.identifier?.type === "Identifier") {
                this.functions.push(statement.identifier.name);
            }
        }

        this.handleStatements(parser.body);
        this.handleInserts(parser);

        return parser;
    }

    private handleStatements(statements: Statement[]) {
        statements.forEach((statement: Statement) => {
            this.handleStatement(statement);
        });
    }

    private handleStatement(statement: Statement) {
        switch (statement.type) {
            case "ReturnStatement":
                this.handleExpressions(statement.arguments);
                break;
            case "IfStatement":
                statement.clauses.forEach((clause: any) => {
                    if (clause.condition) {
                        clause.condition = this.handleExpression(clause.condition);
                    }
                    this.handleStatements(clause.body);
                });
                break;
            case "WhileStatement":
            case "RepeatStatement":
                statement.condition = this.handleExpression(statement.condition);
                this.handleStatements(statement.body);
                break;
            case "DoStatement":
                this.handleStatements(statement.body);
                break;
            case "LocalStatement":
                this.handleExpressions(statement.init);
                break;
            case "AssignmentStatement":
                this.handleExpressions(statement.variables);
                this.handleExpressions(statement.init);
                break;
            case "CallStatement":
                statement.expression = this.handleExpression(statement.expression) as any;
                break;
            case "FunctionDeclaration":
                if (statement.identifier?.type == "MemberExpression") {
                    statement.identifier.base = this.handleExpression(statement.identifier.base);
                }
                this.handleStatements(statement.body);
                break;
            case "ForNumericStatement":
                statement.start = this.handleExpression(statement.start);
                statement.end = this.handleExpression(statement.end);
                if (statement.step != null) statement.step = this.handleExpression(statement.step);
                this.handleStatements(statement.body);
                break;
            case "ForGenericStatement":
                this.handleExpressions(statement.iterators);
                this.handleStatements(statement.body);
                break;
        }
    }

    private handleExpressions(expressions: Expression[]) {
        expressions.forEach((expression: Expression, index: number) => {
            expressions[index] = this.handleExpression(expression);
        });
    }
    
    private handleExpression(expression: Expression) {
        switch (expression.type) {
            case "FunctionDeclaration":
                if (expression.identifier?.type == "MemberExpression") {
                    expression.identifier.base = this.handleExpression(expression.identifier.base);
                }
                this.handleStatements(expression.body);
                break;
            case "TableConstructorExpression":
                expression.fields.forEach((field: any) => {
                    switch (field.type) {
                        case "TableKey":
                        case "TableKeyString":
                            field.key = this.handleExpression(field.key);
                        case "TableValue":
                            field.value = this.handleExpression(field.value);
                            break;
                    }
                });
                break;
            case "BinaryExpression":
                expression.left = this.handleExpression(expression.left);
                expression.right = this.handleExpression(expression.right);
                break;
            case "LogicalExpression":
                expression.left = this.handleExpression(expression.left);
                expression.right = this.handleExpression(expression.right);
                break;
            case "UnaryExpression":
                expression.argument = this.handleExpression(expression.argument);
                break;
            case "MemberExpression":
                expression.base = this.handleExpression(expression.base);
                break;
            case "IndexExpression":
                expression.base = this.handleExpression(expression.base);
                expression.index = this.handleExpression(expression.index);
                break;
            case "CallExpression":
                expression.base = this.handleExpression(expression.base);
                this.handleExpressions(expression.arguments);
                break;
            case "TableCallExpression":
                expression.base = this.handleExpression(expression.base);
                this.handleExpression(expression.arguments); // arguments is a single expression, not an array... misleading.
                break;
            case "StringCallExpression":
                expression.base = this.handleExpression(expression.base);
                this.handleExpression(expression.argument);
                break;
        }

        // Handle custom methods
        if (expression.type &&
            expression.type.includes("Expression") &&
            (expression as any).base?.type == "Identifier"
        ) {
            const method = this.methods.find((method: Method) => {
                return method.name == (expression as any).base?.name &&
                    method.types.includes(expression.type);
            });

            if (method) {
                return method.generateExpression(expression);
            }
        }

        return expression;
    }

    // Utility functions
    protected generateFunctionName(): string {
        const name = "function_" + Math.random().toString(36).substring(7);
        return this.functions.includes(name) ? this.generateFunctionName() : name;
    }

    protected generateSpace(): string {
        return " ".repeat(this.stack.length - 1);
    }
}

export { BaseProcessor, Insert };