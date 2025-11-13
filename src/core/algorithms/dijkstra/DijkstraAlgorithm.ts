import { Graph } from "../../datastructures/Graph.ts";
import { MinPriorityQueue } from "../../datastructures/Queue.ts";
import { algorithmInfoBoxState, animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation.ts";
import Algorithm from "../Algorithm.ts";

export default class Dijkstra extends Algorithm{
    constructor(graph: Graph){
        super(graph)
    } 
    run(from: number, to: number): animationState[] {
        const animationStates: animationState[] = [];

        const estimatedDistances = new MinPriorityQueue(this._graph.nodes.length);
        const visited = new Map<number, boolean>();
        const previousNode = new Map<number, number>();
        
        this._graph.nodes.forEach((node) => {
            if (node.id !== from) {
                estimatedDistances.insert({
                    id: node.id,
                    value: Infinity
                });
            } else{
                estimatedDistances.insert({
                    id: node.id,
                    value: 0
                });
            }
        });
        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
            information: `We assign each node a value of ∞, except for the starting node which will get a value of 0. It denotes the shortest distance known from the source node.
            Inside the loop we retrieve the element with the minimum distance from the priority-queue. With the retrieval the the shortest distance to the node is finalized.
            We also check if a shorter distance is possible through the current node to the adjacent node. If so we update the priority-queue. We repeat this until the destination is retrieved.`
        }
        animationStates.push(currentState);
        let currentNode = estimatedDistances.extractMin()!;
        visited.set(currentNode.id, true);
        currentState = this.markNodeAsVisited(currentState, currentNode.id);
        currentState.algorithmInfobox = {
            information: "Selecting node from priority queue with the smallest distance",
            dataStructure: {
                type: "priority-queue",
                ds: this.getLabelsForQueueRepresentation(estimatedDistances.toArray())
            }
        }
        animationStates.push(currentState);
        
        while (currentNode.id !== to) {
            let previousEdgeId: number | undefined;
            for(const neighbourId of this._graph.getNode(currentNode.id)!.AdjacencyList){
                if(previousEdgeId !== undefined){
                    currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
                }
                const edgeIdConnectedToNeighbour = this._graph.getNode(currentNode.id)!.getEdgeIdConnectingToNeighbour(neighbourId)!;

                if (!visited.get(neighbourId)) {
                    const weightOfEdge = this._graph.getEdge(edgeIdConnectedToNeighbour)!.weight!;

                    const estimatedDistance = estimatedDistances.getElement(neighbourId)!.value;
                    
                    const distanceThroughCurrentNode = currentNode.value + weightOfEdge;
                    
                    currentState = this.markEdgeAsSelected(currentState, edgeIdConnectedToNeighbour)
                    currentState.algorithmInfobox = {
                        information: `Checking for adjacent nodes if the distance through the node currently being visited is smaller than the distance previously set.<br> 
                        is it true??:<br>${currentNode.value} + ${weightOfEdge} < ${estimatedDistance == Infinity ? "∞": estimatedDistance}`,
                        dataStructure: {
                            type: "priority-queue",
                            ds: this.getLabelsForQueueRepresentation(estimatedDistances.toArray())
                        }
                    }
                    animationStates.push(currentState);
                    
                    if (distanceThroughCurrentNode < estimatedDistance) {
                        previousNode.set(neighbourId, currentNode.id);
                        currentState = this.updateNodeLabel(currentState, neighbourId, `${this._graph.getNode(neighbourId)!.label}(${distanceThroughCurrentNode})`)
                        currentState.algorithmInfobox = {
                            information: `distance through current node < current smallest distance to neighbour (${distanceThroughCurrentNode} < ${estimatedDistance == Infinity ? "∞": estimatedDistance})`,
                            dataStructure: {
                                type: "priority-queue",
                                ds: this.getLabelsForQueueRepresentation(estimatedDistances.toArray())
                            }
                        };
                        animationStates.push(currentState);
                        estimatedDistances.update(neighbourId, distanceThroughCurrentNode);
                    }
                    previousEdgeId = edgeIdConnectedToNeighbour;
                }
            }
            if(previousEdgeId !== undefined){
                currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
            }
            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: "Selecting node from priority queue with the smallest distance.",
                dataStructure: {
                    type: "priority-queue",
                    ds: this.getLabelsForQueueRepresentation(estimatedDistances.toArray())
                }
            };
            animationStates.push(currentState);

            visited.set(currentNode.id, true);
            currentNode = estimatedDistances.extractMin()!;
            
            currentState = this.markNodeAsVisited(currentState, currentNode.id);
            currentState.algorithmInfobox = {
                information: "Node with the smallest from priority-queue selected.",
                dataStructure: {
                    type: "priority-queue",
                    ds: this.getLabelsForQueueRepresentation(estimatedDistances.toArray())
                }
            };
            animationStates.push(currentState);
        }
        animationStates.push(this.createPathHighLightState(currentState, from, to, previousNode));
        return animationStates;
    }
    private createPathHighLightState(state: animationState, from: number,to: number, previous: Map<number, number>): animationState {
        let newState = state;
        let currentNode = this._graph.getNode(to);
        let algorithmStateInfo: algorithmInfoBoxState = {
            information: `Algorithm finished running!<hr>Shortest path found between ${this._graph.getNode(from)!.label} and ${this._graph.getNode(to)!.label}.`,
            dataStructure: {
                type: "priority-queue",
                ds: []
            }
        }
        newState.algorithmInfobox = algorithmStateInfo;
        while (currentNode !== undefined) {
            const currentNodeId = currentNode.id;
            const nextNodeId = previous.get(currentNodeId);
            newState = this.markNodeAsPartOfPath(newState, currentNodeId);
            if (nextNodeId !== undefined) {
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(nextNodeId)!;
                newState = this.markEdgeAsPartOfPath(newState, edgeId);
                currentNode = this._graph.getNode(nextNodeId);
            } else {
                currentNode = undefined;
            }
        }
        return newState;
    }
    override createInitialState(from: number): animationState {
        const nodes = new Map<number, animationNodeInformation>();
        const edges = new Map<number, animationEdgeInformation>();

        this._graph.nodes.forEach((node) => {
            nodes.set(node.id, {
                id: node.id,
                state: "normal",
                label: node.id === from ? node.label : `${node.label}(∞)`
            });
        });
        this._graph.edges.forEach((edge) => {
            edges.set(edge.id, {
                id: edge.id,
                state: "normal",
                label: `${edge.weight}`
            });
        });
        return { nodes, edges };
    }
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this._graph.getNode(id)!.label);
    }
}