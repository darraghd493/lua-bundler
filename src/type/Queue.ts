class Queue {
    private queue: any[] = [];

    enqueue(item: any): void {
        this.queue.push(item);
    }

    dequeue(): any {
        return this.queue.shift();
    }

    peek(): any {
        return this.queue[this.queue.length - 1];
    }

    view(index: number): any {
        return this.queue[index];
    }

    get length(): number {
        return this.queue.length;
    }

    clear(): void {
        this.queue = [];
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    toArray(): any[] {
        return this.queue;
    }

    toString(): string {
        return this.queue.toString();
    }

    forEach(callback: (item: any) => void): void {
        this.queue.forEach(callback);
    }
}

export default Queue;