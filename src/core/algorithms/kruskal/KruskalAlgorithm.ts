import { Edge, Graph } from "../../datastructures/Graph";
import {animationState} from "../../types/animation";
import { DisjointSet } from "../../datastructures/DisjointSet";
import { Queue } from "../../datastructures/Queue";
import Algorithm from "../Algorithm";

export default class Kruskal extends Algorithm{
    constructor(graph: Graph){
        super(graph)
    } 
    run(nodeId: number): animationState[] {
        const animationStates: animationState[] = [];
        const componentEdges = this.findComponentEdgeList(nodeId);
        const sortedEdges = componentEdges.sort((a, b) => {
            return a.weight! - b.weight!;
        })

        let currentState = this.createInitialState();
        currentState.algorithmInfobox = {
            information: "We first sort the edges in ascending order by their weight."
        }
        animationStates.push(currentState);
        
        const components = new DisjointSet(sortedEdges.length);
        let i = 0;
        let res = 0;
        
        while(i < sortedEdges.length){
            const fromComp = components.find(sortedEdges[i]!.from);
            const toComp = components.find(sortedEdges[i]!.to);
            currentState = this.markEdgeAsSelected(currentState, sortedEdges[i]!.id);
            currentState.algorithmInfobox = {
                information: "We check if the selected edge forms a cycle, if so we don't include it in the spanning tree, otherwise we include it."
            }
            animationStates.push(currentState);
            if(fromComp !== toComp){
                components.union(fromComp, toComp);
                currentState = this.markEdgeAsPartOfPath(currentState, sortedEdges[i]!.id);
                currentState = this.markNodeAsPartOfPath(currentState, sortedEdges[i]!.from);
                currentState = this.markNodeAsPartOfPath(currentState, sortedEdges[i]!.to);
                currentState.algorithmInfobox = {
                    information: "The selected edge does not form a cycle. It will be part of the minimum spanning tree."
                }
                animationStates.push(currentState);
                res += sortedEdges[i]!.weight!;
            }else{
                currentState = this.markEdgeAsDeselected(currentState, sortedEdges[i]!.id);
                currentState.algorithmInfobox = {
                    information: "The selected edge does form a cycle as both nodes connected by the edge are in the same component. It will be part of the minimum spanning tree."
                }
                animationStates.push(currentState);
            }
            i++;
        }
        currentState = this.copyAnimationState(currentState);
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Minimum spanning tree of the weighted graph has been created with a total weight of: ${res}.`
        }
        animationStates.push(currentState);
        return animationStates;
    }
    private findComponentEdgeList(nodeId: number):Edge[]{

        const edges: Edge[] = [];

        const edgeInArray = new Map<Edge, boolean>();
        const queue = new Queue<number>(this._graph.nodes.length);
        
        const visited = new Map<number, boolean>();
        
        queue.enqueue(nodeId);
        visited.set(nodeId, true);
        
        while(!queue.IsEmpty){
            const currentNodeId = queue.dequeue()!;
            const currentNode = this._graph.getNode(currentNodeId)!;
           
            for(const node of this._graph.nodes){
                const nodeId = node.id;
                if(currentNode.hasEdgeToNode(nodeId) && !visited.get(nodeId)){
                    queue.enqueue(nodeId)
                    visited.set(nodeId, true);
                }
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(nodeId)!;
                if(currentNode.hasEdgeToNode(nodeId) && !edgeInArray.get(this._graph.getEdge(edgeId)!)){
                    edges.push(this._graph.getEdge(edgeId)!);
                    edgeInArray.set(this._graph.getEdge(edgeId)!, true);
                }
            }
        }
        return edges;
    }
}