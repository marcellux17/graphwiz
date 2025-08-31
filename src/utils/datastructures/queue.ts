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
}
export type QueueElement = {
    id: number, 
    value: number
}
export class MinPriorityQueue {
    private arr: QueueElement[] = [];
    insert(element: QueueElement): void {
        let i = 0;
        while (i < this.arr.length && this.arr[i].value <= element.value) {
            i++;
        }
        this.arr.splice(i, 0, element);
    }
    extractMin(): QueueElement | null {
        if (this.arr.length === 0) return null;
        return this.arr.shift()!;
    }
    update(id: number, newValue: any): void {
        const index = this.arr.findIndex(el => el.id === id);
        if (index === -1) return;

        const element = this.arr[index];
        this.arr.splice(index, 1);

        element.value = newValue;
        this.insert(element);
    }
    get(id: number): QueueElement | null {
        return this.arr.find(el => el.id === id) || null;
    }
    isEmpty(): boolean {
        return this.arr.length === 0;
    }
    toArray():number[]{
        return this.arr.map(element => element.id);
    }
}