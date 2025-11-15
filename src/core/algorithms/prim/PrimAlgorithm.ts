import Graph from "../../datastructures/Graph";
import { animationEdgeInformation, animationNodeInformation, animationState } from "../../types/animation";
import { MinPriorityQueue, Queue } from "../../datastructures/Queue";
import Algorithm from "../Algorithm";

export default class Prim extends Algorithm {
    constructor(graph: Graph) {
        super(graph);
    }
    run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        const priorityQueue = this.fillQueue(from);
        const MST = new Map<number, boolean>();
        const edgesConnectingNodesToMST = new Map<number, number>();
        const mstEdges = new Set<number>();
        const componentEdgeIds = new Set<number>();
        let res = 0;

        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
            information: `We assign each node a value of ∞, except for the starting node which will get a value of 0. It denotes the cost of including that node in the MST.
            Inside the loop we retrieve the element with the minimum cost from the priority-queue. With the retrieval the node will be included in the MST.
            We also check if the adjacent nodes that are not yet in the MST can be assigned a smaller cost through the current node. If so we update the priority-queue. We repeat until there are no more
            nodes left in the priority queue.`
        };
        animationStates.push(currentState);

        while (!priorityQueue.isEmpty) {
            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: "We call dequeue() on the priority-queue to retrieve the node with the smallest cost of including it in the MST."
            };
            animationStates.push(currentState);

            const currentElement = priorityQueue.extractMin()!;
            const currentNode = this._graph.getNode(currentElement.id)!;

            currentState = this.markNodeAsPartOfPath(currentState, currentElement.id);
            if (edgesConnectingNodesToMST.has(currentElement.id)) {
                const edgeId = edgesConnectingNodesToMST.get(currentElement.id)!;
                currentState = this.markEdgeAsPartOfPath(currentState, edgeId);
                res += this._graph.getEdge(edgeId)!.weight!;
                mstEdges.add(edgeId);
            }
            currentState.algorithmInfobox = {
                information: "The node with the minimum cost to include it in the MST has been retrieved from the priority-queue."
            };
            animationStates.push(currentState);

            MST.set(currentElement.id, true);

            for (const nodeId of currentNode.AdjacencyList) {
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(nodeId)!;
                componentEdgeIds.add(edgeId);
                const w = this._graph.getEdge(edgeId)!.weight!;

                currentState = this.markEdgeAsSelected(currentState, edgeId);
                currentState.algorithmInfobox = {
                    information: "Checking whether the adjacent node is already in the MST. And if so, whether the weight of the edge connecting it to the current node is smaller the one previously set."
                };
                animationStates.push(currentState);

                if (!MST.get(nodeId)) {
                    const currentCost = priorityQueue.getElement(nodeId)!.value;
                    if (w < currentCost) {
                        priorityQueue.update(nodeId, w);
                        edgesConnectingNodesToMST.set(nodeId, edgeId);
                        currentState = this.updateNodeLabel(currentState, nodeId, `${this._graph.getNode(nodeId)!.label}(${w})`);
                        currentState.algorithmInfobox = {
                            information: `We can improve the cost of connecting the adjacent node to the MST.<hr>
                            ${w} < ${currentCost === Infinity ? `∞` : currentCost}`
                        };
                        animationStates.push(currentState);
                    } else {
                        currentState = this.copyAnimationState(currentState);
                        currentState.algorithmInfobox = {
                            information: `We can't improve the cost of connecting the adjacent node to the MST.`
                        };
                        animationStates.push(currentState);
                    }
                    currentState = this.markEdgeAsNormal(currentState, edgeId);
                } else {
                    const edge = this._graph.getEdge(edgeId)!;
                    const from = edge.from;
                    const to = edge.to;
                    if (edgesConnectingNodesToMST.get(to) === edgeId || edgesConnectingNodesToMST.get(from) === edgeId) {
                        currentState = this.markEdgeAsPartOfPath(currentState, edgeId);
                    } else {
                        currentState = this.markEdgeAsNormal(currentState, edgeId);
                    }
                    currentState.algorithmInfobox = {
                        information: "Adjacent node is already in the MST. We don't do anything with it."
                    };
                    animationStates.push(currentState);
                }
            }
        }

        currentState = this.copyAnimationState(currentState);
        componentEdgeIds.forEach(edgeId => {
            if (!mstEdges.has(edgeId)) {
                currentState = this.markEdgeAsDeselected(currentState, edgeId);
            }
        });
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Minimum spanning tree of the weighted graph has been created with a total weight of: ${res}.`
        };
        animationStates.push(currentState);

        return animationStates;
    }
    override createInitialState(from: number): animationState {
        const nodes = new Map<number, animationNodeInformation>();
        const edges = new Map<number, animationEdgeInformation>();

        this._graph.nodes.forEach((node) => {
            nodes.set(node.id, {
                id: node.id,
                state: "normal",
                label: node.id === from ? `${node.label}(0)` : `${node.label}(∞)`
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
    private fillQueue(from: number): MinPriorityQueue {
        const nodes = this._graph.nodes;
        const bfsQueue = new Queue<number>(nodes.length);
        const returnQueue = new MinPriorityQueue(nodes.length);
        const visited = new Map<number, boolean>();

        visited.set(from, true);
        bfsQueue.enqueue(from);

        while (!bfsQueue.IsEmpty) {
            const currentNodeId = bfsQueue.dequeue()!;
            const currentNode = this._graph.getNode(currentNodeId)!;

            if (currentNodeId === from) {
                returnQueue.insert({ id: currentNodeId, value: 0 });
            } else {
                returnQueue.insert({ id: currentNodeId, value: Infinity });
            }

            for (const neighbourId of currentNode.AdjacencyList) {
                if (!visited.get(neighbourId)) {
                    bfsQueue.enqueue(neighbourId);
                    visited.set(neighbourId, true);
                }
            }
        }
        return returnQueue;
    }
}