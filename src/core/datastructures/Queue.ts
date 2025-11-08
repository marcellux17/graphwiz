export class Queue<T> {
    private capacity: number;
    private items: Array<T | null>;
    private front: number;
    private rear: number;
    private size: number;
    constructor(capacity: number) {
        this.capacity = capacity;
        this.items = new Array<T | null>(capacity).fill(null);
        this.front = 0; 
        this.rear = -1; 
        this.size = 0; 
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
            return;
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
type QueueElement = {
    id: number, 
    value: number
}

export class MinPriorityQueue {
    private arr: (QueueElement | null)[];
    private size = 0;
    constructor(capacity: number) {
        this.arr = new Array(capacity).fill(null);
    }
    insert(element: QueueElement): void {
        let i = 0;
        while (i < this.size && this.arr[i]!.value <= element.value) {
            i++;
        }
        for (let j = this.size; j > i; j--) {
            this.arr[j] = this.arr[j - 1];
        }    
        this.arr[i] = element;
        this.size++;
    }
    extractMin(): QueueElement | null {
        if (this.size === 0) return null;
        const min = this.arr[0]!;
        for (let i = 0; i < this.size - 1; i++) {
            this.arr[i] = this.arr[i + 1];
        }
        this.arr[this.size - 1] = null;
        this.size--;
        return min;
    }
    update(id: number, newValue: number): void {
        let index = -1;
        for (let i = 0; i < this.size; i++) {
            if (this.arr[i]!.id === id) {
                index = i;
                break;
            }
        }
        if (index === -1) return;
        const element = this.arr[index]!;
        for (let i = index; i < this.size - 1; i++) {
            this.arr[i] = this.arr[i + 1];
        }
        this.arr[this.size - 1] = null;
        this.size--;
        element.value = newValue;
        this.insert(element);
    }
    get(id: number): QueueElement | null {
        for (let i = 0; i < this.size; i++) {
            if (this.arr[i]!.id === id) {
                return this.arr[i]!;
            }
        }
        return null;
    }
    isEmpty(): boolean {
        return this.size === 0;
    }
    toArray(): number[] {
        const result: number[] = new Array(this.size).fill(0);
        for (let i = 0; i < this.size; i++) {
            result[i] = this.arr[i]!.id;
        }
        return result;
    }
}