export default class Queue<T> {
    //circular queue implmentation 
    private capacity: number;
    private items: Array<T | null>;
    private front: number;
    private rear: number;
    private size: number;
    constructor(capacity: number) {
      this.capacity = capacity;//size of the array
      this.items = new Array<T | null>(capacity).fill(null);
      this.front = 0;// index of the front element
      this.rear = -1; // index of the rear element
      this.size = 0;  //number of elements currently residing inside the queue
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
    Enqueue(value: T):void {
      if (this.isFull()) {
        throw Error('queue is full')
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