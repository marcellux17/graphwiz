import { Graph, WeightedGraph } from "../datastructures/Graph";
import {animationEdgeInformation, animationNodeInformation, animationState } from "../types/animation";

export default abstract class Algorithm{
    protected graph: WeightedGraph|Graph;

    constructor(graph: WeightedGraph|Graph){
        this.graph = graph;
    }
    protected CopyAnimationState(state: animationState): animationState {
        return JSON.parse(JSON.stringify(state));
    }
    protected markEdgeAsSelected(state: animationState, edgeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "selectedEdge";
        }
        return newState;
    }

    protected markEdgeAsPartOfPath(state: animationState, edgeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "partOfPath";
        }
        return newState;
    }

    protected markNodeAsPartOfPath(state: animationState, nodeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "partOfPath";
        }
        return newState;
    }

    protected markEdgeAsDeselected(state: animationState, edgeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "deselectedEdge";
        }
        return newState;
    }
    protected updateNodeLabel(state: animationState, nodeId: number, newLabel: string): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].label = newLabel;
        }
        return newState;
    }
    protected markEdgeAsNormal(state: animationState, edgeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.edges[edgeId]) {
            newState.edges[edgeId].state = "normal";
        }
        return newState;
    }
    protected markNodeAsVisited(state: animationState, nodeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "visitedNode";
        }
        return newState;
    }
    protected markNodeAsInStack(state: animationState, nodeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "inStack";
        }
        return newState;
    }
    protected markNodeAsInQueue(state: animationState, nodeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "inQueue";
        }
        return newState;
    }
    protected markNodeAsDeselected(state: animationState, nodeId: number): animationState {
        const newState = this.CopyAnimationState(state);
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "deselectedNode";
        }
        return newState;
    }
    protected createInitialState(..._args: any[]): animationState {
        const nodeList = this.graph.getNodeList();
        const edgeList = this.graph.getEdgeList();
        const nodes: (animationNodeInformation | null)[] = Array(nodeList.length).fill(null);
        const edges: (animationEdgeInformation | null)[] = Array(edgeList.length).fill(null);
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
    abstract run(..._args: any[]):animationState[];
}