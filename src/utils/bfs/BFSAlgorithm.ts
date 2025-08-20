import { animationEdgeInformation, animationNodeInformation, animationState} from "../animation/types";
import { Graph } from "../datastructures/graph";

export default class BFS{
    private graph:Graph;
    constructor(graph: Graph){
        this.graph = graph;
    }
    private markNodeAsVisited(state: animationState, nodeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "visitedNode";
        }
        return newState;
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

    private markEdgeAsNormal(state: animationState, edgeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "normal";
        }
        return newState;
    }

    private updateNodeLabel(state: animationState, nodeId: number, newLabel: string): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].label = newLabel;
        }
        return newState;
    }

    private createInitialState(from: number): animationState {
        const nodeList = this.graph.getNodeList();
        const edgeList = this.graph.getEdgeList();
        const edgeCount = edgeList.length;
        const nodes: (animationNodeInformation | null)[] = Array(nodeList.length).fill(null);
        const edges: (animationEdgeInformation | null)[] = Array(edgeCount).fill(null);
        nodeList.forEach((node, id) => {
            if (!node) return; 
            nodes[id] = {
                id,
                state: "normal",
                label:  `${node.label}`
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
    Run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        //code
        return animationStates;
    }
        
}