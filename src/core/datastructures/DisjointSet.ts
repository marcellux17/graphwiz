export class DisjointSet{
    private readonly _parent:number[];
    private readonly _rank: number[];

    constructor(size: number){
        this._parent = Array.from({length: size}, (_, i) => i);
        this._rank = Array(size).fill(0);
    }
    find(a: number):number{
        if(this._parent[a] !== a){
            this._parent[a] = this.find(this._parent[a]);
        }
        return this._parent[a];
    }   
    union(a:number, b:number):void {
        const rootA = this.find(a);
        const rootB = this.find(b);
        
        if (rootA === rootB) return;
        
        if (this._rank[rootA] < this._rank[rootB]) {
            this._parent[rootA] = rootB;
        } else if (this._rank[rootA] > this._rank[rootB]) {
            this._parent[rootB] = rootA;
        } else {
            this._parent[rootB] = rootA;
            this._rank[rootA]++;
        }
    }
}