import Graph from "../datastructures/Graph";
import { Queue } from "../datastructures/Queue";
import {animationEdgeInformation, animationNodeInformation, animationState } from "../types/animation";

export default abstract class Algorithm{
    protected _graph: Graph;

    constructor(graph: Graph){
        this._graph = graph;
    }
    public areConnected(startId: number, targetId: number): boolean {
        if (startId === targetId) return true;

        const visited = new Map<number, boolean>();
        const queue = new Queue<number>(this._graph.nodes.length);

        let currentNode = this._graph.getNode(startId)!;
        queue.enqueue(currentNode.id);
        visited.set(currentNode.id, true);

        while (!queue.IsEmpty) {
            
            currentNode = this._graph.getNode(queue.dequeue()!)!;
            
            for (const neighbourId of currentNode.AdjacencyList) {
                
                const neighbourNode = this._graph.getNode(neighbourId)!;
                
                if (!visited.get(neighbourNode.id)) {
                    if (neighbourId === targetId) {
                        return true;
                    }
                    
                    visited.set(neighbourNode.id, true);
                    queue.enqueue(neighbourNode.id);
                }
            }
        }

        return false;
    }
    protected copyAnimationState(state: animationState): animationState {
        return structuredClone(state);
    }
    protected markEdgeAsSelected(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.edges.get(edgeId)!.state = "selectedEdge";
        return newState;
    }

    protected markEdgeAsPartOfPath(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.edges.get(edgeId)!.state = "partOfPath";
        return newState;
    }

    protected markNodeAsPartOfPath(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state)
        newState.nodes.get(nodeId)!.state = "partOfPath";
        return newState;
    }

    protected markEdgeAsDeselected(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.edges.get(edgeId)!.state = "deselectedEdge";
        return newState;
    }
    protected updateNodeLabel(state: animationState, nodeId: number, newLabel: string): animationState {
        const newState = this.copyAnimationState(state);
        newState.nodes.get(nodeId)!.label = newLabel;
        return newState;
    }
    protected markEdgeAsNormal(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.edges.get(edgeId)!.state = "normal";
        return newState;
    }
    protected markNodeAsVisited(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.nodes.get(nodeId)!.state = "visitedNode";
        return newState;
    }
    protected markNodeAsInStack(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.nodes.get(nodeId)!.state = "inStack";
        return newState;
    }
    protected markNodeAsInQueue(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);        
        newState.nodes.get(nodeId)!.state = "inQueue";
        return newState;
    }
    protected markNodeAsDeselected(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        newState.nodes.get(nodeId)!.state = "deselectedNode";
        return newState;
    }
    protected createInitialState(..._args: any[]): animationState {
        const nodes = new Map<number, animationNodeInformation>();
        const edges = new Map<number, animationEdgeInformation>();
        this._graph.nodes.forEach(node => {
            nodes.set(node.id, {
                id: node.id,
                state: "normal",
                label:  `${node.label}`
            });
        });
        this._graph.edges.forEach(edge => {
            edges.set(edge.id, {
                id: edge.id,
                state: "normal",
                label: `${edge.weight}`
            });
        });

        return { nodes, edges };
    }
    abstract run(..._args: any[]):animationState[];
}