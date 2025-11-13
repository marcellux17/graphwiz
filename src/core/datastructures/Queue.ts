export class Queue<T> {
    private readonly _capacity: number;
    private readonly _items: Array<T | null>;
    private _front: number;
    private _rear: number;
    private _size: number;
    
    constructor(capacity: number) {
        this._capacity = capacity;
        this._items = Array<T | null>(capacity).fill(null);
        this._front = 0; 
        this._rear = -1; 
        this._size = 0; 
    }
    get IsFull(): boolean {
        return this._size === this._capacity;
    }
    get IsEmpty(): boolean {
        return this._size === 0;
    }
    enqueue(value: T): void {
        if (this.IsFull) {
            return;
        }
        this._rear = (this._rear + 1) % this._capacity;
        this._items[this._rear] = value;
        this._size++;
    }
    dequeue(): T | undefined {
        if (this.IsEmpty) {
            return undefined;
        }
        const value = this._items[this._front];
        this._items[this._front] = null;
        this._front = (this._front + 1) % this._capacity;
        this._size--;

        return value!;
    }
    toArray(): T[] {
        if (this.IsEmpty) {
            return [];
        }
        const result: T[] = [];
        let count = this._size;
        let index = this._front;

        while (count > 0) {
            if (this._items[index] !== null) {
                result.push(this._items[index] as T);
                count--;
            }
            index = (index + 1) % this._capacity;
        }

        return result;
    }
}
type QueueElement = {
    id: number, 
    value: number
}

export class MinPriorityQueue {
    private readonly _items: (QueueElement | null)[];
    private _size = 0;
    constructor(capacity: number) {
        this._items = Array(capacity).fill(null);
    }
    get isEmpty(): boolean {
        return this._size === 0;
    }
    insert(element: QueueElement): void {
        let i = 0;
        while (i < this._size && this._items[i]!.value <= element.value) {
            i++;
        }
        for (let j = this._size; j > i; j--) {
            this._items[j] = this._items[j - 1];
        }    
        this._items[i] = element;
        this._size++;
    }
    extractMin(): QueueElement | undefined {
        if (this._size === 0) return undefined;
        const min = this._items[0]!;
        for (let i = 0; i < this._size - 1; i++) {
            this._items[i] = this._items[i + 1];
        }
        this._items[this._size - 1] = null;
        this._size--;
        return min;
    }
    update(id: number, newValue: number): void {
        let index = -1;
        for (let i = 0; i < this._size; i++) {
            if (this._items[i]!.id === id) {
                index = i;
                break;
            }
        }
        if (index === -1) return;
        const element = this._items[index]!;
        for (let i = index; i < this._size - 1; i++) {
            this._items[i] = this._items[i + 1];
        }
        this._items[this._size - 1] = null;
        this._size--;
        element.value = newValue;
        this.insert(element);
    }
    getElement(id: number): QueueElement | undefined {
        for (let i = 0; i < this._size; i++) {
            if (this._items[i]!.id === id) {
                return this._items[i]!;
            }
        }
        return undefined;
    }
    toArray(): number[] {
        const result: number[] = Array(this._size).fill(0);
        for (let i = 0; i < this._size; i++) {
            result[i] = this._items[i]!.id;
        }
        return result;
    }
}