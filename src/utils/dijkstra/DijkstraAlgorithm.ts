import { Node, WeightedGraph } from "../datastructures/graph";
import { MinPriorityQueue } from "../datastructures/queue";
import { algorithmInfoBoxState, animationEdgeInformation, animationNodeInformation, animationState} from "../animation/types";


export type NodeWithDistance = {
    id: number;
    estimated_distance: number;
    label: string;
}
export default class Dijkstra{
    private graph:WeightedGraph;
    constructor(graph: WeightedGraph){
        this.graph = graph;
    }
    private createPathHighLightState(state: animationState, from: number,to: number, previous: number[]): animationState {
        let newState = state;
        let currentNode:Node|null = this.graph.getNode(to);
        let algorithmStateInfo: algorithmInfoBoxState = {
            information: `shortest path found between ${this.graph.getLabelOfNode(from)} and ${this.graph.getLabelOfNode(to)}`,
            dataStructure: {
                type: "priority-queue",
                ds: []
            }
        }
        newState.algorithmInfobox = algorithmStateInfo;
        while (currentNode !== null) {
            const currentNodeId = currentNode.getId();
            const nextNodeId = previous[currentNodeId];
            newState = this.markNodeAsPartOfPath(newState, currentNodeId);
            if (nextNodeId !== -1) {
                const edgeId = currentNode.getAdjacencyList()[nextNodeId];
                newState = this.markEdgeAsPartOfPath(newState, edgeId)
                currentNode = this.graph.getNode(nextNodeId);
            } else {
                currentNode = null;
            }
        }
        return newState;
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
        const nodes: (animationNodeInformation | null)[] = Array(nodeList.length).fill(null);
        const edges: (animationEdgeInformation | null)[] = Array(edgeList.length).fill(null);
        nodeList.forEach((node, id) => {
            if (!node) return; 
            nodes[id] = {
                id,
                state: "normal",
                label: id === from ? node.label : `${node.label}(∞)`
            };
        });
        edgeList.forEach((edge, id) => {
            if (!edge) return;
            edges[id] = {
                id,
                state: "normal",
                label: `${edge.weight}`
            };
        });

        return { nodes, edges };
    }

    Run(from: number, to: number): animationState[] {
        const estimatedDistances = new MinPriorityQueue<NodeWithDistance>((a, b) => a.estimated_distance - b.estimated_distance); //estimated distances
        const animationStates: animationState[] = [];
        const nodeList = this.graph.getNodeList();
        const visited = Array(nodeList.length).fill(false);
        const previousNode = Array(nodeList.length).fill(-1);//-1 = cannot be reached otherwise at a specific index gives us the node through which we can reach it
        this.graph.getNodeList().forEach((node) => {
            if (node && node.getId() !== from) {
                estimatedDistances.insert({
                    id: node.getId(),
                    estimated_distance: Number.MAX_VALUE,
                    label: this.graph.getLabelOfNode(node.getId())
                });
            } else if(node){
                estimatedDistances.insert({
                    id: node.getId(),
                    estimated_distance: 0,
                    label: this.graph.getLabelOfNode(node.getId())
                });
            }
        });
        let currentState = this.createInitialState(from);
        animationStates.push(currentState);
        let currentNode: NodeWithDistance = estimatedDistances.extractMin();
        visited[currentNode.id] = true
        currentState = this.markNodeAsVisited(currentState, currentNode.id);
        currentState.algorithmInfobox = {
            information: "Selecting node from priority queue with the smallest distance",
            dataStructure: {
                type: "priority-queue",
                ds: estimatedDistances.getArray()
            }
        }
        animationStates.push(currentState);
        while (currentNode.id !== to) {
            const node = this.graph.getNode(currentNode.id);
            let previousEdgeId:number|null = null;
            const adjacencyList = node.getAdjacencyList();
            for(let neighbourId = 0; neighbourId < adjacencyList.length; neighbourId++){
                if(previousEdgeId !== null){
                    currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
                }
                const edgeIdConnectedToNeighbour = adjacencyList[neighbourId];
                if(edgeIdConnectedToNeighbour === -1){
                    continue;
                }
                if (!visited[neighbourId]) {
                    const weightOfEdge = this.graph.getEdge(edgeIdConnectedToNeighbour).weight!;
                    const estimatedDistance = estimatedDistances.getValue(neighbourId);
                    const distanceThroughCurrentNode = currentNode.estimated_distance + weightOfEdge;
                    currentState = this.markEdgeAsSelected(currentState, edgeIdConnectedToNeighbour)
                    currentState.algorithmInfobox = {
                        information: `Checking for adjacent nodes if the distance through the node currently being visited is smaller than the distance previously set.<br> 
                        is it true??:<br>${currentNode.estimated_distance} + ${weightOfEdge} < ${estimatedDistance == Number.MAX_VALUE ? "∞": estimatedDistance}`,
                        dataStructure: {
                            type: "priority-queue",
                            ds: estimatedDistances.getArray()
                        }
                    }
                    animationStates.push(currentState);
                    if (distanceThroughCurrentNode < estimatedDistance) {
                        previousNode[neighbourId] = currentNode.id;
                        currentState = this.updateNodeLabel(currentState, neighbourId, `${this.graph.getLabelOfNode(neighbourId)}(${distanceThroughCurrentNode})`)
                        currentState.algorithmInfobox = {
                            information: `distance through current node < current smallest distance to neighbour (${distanceThroughCurrentNode} < ${estimatedDistance == Number.MAX_VALUE ? "∞": estimatedDistance})`,
                            dataStructure: {
                                type: "priority-queue",
                                ds: estimatedDistances.getArray()
                            }
                        };
                        animationStates.push(currentState);
                        estimatedDistances.update(neighbourId, distanceThroughCurrentNode);
                    }
                    previousEdgeId = edgeIdConnectedToNeighbour;
                }
            }
            if(previousEdgeId !== null){
                currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
            }
            visited[currentNode.id] = true
            currentNode = estimatedDistances.extractMin();
            currentState = this.markNodeAsVisited(currentState, currentNode.id);
            currentState.algorithmInfobox = {
                information: "Selecting node from priority queue with the smallest distance",
                dataStructure: {
                    type: "priority-queue",
                    ds: estimatedDistances.getArray()
                }
            };
            animationStates.push(currentState);
        }
        animationStates.push(this.createPathHighLightState(currentState, from, to, previousNode));
        return animationStates;
    }
}