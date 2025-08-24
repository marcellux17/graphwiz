export class DisjointSet{
    private parent:number[];
    private rank: number[];

    constructor(size: number){
        this.parent = Array(size).fill(0);
        this.rank = Array(size).fill(0);
        for(let i = 0; i < size;i++){
            this.parent[i] = i;
            this.rank[i] = 0;
        }
    }
    find(a: number):number{
        if(this.parent[a] !== a){
            this.parent[a] = this.find(this.parent[a]);
        }
        return this.parent[a];
    }   
    union(a:number, b:number):void {
        const rootA = this.find(a);
        const rootB = this.find(b);
        if (rootA == rootB) return;
        if (this.rank[rootA] < this.rank[rootB]) {
            this.parent[rootA] = rootB;
        } else if (this.rank[rootA] > this.rank[rootB]) {
            this.parent[rootB] = rootA;
        } else {
            this.parent[rootB] = rootA;
            this.rank[rootA]++;
        }
    }
}