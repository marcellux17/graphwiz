import { v4 as uuidv4 } from "uuid";
import Queue from "./queue";
import { MinPriorityQueue } from "./queue";
export type WithIdAndDistance = {
    id: string;
    estimated_distance: number;
};
export type stepType =
    | "nodeLabelUpdate"
    | "edgeSelected"
    | "nodeVisited"
    | "finalPath"; //for dijkstra animations
export class undirectedGraph {
    private Nodes: Map<string, Node>; //nodeId is the key
    private Labels: Map<string, boolean>;
    private i: number = 1; //just so nodes have different labels, though user can change them (its just for visuals)
    private numberOfNodes: number = 0;
    //for keeping track of animation states in depth first search
    private EdgeList: Map<string, Edge> = new Map<string, Edge>();
    constructor() {
        this.Nodes = new Map<string, Node>();
        this.Labels = new Map<string, boolean>();
    }
    AddNode(): { id: string; label: string } {
        const id = uuidv4();
        const label = `${this.i}`;
        const newNode = new Node(label, id);
        this.Labels.set(label, true);
        this.Nodes.set(id, newNode);
        this.i++;
        this.numberOfNodes++;
        return { id, label };
    }
    //for debugging purposes
    PrintGraph(): void {
        for (const [nodeId, node] of this.Nodes) {
            console.log(`Node: ${node.label}`);
            for (const [nId, is_neighbour] of node.AdjacencyList) {
                console.log(`Neighbour: ${this.Nodes.get(nId)?.label}`);
            }
            console.log("---------------------");
        }
    }
    // LabelExist(label: string):boolean{
    //     const l = this.Labels.get(label);
    //     return l || false;
    // }
    ModifyLabelOfNode(id: string, new_label: string):void {
        const node = this.Nodes.get(id)!;
        let prevLabel = node.label;
        this.Labels.delete(prevLabel);
        node.label = new_label;
        this.Labels.set(new_label, true);
    }
    ModifyWeight(id:string, new_weight: number):void{
        const edge = this.EdgeList.get(id);
        edge!.weight = new_weight;
    }
    AddEdge(from: string, to: string, weight: number | undefined): string {
        const id = uuidv4();
        const firstNode = this.Nodes.get(from)!;
        const secondNode = this.Nodes.get(to)!;
        firstNode.AddNeighbour(to, id);
        secondNode.AddNeighbour(from, id);
        this.EdgeList.set(id, new Edge(id, to, from, weight));
        return id;
    }
    GetEdgeWeight(id: string):number{
        return this.EdgeList.get(id)!.weight!;
    }
    RemoveEdge(from: string, to: string) {
        const firstNode = this.Nodes.get(from)!;
        const secondNode = this.Nodes.get(to)!;
        const edgeId = firstNode.RemoveNeighbour(to);
        secondNode.RemoveNeighbour(from);
        this.EdgeList.delete(edgeId);
    }
    DeleteNode(id: string): void {
        const neighbours = this.Nodes.get(id)!.AdjacencyList;
        this.Nodes.delete(id);
        for (const neighbourId of neighbours.keys()) {
            const node = this.Nodes.get(neighbourId)!;
            const edgeId = node.RemoveNeighbour(id);
            this.EdgeList.delete(edgeId);
        }
    }
    BFS(startingNodeId: string): string[] {
        const queue = new Queue<string>(this.numberOfNodes);
        const states: string[] = [];
        const visited = new Map<string, boolean>();
        let prevState = new Map<string, boolean>();
        //setting each node to false in prevState is only necessary because of the playbackbutton: we need to know which nodes not to color
        this.Nodes.forEach((node, nodeId) => {
            prevState.set(nodeId, false);
        });
        queue.Enqueue(startingNodeId);
        visited.set(startingNodeId, true);
        while (!queue.isEmpty()) {
            const currentElementId = queue.Dequeue()!;
            states.push(currentElementId);
            const currentElement = this.Nodes.get(currentElementId)!;
            for (const neighbourId of currentElement.AdjacencyList.keys()) {
                if (!visited.get(neighbourId)) {
                    queue.Enqueue(neighbourId);
                    visited.set(neighbourId, true);
                }
            }
        }
        return states;
    }
    DFS(startingNodeId: string): string[] {
        const states:string[] = [];
        const visited = new Map<string, boolean>();
        this.DFS_recursion(startingNodeId, visited, states);
        return states;
    }
    private DFS_recursion(
        nodeId: string,
        visited: Map<string, boolean>,
        states: string[]
    ): void {
        const currentElement = this.Nodes.get(nodeId);
        visited.set(nodeId, true);
        states.push(nodeId);
        for (const neighbourId of currentElement!.AdjacencyList.keys()) {
            if (!visited.get(neighbourId)) {
                this.DFS_recursion(neighbourId, visited, states);
            }
        }
        return;
    }
    GetLabelOfNode(id: string){
        return this.Nodes.get(id)?.label;
    }
    Dijkstra(from: string, to: string){
        

    }
    areConnected( startId: string, targetId: string): boolean {
        if (startId === targetId) return true;
        const visited = new Map<string, boolean>();
        const queue = new Queue<string>(this.numberOfNodes);
        queue.Enqueue(startId);
        visited.set(startId, true);
        while (!queue.isEmpty()) {
            const currentId = queue.Dequeue()!;
            const currentNode = this.Nodes.get(currentId)!;
            for (const neighborId of currentNode.AdjacencyList.keys()) {
                if (neighborId === targetId) return true;
                if (!visited.has(neighborId)) {
                    visited.set(neighborId, true);
                    queue.Enqueue(neighborId);
                }
            }
        }
        return false;
    }

}
class Edge {
    id: string;
    weight: number | undefined;
    to: string;
    from: string;
    constructor(id: string, to: string, from: string, weight: number | undefined) {
        this.id = id;
        this.to = to;
        this.from = from;
        this.weight = weight;
    }
}
class Node {
    label: string;
    id: string;
    AdjacencyList: Map<string, string>; //key: neighbourId, value: edgeId

    constructor(label: string, id: string) {
        this.label = label;
        this.id = id;
        this.AdjacencyList = new Map<string, string>();
    }

    HasNeighbour(id: string): boolean {
        const isNeighbour = this.AdjacencyList.get(id);
        return isNeighbour !== undefined || false;
    }
    RemoveNeighbour(id: string): string {
        let edgeId = this.AdjacencyList.get(id);
        this.AdjacencyList.delete(id);
        return edgeId!;
    }
    AddNeighbour(id: string, edgeId: string): void {
        this.AdjacencyList.set(id, edgeId);
    }
}
