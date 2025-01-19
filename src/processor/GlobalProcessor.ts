import { readFileSync, statSync } from "fs";
import { Chunk, parse } from "luaparse";
import pc from "picocolors";

import luamin from "../dependency/luamin";

import { BaseProcessor, Insert } from "./BaseProcessor";

class GlobalProcessor extends BaseProcessor {
    private inserts: Insert[] = [];
    private insertsCache: { [key: string]: number } = {};

    public process(path: string): string {
        if (this.cache[path]) {
            console.log(this.generateSpace(), pc.yellow(`Cache hit for ${path} +!`));
            return this.cache[path];
        }

        if (this.stack.toArray().includes(path)) {
            throw new Error("Circular dependency detected: " + this.toString());
        }

        this.stack.push(path);
        console.log(this.generateSpace(), pc.gray(`Processing ${path} ... ${statSync(path).size}kb`));

        const scriptChunk = this.handle(readFileSync(path, "utf8"));
        this.cache[path] = luamin.minify(scriptChunk);

        console.log(this.generateSpace(), pc.green(`Processed ${path}!`));
        this.stack.pop();
        
        return this.cache[path];
    }

    public insert(path: string): string {
        if (this.insertsCache[path]) {
            console.log(this.generateSpace(), pc.yellow(`Cache hit for ${path} +!`));
            return this.cache[path];
        }
        console.log(this.generateSpace(), pc.gray("Inserting script reference..."));
        const parser = parse(this.process(path));
        const name = this.generateFunctionName();
        this.inserts.push({
            name,
            body: parser.body
        });
        this.insertsCache[path] = this.inserts.length - 1;
        console.log(this.generateSpace(), pc.gray("Inserted script reference!"));
        return name;
    }
    
    protected handleInserts(parser: Chunk): void {
        if (this.stack.length > 1) return;
        while (this.inserts.length > 0) {
            const insert = this.inserts.pop();
            if (!insert) continue;
            console.log(this.generateSpace(), pc.gray("Defined script reference!"));
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

export default GlobalProcessor;