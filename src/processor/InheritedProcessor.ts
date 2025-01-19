import { readFileSync, statSync } from "fs";
import { Chunk, parse } from "luaparse";
import pc from "picocolors";

import Queue from "../type/Queue";
import Stack from "../type/Stack";

import luamin from "../dependency/luamin";

import { BaseProcessor } from "./BaseProcessor";

class InheritedProcessor extends BaseProcessor {
    private inserts = new Stack(); // composed of Queue({ name: string, body: Statement[] }); aka. Insert

    public process(path: string): string {
        if (this.cache[path]) {
            console.log(this.generateSpace(), pc.yellow(`Cache hit for ${path} +!`));
            return this.cache[path];
        }

        if (this.stack.toArray().includes(path)) {
            throw new Error("Circular dependency detected: " + this.toString());
        }

        this.inserts.push(new Queue());
        this.stack.push(path);
        console.log(this.generateSpace(), pc.gray(`Processing ${path} ... ${statSync(path).size}kb`));

        const scriptChunk = this.handle(readFileSync(path, "utf8"));
        this.cache[path] = luamin.minify(scriptChunk);

        console.log(this.generateSpace(), pc.green(`Processed ${path}!`));
        this.stack.pop();
        this.inserts.pop();
        
        return this.cache[path];
    }

    public insert(path: string): string {
        console.log(this.generateSpace(), pc.gray("Inserting script reference..."));
        const parser = parse(this.process(path));
        const name = this.generateFunctionName();
        this.inserts.peek().enqueue({
            name,
            body: parser.body
        });
        console.log(this.generateSpace(), pc.gray("Inserted script reference!"));
        return name;
    }
    
    protected handleInserts(parser: Chunk): void {
        while (!this.inserts.peek().isEmpty()) {
            console.log(this.generateSpace(), pc.gray("Defined script reference!"));
            const insert = this.inserts.peek().dequeue();
            parser.body.unshift({
                type: "FunctionDeclaration",
                identifier: {
                    type: "Identifier",
                    name: insert.name
                },
                isLocal: true,
                parameters: [],
                body: insert.body
            });
        }
    }
}

export default InheritedProcessor;