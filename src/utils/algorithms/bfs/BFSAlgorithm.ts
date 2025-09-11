import { animationState} from "../../types/animation";
import { Graph } from "../../datastructures/Graph";
import { Queue } from "../../datastructures/Queue";
import Algorithm from "../Algorithm";

export default class BFS extends Algorithm{
    constructor(graph: Graph){
        super(graph);
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
        currentState = this.markNodeAsInQueue(currentState, from);
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
            const currentNodeId = queue.dequeue()!;
            const currentNode = this.graph.getNode(currentNodeId)!;
            currentState = this.markNodeAsVisited(currentState, currentNodeId!);
            currentState.algorithmInfobox = {
            information: `Selecting node from queue: (${this.graph.getLabelOfNode(currentNodeId!)}).`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            for(let nodeId = 0; nodeId < nodes.length; nodeId++){
                if(currentNode.hasEdgeToNode(nodeId)){
                    const edgeId = currentNode.getEdgeIdConnectingToNeihgbour(nodeId)
                    currentState = this.markEdgeAsSelected(currentState, edgeId);
                    currentState.algorithmInfobox = {
                        information: `Checking whether neighbour has been visited yet or in queue.`,
                        dataStructure: {
                                type: "queue",
                                ds: this.getLabelsForQueueRepresentation(queue.toArray())
                            }
                    };
                    animationStates.push(currentState);
                    if(!visited[nodeId]){
                        visited[nodeId] = true;
                        queue.enqueue(nodeId);
                        currentState = this.markNodeAsInQueue(currentState, nodeId);
                        currentState.algorithmInfobox = {
                            information: `neighbour of ${this.graph.getLabelOfNode(currentNodeId!)} hasn't yet been visited and currently not in queue.<hr>putting it in queue.`,
                            dataStructure: {
                                type: "queue",
                                ds: this.getLabelsForQueueRepresentation(queue.toArray())
                            }
                        }
                        animationStates.push(currentState);
                    }
                    currentState = this.markEdgeAsNormal(currentState, edgeId);
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