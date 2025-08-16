import { NodeWithDistance } from "../dijkstra/DijkstraAlgorithm";

export class Queue<T> {
    //circular queue implmentation
    private capacity: number;
    private items: Array<T | null>;
    private front: number;
    private rear: number;
    private size: number;
    constructor(capacity: number) {
        this.capacity = capacity; //size of the array
        this.items = new Array<T | null>(capacity).fill(null);
        this.front = 0; // index of the front element
        this.rear = -1; // index of the rear element
        this.size = 0; //number of elements currently residing inside the queue
    }
    isFull(): boolean {
        return this.size === this.capacity;
    }
    isEmpty(): boolean {
        return this.size === 0;
    }
    getSize(): number {
        return this.size;
    }
    enqueue(value: T): void {
        if (this.isFull()) {
            throw Error("queue is full");
        }
        this.rear = (this.rear + 1) % this.capacity;
        this.items[this.rear] = value;
        this.size++;
    }
    dequeue(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        const value = this.items[this.front];
        this.items[this.front] = null;
        this.front = (this.front + 1) % this.capacity;
        this.size--;

        return value;
    }
    peek(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        return this.items[this.front];
    }
    toArray(): T[] {
        if (this.isEmpty()) {
            return [];
        }

        const result: T[] = [];
        let count = this.size;
        let index = this.front;

        while (count > 0) {
            if (this.items[index] !== null) {
                result.push(this.items[index] as T);
                count--;
            }
            index = (index + 1) % this.capacity;
        }

        return result;
    }
    toString(): string {
        return this.toArray().toString();
    }
}
export class MinPriorityQueue<T extends NodeWithDistance> {
    private items: T[] = [];
    private idToIndex: Map<number, number> = new Map();

    constructor(private compare: (a: T, b: T) => number) {}

    private updateIndexMap(): void {
        this.idToIndex.clear();
        for (let i = 0; i < this.items.length; i++) {
            this.idToIndex.set(this.items[i].id, i);
        }
    }
    private findInsertPosition(item: T): number {
        for (let i = 0; i < this.items.length; i++) {
            if (this.compare(item, this.items[i]) < 0) {
                return i;
            }
        }
        return this.items.length;
    }

    getValue(id: number): number {
        const index = this.idToIndex.get(id)!;
        return this.items[index].estimated_distance;
    }

    insert(item: T): void {
        const insertPos = this.findInsertPosition(item);
        this.items.splice(insertPos, 0, item);
        this.updateIndexMap();
    }

    extractMin(): T {
        const min = this.items.shift()!;
        this.idToIndex.delete(min.id);
        this.updateIndexMap();
        return min;
    }

    update(id: number, newDistance: number): void {
        const index = this.idToIndex.get(id)!;
        const item = this.items[index];
        this.items.splice(index, 1);
        item.estimated_distance = newDistance;
        const newPos = this.findInsertPosition(item);
        this.items.splice(newPos, 0, item);
        this.updateIndexMap();
    }

    peek(): T | undefined {
        return this.items[0];
    }
    isEmpty(): boolean {
        return this.items.length === 0;
    }
    size(): number {
        return this.items.length;
    }
    getArray(): string[] {
        return this.items.map((item) => item.label);
    }
}
