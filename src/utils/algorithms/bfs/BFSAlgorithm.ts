import { animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import { Graph } from "../../datastructures/Graph";
import { Queue } from "../../datastructures/Queue";

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
    private markNodeAsInQueue(state: animationState, nodeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "inQueue";
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
    private createInitialState(): animationState {
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
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this.graph.getLabelOfNode(id));
    }
    Run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        const nodes = this.graph.getNodeList();
        const queue = new Queue<number>(nodes.length);
        const visited = Array(nodes.length).fill(false);

        let currentState = this.createInitialState();
        currentState = this.markNodeAsVisited(currentState, from);
        currentState.algorithmInfobox = {
            information: `Starting node has been put in queue to run bfs.`
        }
        animationStates.push(currentState);

        visited[from] = true;
        queue.enqueue(from);
        while(!queue.isEmpty()){
            currentState = JSON.parse(JSON.stringify(currentState));
            currentState.algorithmInfobox = {
            information: `Selecting node from queue.<hr>calling Dequeue()`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            const currentNodeId = queue.dequeue();
            currentState = this.markNodeAsVisited(currentState, currentNodeId!);
            currentState.algorithmInfobox = {
            information: `Selecting node from queue: (${this.graph.getLabelOfNode(currentNodeId!)}).`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            const adjacencyList = this.graph.getNode(currentNodeId!).getAdjacencyList();
            for(let i = 0; i < nodes.length; i++){
                if(adjacencyList[i] !== -1){
                    currentState = this.markEdgeAsSelected(currentState, adjacencyList[i]);
                    currentState.algorithmInfobox = {
                        information: `Checking whether neighbour has been visited yet or in queue.`,
                        dataStructure: {
                                type: "queue",
                                ds: this.getLabelsForQueueRepresentation(queue.toArray())
                            }
                    };
                    animationStates.push(currentState);
                    if(!visited[i]){
                        visited[i] = true;
                        queue.enqueue(i);
                        currentState = this.markNodeAsInQueue(currentState, i);
                        currentState.algorithmInfobox = {
                            information: `neighbour of ${this.graph.getLabelOfNode(currentNodeId!)} hasn't yet been visited and currently not in queue.<hr>putting it in queue.`,
                            dataStructure: {
                                type: "queue",
                                ds: this.getLabelsForQueueRepresentation(queue.toArray())
                            }
                        }
                        animationStates.push(currentState);
                    }
                    currentState = this.markEdgeAsNormal(currentState, adjacencyList[i]);
                }
            }
        }
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr> All nodes reachable from starting node have been visited since the queue is empty!`
        }
        animationStates.push(currentState);
        return animationStates;
    }
}