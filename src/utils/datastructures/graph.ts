import { Queue } from "./queue";

export class Graph {
    protected nodes: (Node | null)[];
    protected edges: (Edge | null)[];
    protected i: number = 1;
    protected numberOfNodes: number = 0;

    constructor() {
        this.nodes = Array(200).fill(null);
        this.edges = Array(200).fill(null);
    }

    addNode(): number {
        let idx = this.nodes.findIndex((n) => n === null);
        if (idx === -1) idx = this.nodes.length;
        const label = `${this.i++}`;
        this.nodes[idx] = new Node(label, idx);
        this.numberOfNodes++;
        return idx;
    }
    addNodeFromPreset(id: number, x: number, y: number, color: string): void {
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
    addEdge(from: number, to: number): number | undefined {
        if (from === to) return;
        if (this.nodes[from]!.hasNeighbour(to)) return;

        let idx = this.edges.findIndex((e) => e === null);
        if (idx === -1) {
            idx = this.edges.length;
        }
        this.nodes[from]!.addNeighbour(to, idx);
        this.nodes[to]!.addNeighbour(from, idx);
        this.edges[idx] = new Edge(idx, to, from);
        return idx;
    }

    removeEdge(from: number, to: number) {
        const edgeId = this.nodes[from]!.getAdjacencyList()[to];
        if (edgeId === -1) return;
        this.nodes[from]!.removeNeighbour(to);
        this.nodes[to]!.removeNeighbour(from);
        this.edges[edgeId] = null;
    }
    deleteNode(id: number): void {
        const node = this.nodes[id];
        if (!node) return;
        const adjacencyList = node.getAdjacencyList();
        for (let i = 0; i < adjacencyList.length; i++) {
            if (adjacencyList[i] !== -1) {
                this.nodes[i]!.removeNeighbour(id);
                this.edges[adjacencyList[i]] = null;
            }
        }

        this.nodes[id] = null;
        this.numberOfNodes--;
    }
    getEdgeListOfNode(nodeId: number): number[] {
        const node = this.nodes[nodeId];
        if (!node) return [];

        const adjacencyList = node.getAdjacencyList();
        const edges: number[] = [];

        for (let i = 0; i < adjacencyList.length; i++) {
            const edgeId = adjacencyList[i];
            if (edgeId !== -1) {
                edges.push(edgeId);
            }
        }

        return edges;
    }

    getLabelOfNode(id: number): string {
        return this.nodes[id]!.label;
    }

    getNode(id: number): Node {
        return this.nodes[id]!;
    }

    getEdge(id: number): Edge {
        return this.edges[id]!;
    }
    getNodeList(): (Node | null)[] {
        return this.nodes;
    }
    setNodeCoordinates(id: number, x: number, y: number): void {
        const node = this.nodes[id]!;
        node.x = x;
        node.y = y;
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
            const adjacencyList = currentNode.getAdjacencyList();
            for (let i = 0; i < adjacencyList.length; i++) {
                if (currentNode.hasNeighbour(i) && !visited[i]) {
                    if (i === targetId) return true;
                    visited[i] = true;
                    queue.enqueue(i);
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
        return this.edges[id]!.weight!;
    }

    modifyWeight(id: number, newWeight: number): void {
        const edge = this.edges[id];
        if (edge) edge.weight = newWeight;
    }

    override addEdge(
        from: number,
        to: number,
        weight: number = 1
    ): number | undefined {
        if (from === to) return;
        if (this.nodes[from]!.hasNeighbour(to)) return;

        let idx = this.edges.findIndex((e) => e === null);
        if (idx === -1) {
            idx = this.edges.length;
        }
        this.nodes[from]!.addNeighbour(to, idx);
        this.nodes[to]!.addNeighbour(from, idx);
        this.edges[idx] = new Edge(idx, to, from, weight);
        return idx;
    }
}

export class Edge {
    private id: number;
    weight?: number;
    to: number;
    from: number;
    color: string = "black";
    width: number = 2;
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
    private adjacencyList: number[]; //index: neighbourId, element -> edgeId, -1 -> no connection
    private originalLabel: string; //for resetting if animation changes labels
    label: string;
    x?: number;
    y?: number;
    color: string = "white";
    constructor(label: string, id: number) {
        this.label = label;
        this.originalLabel = label;
        this.id = id;
        this.adjacencyList = Array(200).fill(-1);
    }
    getId(): number {
        return this.id;
    }
    getAdjacencyList(): number[] {
        return this.adjacencyList;
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
