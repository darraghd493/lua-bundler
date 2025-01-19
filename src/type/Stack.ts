class Stack {
    private stack: any[] = [];

    push(item: any): void {
        this.stack.push(item);
    }

    pop(): any {
        return this.stack.pop();
    }

    peek(): any {
        return this.stack[this.stack.length - 1];
    }

    view(index: number): any {
        return this.stack[index];
    }

    get length(): number {
        return this.stack.length;
    }

    clear(): void {
        this.stack = [];
    }

    isEmpty(): boolean {
        return this.stack.length === 0;
    }

    toArray(): any[] {
        return this.stack;
    }

    toString(): string {
        return this.stack.toString();
    }

    forEach(callback: (item: any) => void): void {
        this.stack.forEach(callback);
    }
}

export default Stack;