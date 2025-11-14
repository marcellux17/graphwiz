export class DisjointSet {
    private readonly _parent: Map<number, number>;
    private readonly _rank: Map<number, number>;

    constructor() {
        this._parent = new Map();
        this._rank = new Map();
    }
    find(a: number): number {
        if (!this._parent.has(a)) {
            this.makeSet(a);
            return a;
        }

        let parentA:number = this._parent.get(a)!;
        if (parentA !== a) {
            parentA = this.find(this._parent.get(a)!);
            this._parent.set(a, parentA);
        }
        return parentA;
    }

    union(a: number, b: number): void {
        if (!this._parent.has(a)) {
            this.makeSet(a);
        }
        if (!this._parent.has(b)) {
            this.makeSet(b);
        }

        const rootA = this.find(a);
        const rootB = this.find(b);

        if (rootA === rootB) return;

        const rankA = this._rank.get(rootA)!;
        const rankB = this._rank.get(rootB)!;

        if (rankA < rankB) {
            this._parent.set(rootA, rootB);
        } else if (rankA > rankB) {
            this._parent.set(rootB, rootA);
        } else {
            this._parent.set(rootB, rootA);
            this._rank.set(rootA, rankA + 1);
        }
    }
    private makeSet(x: number): void {
        if (!this._parent.has(x)) {
            this._parent.set(x, x);
            this._rank.set(x, 0);
        }
    }
}