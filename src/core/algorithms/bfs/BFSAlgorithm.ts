import { animationState} from "../../types/animation";
import Graph from "../../datastructures/Graph";
import { Queue } from "../../datastructures/Queue";
import Algorithm from "../Algorithm";

export default class BFS extends Algorithm{
    constructor(graph: Graph){
        super(graph);
    }
    run(from: number): animationState[] {
        const animationStates: animationState[] = [];

        const queue = new Queue<number>(this._graph.nodes.length);
        const visited = new Map<number, boolean>();

        let currentState = this.createInitialState();
        currentState = this.markNodeAsInQueue(currentState, from);
        currentState.algorithmInfobox = {
            information: `Starting node has been put in queue to run bfs.`
        }
        animationStates.push(currentState);

        visited.set(from, true);
        queue.enqueue(from);
        
        while(!queue.IsEmpty){
            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
            information: `Selecting node from queue.<hr>calling Dequeue()`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            
            const currentNodeId = queue.dequeue()!;
            const currentNode = this._graph.getNode(currentNodeId)!;
            
            currentState = this.markNodeAsVisited(currentState, currentNodeId);
            currentState.algorithmInfobox = {
            information: `Selecting node from queue: (${currentNode.label}).`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            
            for(const neighbourId of currentNode.AdjacencyList){
                
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(neighbourId)!;
                
                currentState = this.markEdgeAsSelected(currentState, edgeId);
                currentState.algorithmInfobox = {
                    information: `Checking whether neighbour has been visited yet or in queue.`,
                    dataStructure: {
                            type: "queue",
                            ds: this.getLabelsForQueueRepresentation(queue.toArray())
                        }
                };
                animationStates.push(currentState);
                
                if(!visited.get(neighbourId)){

                    queue.enqueue(neighbourId);
                    visited.set(neighbourId, true);
                    
                    currentState = this.markNodeAsInQueue(currentState, neighbourId);
                    currentState.algorithmInfobox = {
                        information: `Neighbour of ${currentNode.label} hasn't yet been visited and currently not in queue.<hr>putting it in queue.`,
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
        
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr> All nodes reachable from starting node have been visited since the queue is empty!`
        }
        animationStates.push(currentState);
        
        return animationStates;
    }
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this._graph.getNode(id)!.label);
    }
}