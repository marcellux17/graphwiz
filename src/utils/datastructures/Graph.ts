import { Queue } from "./Queue";

export class Graph {
    protected nodes: (Node | null)[];
    protected edges: (Edge | null)[];
    protected i = 1;
    protected numberOfNodes = 0;

    constructor() {
        this.nodes = Array(200).fill(null);
        this.edges = Array(200).fill(null);
    }
    getNodesListLength():number{
        return this.nodes.length;
    }
    getNumberOfNodes():number{
        return this.numberOfNodes;
    }
    addNode(): number {
        let idx = this.nodes.findIndex((n) => n === null);
        if (idx === -1) idx = this.nodes.length;
        const label = `${this.i++}`;
        this.nodes[idx] = new Node(label, idx);
        this.numberOfNodes++;
        return idx;
    }
    addExistingNode(id: number, x: number, y: number, color: string): void {
        const label = `${this.i++}`;
        const node = new Node(label, id);
        node.color = color;
        node.x = x;
        node.y = y;
        this.nodes[id] = node;
        this.numberOfNodes++;
    }
    getEdgeList(): (Edge | null)[] {
        return this.edges;
    }
    addEdge(from: number, to: number, twoWay: boolean = true): number | undefined {
        if (from === to) return;
        if (this.nodes[from]!.hasNeighbour(to)) return;

        let idx = this.edges.findIndex((e) => e === null);
        if (idx === -1) {
            idx = this.edges.length;
        }
        this.nodes[from]!.addNeighbour(to, idx);
        if(twoWay){
            this.nodes[to]!.addNeighbour(from, idx);
        }
        this.edges[idx] = new Edge(idx, to, from);
        return idx;
    }

    removeEdge(from: number, to: number, twoWay: boolean = true) {
        const edgeId = this.nodes[from]!.getEdgeIdConnectingToNeihgbour(to);
        if (edgeId === -1) return;
        this.nodes[from]!.removeNeighbour(to);
        if(twoWay){
            this.nodes[to]!.removeNeighbour(from);
        }
        this.edges[edgeId] = null;
    }
    deleteNode(id: number): void {
        const node = this.nodes[id];
        if (!node) return;
        for (let nodeId = 0; nodeId < this.nodes.length; nodeId++) {
            if(this.nodes[nodeId] !== null && this.nodes[nodeId]!.hasNeighbour(id)){
                const edgeId = this.nodes[nodeId]!.getEdgeIdConnectingToNeihgbour(id);
                this.edges[edgeId] = null;
                this.nodes[nodeId]!.removeNeighbour(id);
            }
            if(node.hasNeighbour(nodeId)){
                this.edges[node.getEdgeIdConnectingToNeihgbour(nodeId)] = null;
            }
        }
        
        this.nodes[id] = null;
        this.numberOfNodes--;
    }
    getEdgeListOfNode(id: number): number[] {
        const node = this.nodes[id];
        if (!node) return [];

        const edges: number[] = [];

        for (let nodeId = 0; nodeId < this.nodes.length; nodeId++) {
            if (node.hasNeighbour(nodeId)) {
                edges.push(node.getEdgeIdConnectingToNeihgbour(nodeId));
            }else if(this.nodes[nodeId] !== null){
                const neighbourNode = this.nodes[nodeId]!;
                if(neighbourNode.hasNeighbour(nodeId)){
                    edges.push(neighbourNode.getEdgeIdConnectingToNeihgbour(id));
                }
            }
        }

        return edges;
    }

    getLabelOfNode(id: number): string {
        return this.nodes[id]!.label;
    }

    getNode(id: number): (Node | null) {
        return this.nodes[id]!;
    }

