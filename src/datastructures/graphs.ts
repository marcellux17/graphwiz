import { v4 as uuidv4 } from "uuid";
import Queue from "./queue";

export class undirectedGraph {
    private Nodes: Map<string, Node>;
    private Labels: Map<string, boolean>;
    private i: number = 1; //just so nodes have different labels, though user can change them (its just for visuals)
    private numberOfNodes:number = 0;
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
    ModifyLabel(id: string, new_label: string) {
        const node = this.Nodes.get(id)!;
        let prevLabel = node.label;
        this.Labels.delete(prevLabel);
        node.label = new_label;
        this.Labels.set(new_label, true);
    }
    AddEdge(from: string, to: string) {
        const firstNode = this.Nodes.get(from)!;
        const secondNode = this.Nodes.get(to)!;
        firstNode.AddNeighbour(to);
        secondNode.AddNeighbour(from);
    }
    RemoveEdge(from: string, to: string) {
        const firstNode = this.Nodes.get(from)!;
        const secondNode = this.Nodes.get(to)!;
        firstNode.RemoveNeighbour(to);
        secondNode.RemoveNeighbour(from);
    }
    DeleteNode(id: string): void {
        const neighbours = this.Nodes.get(id)!.AdjacencyList;
        this.Nodes.delete(id);
        for (const neighbourId of neighbours.keys()) {
            const node = this.Nodes.get(neighbourId)!;
            node.RemoveNeighbour(id);
        }
    }
    //returns an array of hashmaps(each representing a state)
    //where the keys are nodeIds and their values are boolean values representing whether they have been visited or not
    DFS(startingNodeId: string): Map<string, boolean>[] {
        const queue = new Queue<string>(this.numberOfNodes);
        const states:Map<string, boolean>[] = [];
        const visited = new Map<string, boolean>();
        let prevState = new Map<string, boolean>();
        queue.Enqueue(startingNodeId);
        visited.set(startingNodeId, true);
        while(!queue.isEmpty()){
            const currentElementId = queue.Dequeue()!;
            const newstate = new Map<string, boolean>(prevState);
            newstate.set(currentElementId, true),
            prevState = newstate;
            states.push(newstate);
            //getting the node itself 
            const currentElement = this.Nodes.get(currentElementId)!;
            for(const neighbourId of currentElement.AdjacencyList.keys()){
                if(!visited.get(neighbourId)){
                    queue.Enqueue(neighbourId);
                    visited.set(neighbourId, true);
                }
            }
        }
        return states;
    }
}
class Node {
    label: string;
    id: string;
    AdjacencyList: Map<string, boolean>;

    constructor(label: string, id: string) {
        this.label = label;
        this.id = id;
        this.AdjacencyList = new Map<string, boolean>();
    }

    HasNeighbour(id: string): boolean {
        const isNeighbour = this.AdjacencyList.get(id);
        return isNeighbour || false;
    }
    RemoveNeighbour(id: string): void {
        this.AdjacencyList.delete(id);
    }
    AddNeighbour(id: string): void {
        this.AdjacencyList.set(id, true);
    }
}
