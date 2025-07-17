import { WithIdAndDistance } from "./graphs";
export default class Queue<T> {
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
    Enqueue(value: T): void {
        if (this.isFull()) {
            throw Error("queue is full");
        }
        this.rear = (this.rear + 1) % this.capacity;
        this.items[this.rear] = value;
        this.size++;
    }
    Dequeue(): T | null {
        if (this.isEmpty()) {
            return null;
        }
        const value = this.items[this.front];
        this.items[this.front] = null;
        this.front = (this.front + 1) % this.capacity;
        this.size--;

        return value;
    }
    Peek(): T | null {
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
export class MinPriorityQueue<T extends WithIdAndDistance> {
    private heap: T[] = [];
    private idToIndex: Map<string, number> = new Map();//making sure updating is fast so in the worst case we won't have o(n) runtime

    constructor(private compare: (a: T, b: T) => number) {}

    private parent(i: number): number { return Math.floor((i - 1) / 2); }
    private left(i: number): number { return 2 * i + 1; }
    private right(i: number): number { return 2 * i + 2; }

    private swap(i: number, j: number): void {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
        this.idToIndex.set(this.heap[i].id, i);
        this.idToIndex.set(this.heap[j].id, j);
    }

    private heapifyUp(i: number): void {
        while (i > 0 && this.compare(this.heap[i], this.heap[this.parent(i)]) < 0) {
            this.swap(i, this.parent(i));
            i = this.parent(i);
        }
    }

    private heapifyDown(i: number): void {
        let smallest = i;
        const left = this.left(i);
        const right = this.right(i);

        if (left < this.heap.length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
            smallest = left;
        }

        if (right < this.heap.length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
            smallest = right;
        }

        if (smallest !== i) {
            this.swap(i, smallest);
            this.heapifyDown(smallest);
        }
    }
    getValue(id:string):number{
        return this.heap[this.idToIndex.get(id)!].estimated_distance;
    }
    insert(item: T): void {
        this.heap.push(item);
        const index = this.heap.length - 1;
        this.idToIndex.set(item.id, index);
        this.heapifyUp(index);
    }

    extractMin(): T {
        const min = this.heap[0];
        const last = this.heap.pop()!;
        this.idToIndex.delete(min.id);
        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.idToIndex.set(last.id, 0);
            this.heapifyDown(0);
        }
        return min;
    }
    update(id: string, newDistance: number): void {
        const index = this.idToIndex.get(id);
        if (index === undefined) return; // node not in queue
        const oldDistance = this.heap[index].estimated_distance;
        this.heap[index].estimated_distance = newDistance;

        if (newDistance < oldDistance) {
            this.heapifyUp(index);
        } else {
            this.heapifyDown(index);
        }
    }
    isEmpty(): boolean {
        return this.heap.length === 0;
    }
}