    getEdge(id: number): (Edge|null) {
        return this.edges[id];
    }
    getNodeList(): (Node | null)[] {
        return this.nodes;
    }
    setNodeCoordinates(id: number, x: number, y: number): void {
        const node = this.nodes[id]!;
        node.x = x;
        node.y = y;
    }
    edgeHasAPair(edge: Edge):boolean{
        const toNode = this.nodes[edge.getTo()]!;
        return toNode.hasNeighbour(edge.getFrom());
    }
    areConnected(startId: number, targetId: number): boolean {
        if (startId === targetId) return true;

        const visited = new Array<boolean>(this.nodes.length).fill(false);
        const queue = new Queue<number>(this.numberOfNodes);
        queue.enqueue(startId);
        visited[startId] = true;

        while (!queue.isEmpty()) {
            const currentId = queue.dequeue()!;
            const currentNode = this.nodes[currentId]!;
            for (let nodeId = 0; nodeId < this.nodes.length; nodeId++) {
                if (currentNode.hasNeighbour(nodeId) && !visited[nodeId]) {
                    if (nodeId === targetId) return true;
                    visited[nodeId] = true;
                    queue.enqueue(nodeId);
                }
            }
        }

        return false;
    }
    resetGraphToOriginalVisual():void{
        for(const node of this.nodes){
            if(node){
                node.reset();
            }
        }
        for(const edge of this.edges){
            if(edge){
                edge.reset();
            }
        }
    }
    clearGraph(): void {
        this.nodes.fill(null);
        this.edges.fill(null);
        this.i = 1;
        this.numberOfNodes = 0;
    }
}

export class WeightedGraph extends Graph {
    getEdgeWeight(id: number): number {
        return this.edges[id]!.getWeight()!;
    }

    modifyWeight(id: number, newWeight: number): void {
        const edge = this.edges[id];
        if (edge) edge.setWeight(newWeight);
    }

    override addEdge( from: number, to: number,twoWay: boolean = true , weight: number = 1): number | undefined {
        if (from === to) return;
        if (this.nodes[from]!.hasNeighbour(to)) return;

        let idx = this.edges.findIndex((e) => e === null);
        if (idx === -1) {
            idx = this.edges.length;
        }
        this.nodes[from]!.addNeighbour(to, idx);
        if(twoWay){
            this.nodes[to]!.addNeighbour(from, idx);
        }
        this.edges[idx] = new Edge(idx, to, from, weight);
        return idx;
    }
}

export class Edge {
    private id: number;
    private weight?: number;
    private to: number;
    private from: number;
    color = "black";
    width = 2;
    setWeight(weight: number):void{
        this.weight = weight;
    }
    getWeight():number|undefined{
        return this.weight;
    }
    getTo():number{
        return this.to
    }
    getFrom():number{
        return this.from;
    }
    getId(): number {
        return this.id;
    }
    reset():void{
        this.color = "black";
        this.width = 2;
    }
    constructor(id: number, to: number, from: number, weight?: number) {
        this.id = id;
        this.to = to;
        this.from = from;
        this.weight = weight;
    }
}

export class Node {
    private id: number;
    private adjacencyList: number[]; //index: neighbourId, element -> edgeId, -1 -> no edge from node to neighbour (directed)
    private originalLabel: string; //for resetting if animation changes labels
    label: string;
    x?: number;
    y?: number;
    color = "white";
    constructor(label: string, id: number) {
        this.label = label;
        this.originalLabel = label;
        this.id = id;
        this.adjacencyList = Array(200).fill(-1);
    }
    getId(): number {
        return this.id;
    }
    getEdgeIdConnectingToNeihgbour(neighbourId: number):number{
        return this.adjacencyList[neighbourId];
    }
    removeNeighbour(neighborId: number): void {
        this.adjacencyList[neighborId] = -1;
    }
    addNeighbour(neighborId: number, edgeId: number): void {
        this.adjacencyList[neighborId] = edgeId;
    }
    hasNeighbour(id: number): boolean {
        return this.adjacencyList[id] !== -1;
    }
    reset(): void {
        this.label = this.originalLabel;
        this.color = "white"
    }
}
