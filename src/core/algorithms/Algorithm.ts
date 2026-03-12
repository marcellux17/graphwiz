import { VisualConfig } from "../animation/Config";
import Graph from "../datastructures/Graph";
import { Queue } from "../datastructures/Queue";
import { animationState } from "../types/animation";

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

        while (!queue.isEmpty) {
            
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
    protected markEdgeAsSelected(state: animationState, edgeId: number): animationState {
        const newState: animationState = {graph: state.graph.clone(), algorithmInfobox: state.algorithmInfobox};
        
        const edge = newState.graph.getEdge(edgeId)!;
        edge.color = VisualConfig.edgeColors.selected;
        edge.width = VisualConfig.edgeWidths.selected;
        
        return newState;
    }

    protected markEdgeAsPartOfPath(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const edge = newState.graph.getEdge(edgeId)!;
        edge.color = VisualConfig.edgeColors.path;
        edge.width = VisualConfig.edgeWidths.path;
        
        return newState;
    }

    protected markNodeAsPartOfPath(state: animationState, nodeId: number): animationState {
        const newState: animationState = { graph: state.graph.clone(), algorithmInfobox: state.algorithmInfobox };
        
        const node = newState.graph.getNode(nodeId)!;
        node.color = VisualConfig.nodeColors.path;
        
        return newState;
    }

    protected markEdgeAsDeselected(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const edge = newState.graph.getEdge(edgeId)!;
        edge.color = VisualConfig.edgeColors.deselected;
        edge.width = 2;
        
        return newState;
    }
    protected updateNodeLabel(state: animationState, nodeId: number, newLabel: string): animationState {
        const newState = this.copyAnimationState(state);
        
        const node = newState.graph.getNode(nodeId)!;
        node.label = newLabel;
        
        return newState;
    }
    protected markEdgeAsNormal(state: animationState, edgeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const edge = newState.graph.getEdge(edgeId)!;
        edge.color = VisualConfig.edgeColors.normal;
        edge.width = 2;
        
        return newState;
    }
    protected markNodeAsVisited(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const node = newState.graph.getNode(nodeId)!;
        node.color = VisualConfig.nodeColors.visited;
        
        return newState;
    }
    protected markNodeAsInStack(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const node = newState.graph.getNode(nodeId)!;
        node.color = VisualConfig.nodeColors.stack;
        return newState;
    }
    protected markNodeAsInQueue(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const node = newState.graph.getNode(nodeId)!;
        node.color = VisualConfig.nodeColors.queue;
        
        return newState;
    }
    protected markNodeAsDeselected(state: animationState, nodeId: number): animationState {
        const newState = this.copyAnimationState(state);
        
        const node = newState.graph.getNode(nodeId)!;
        node.color = VisualConfig.nodeColors.deselected;
        
        return newState;
    }
    protected copyAnimationState(state: animationState): animationState {
        return { graph: state.graph.clone(), algorithmInfobox: state.algorithmInfobox };
    }
    protected createInitialState(..._args: any[]): animationState {
        return {graph: this._graph.clone()};
    }
    abstract run(..._args: any[]):animationState[];
}