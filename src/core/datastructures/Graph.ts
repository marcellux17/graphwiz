import Edge from "./Edge";
import Node from "./Node";

export default class Graph {
    private readonly _nodes: Map<number, Node>;
    private readonly _edges: Map<number, Edge>;
    private readonly _weighted: boolean;
    private _nextNodeId = 0;
    private _nextEdgeId = 0;
    private _nextLabel = 1;

    constructor(weighted: boolean = false) {
        this._weighted = weighted;
        this._nodes = new Map<number, Node>();
        this._edges = new Map<number, Edge>();
    }
    get isWeighted(): boolean {
        return this._weighted;
    }
    get isEmpty(): boolean {
        return this._nodes.size === 0;
    }
    get edges(): ReadonlyArray<Edge>{
        return Array.from(this._edges.values());
    }
    get nodes(): ReadonlyArray<Node>{
        return Array.from(this._nodes.values());
    }
    addNode(): number {
        const id = this._nextNodeId;
        const label = `${this._nextLabel}`;
       
        this._nodes.set(id, new Node(id, label));
       
        this._nextNodeId++;
        this._nextLabel++;
        return id;
    }
    addExistingNode(id: number, x: number, y: number, color: string): void {
        if(id >= this._nextNodeId){
            this._nextNodeId = id + 1;
        }
        const label = `${this._nextLabel}`;
        const node = new Node(id, label);
        
        node.color = color;
        node.x = x;
        node.y = y;
        
        this._nodes.set(id, node);
        this._nextLabel++;
    }
    
    addEdge(from: number, to: number, bidirectional: boolean = true, width: number = 2, weight: number = 1): number | undefined {
        if (from === to) return;
        
        const fromNode = this._nodes.get(from);
        const toNode = this._nodes.get(to);
        if (!fromNode || !toNode) return;
        
        if (fromNode.hasEdgeToNode(to)) return;
        
        const id = this._nextEdgeId;
        fromNode.addNeighbour(to, id);

        if(bidirectional){
            toNode.addNeighbour(from, id);
        }
        let edge: Edge;
        if(this._weighted){
            edge = new Edge(id, to, from, width, weight);
        }else{
            edge = new Edge(id, to, from, width);
        }
        this._edges.set(id, edge);

        this._nextEdgeId++;
        return id;
    }

    removeEdge(edgeId: number):void {
        const edge = this._edges.get(edgeId);
        if(!edge)return;

        const fromNode = this._nodes.get(edge.from);
        const toNode = this._nodes.get(edge.to);
        if (!fromNode || !toNode) return;

        fromNode.removeNeighbour(edge.to);
        toNode.removeNeighbour(edge.from);
        
        this._edges.delete(edgeId);
    }

    removeNode(id: number): void {
        const node = this._nodes.get(id);
        if(!node)return;

        this._edges.forEach((edge, edgeId) => {
            const to = edge.to;
            const from = edge.from;
            
            if(to === id || from === id){
                this._nodes.get(edge.to)?.removeNeighbour(edge.from);
                this._nodes.get(edge.from)?.removeNeighbour(edge.to);
                this._edges.delete(edgeId);
            }
        });
        this._nodes.delete(id);
    }
    getEdgesConnectedToNode(id: number): Edge[] {
        const node = this._nodes.get(id);
        if (!node) return [];

        const edges: Edge[] = [];

        this._edges.forEach(edge => {
            if(edge.to === id || edge.from === id){
                edges.push(edge);
            }
        });

        return edges;
    }
    getNode(id: number): Node | undefined {
        return this._nodes.get(id);
    }
    getEdge(id: number): Edge | undefined {
        return this._edges.get(id);
    }
    edgeHasParallel(edge: Edge):boolean{
        const toNode = this._nodes.get(edge.to);
        if(!toNode)return false;
        
        return toNode.hasEdgeToNode(edge.from);
    }
    resetGraphToOriginalVisual():void{
        for(const node of this._nodes.values()){
            node.reset();
        }
        for(const edge of this._edges.values()){
            edge.reset();
        }
    }   
    clearGraph(): void {
        this._nodes.clear();
        this._edges.clear();
        this._nextNodeId = 1;
        this._nextEdgeId = 1;
        this._nextLabel = 1;
    }
}


