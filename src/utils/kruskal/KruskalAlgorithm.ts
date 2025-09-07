import { Edge, WeightedGraph } from "../datastructures/Graph";
import { animationEdgeInformation, animationNodeInformation, animationState} from "../types/animation";
import { DisjointSet } from "../datastructures/DisjointSet";
import { Queue } from "../datastructures/Queue";

export default class Kruskal{
    private graph:WeightedGraph;
    constructor(graph: WeightedGraph){
        this.graph = graph;
    }
    private markEdgeAsSelected(state: animationState, edgeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "selectedEdge";
        }
        return newState;
    }

    private markEdgeAsPartOfPath(state: animationState, edgeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "partOfPath";
        }
        return newState;
    }

    private markNodeAsPartOfPath(state: animationState, nodeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "partOfPath";
        }
        return newState;
    }

    private markEdgeAsDeselected(state: animationState, edgeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "deselectedEdge";
        }
        return newState;
    }
    private createInitialState(): animationState {
        const nodeList = this.graph.getNodeList();
        const edgeList = this.graph.getEdgeList();
        const nodes: (animationNodeInformation | null)[] = Array(nodeList.length).fill(null);
        const edges: (animationEdgeInformation | null)[] = Array(edgeList.length).fill(null);
        nodeList.forEach((node, id) => {
            if (!node) return; 
            nodes[id] = {
                id,
                state: "normal",
                label: node.label
            };
        });
        edgeList.forEach((edge, id) => {
            if (!edge) return;
            edges[id] = {
                id,
                state: "normal",
                label: `${edge.getWeight()}`
            };
        });

        return { nodes, edges };
    }
    private findComponentEdgeList(nodeId: number):(Edge|null)[]{
        const edgeList = this.graph.getEdgeList();
        const nodeList = this.graph.getNodeList();
        const edges = new Array(edgeList.length).fill(null);
        const queue = new Queue<number>(nodeList.length);
        const visited:boolean[] = new Array(nodeList.length).fill(false);
        queue.enqueue(nodeId);
        visited[nodeId] = true;
        while(!queue.isEmpty()){
            const currentNodeId = queue.dequeue()!;
            const adjacencyList = this.graph.getNode(currentNodeId).getAdjacencyList();
            for(let neighbourId = 0; neighbourId < adjacencyList.length; neighbourId++){
                const edgeId = adjacencyList[neighbourId];
                if(edgeId !== -1 && !visited[neighbourId]){
                    queue.enqueue(neighbourId)
                    visited[neighbourId] = true;
                }
                if(edgeId !== -1 && edges[edgeId] === null){
                    edges[edgeId] = this.graph.getEdge(edgeId);
                }
            }
        }
        return edges;
    }
    Run(nodeId: number): animationState[] {
        const animationStates: animationState[] = [];
        const componentEdges = this.findComponentEdgeList(nodeId);
        const sortedEdges = componentEdges.sort((a, b) => {
            if(a === null)return 1;
            if(b === null)return -1;
            return a.getWeight()!-b.getWeight()!;
        })

        let currentState = this.createInitialState();
        currentState.algorithmInfobox = {
            information: "We first sort the edges in ascending order by their weight."
        }
        animationStates.push(currentState);
        const components = new DisjointSet(sortedEdges.length);
        let i = 0;
        let res = 0;
        while(sortedEdges[i] !== null){
            const fromComp = components.find(sortedEdges[i]!.getFrom());
            const toComp = components.find(sortedEdges[i]!.getTo());
            currentState = this.markEdgeAsSelected(currentState, sortedEdges[i]!.getId());
            currentState.algorithmInfobox = {
                information: "We check if the selected edge forms a cycle, if so we don't include it in the spanning tree, otherwise we include it."
            }
            animationStates.push(currentState);
            if(fromComp !== toComp){
                components.union(fromComp, toComp);
                currentState = this.markEdgeAsPartOfPath(currentState, sortedEdges[i]!.getId());
                currentState = this.markNodeAsPartOfPath(currentState, sortedEdges[i]!.getFrom());
                currentState = this.markNodeAsPartOfPath(currentState, sortedEdges[i]!.getTo());
                currentState.algorithmInfobox = {
                    information: "The selected edge does not form a cycle. It will be part of the minimum spanning tree."
                }
                animationStates.push(currentState);
                res += sortedEdges[i]!.getWeight()!;
            }else{
                currentState = this.markEdgeAsDeselected(currentState, sortedEdges[i]!.getId());
                currentState.algorithmInfobox = {
                    information: "The selected edge does form a cycle as both nodes connected by the edge are in the same component. It will be part of the minimum spanning tree."
                }
                animationStates.push(currentState);
            }
            i++;
        }
        currentState = JSON.parse(JSON.stringify(currentState));
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Minimum spanning tree of the weighted graph has been created with a total weight of: ${res}.`
        }
        animationStates.push(currentState);
        return animationStates;
    }
}