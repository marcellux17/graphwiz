import Graph from "../../datastructures/Graph";
import { Queue } from "../../datastructures/Queue";
import { animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class TopologicalSort extends Algorithm{
    constructor(graph: Graph){
        super(graph);
    }
    run(): animationState[] {
        const animationStates: animationState[] = [];
        const queue = new Queue<number>(this._graph.nodes.length);
        let numberOfNodesToBeprocessed = 0;

        const inDegrees = new Map<number, number>();
        for(const node of this._graph.nodes){
            inDegrees.set(node.id, 0);
            numberOfNodesToBeprocessed++;
            
        }
        for(const edge of this._graph.edges){
            const to = edge.to;
            inDegrees.set(to, (inDegrees.get(to) || 0) + 1);
        }
        for(const node of this._graph.nodes){
            if(inDegrees.get(node.id) === 0){
                queue.enqueue(node.id);
            }
        }
        let topologicalOrder = 0;
        let currentState = this.createInitialState();
        currentState.algorithmInfobox = {
            information: `We solve the topological sort using Kahn's algorithm.`
        }
        animationStates.push(currentState);
        currentState = this.copyAnimationState(currentState);
        currentState.algorithmInfobox = {
            information: `In Kahn's algorithm, we repeatedly find vertices with no incoming edges(in-degree 0) and store them in a queue. In each iteration we retrieve one such element from the queue and remove it from the graph:
            We delete the vertex and all of its outgoing edges. This has decreased the the in-degree of its ajdacent nodes. If an adjacent node now has in-degree 0 we add it to the queue. We continue this process until the queue is empty. 
            If the queue is empty but there are still nodes left to be processed it means the graph has a cycle and no topological ordering exists.`
        }
        animationStates.push(currentState);
        for(const nodeID of queue.toArray()){
            currentState = this.markNodeAsInQueue(currentState, nodeID);
        }
        currentState.algorithmInfobox = {
            information: `Queue is created. Nodes with blue color are in queue.`,
            dataStructure: {
                type: "queue",
                ds: this.getLabelsForQueueRepresentation(queue.toArray())
            }
        }
        animationStates.push(currentState);
        while(!queue.isEmpty){
            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: `We retrieve an element from the queue calling Dequeue().`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            const currentNodeId = queue.dequeue()!;
            currentState = this.markNodeAsVisited(currentState, currentNodeId);
            currentState.algorithmInfobox = {
                information: `Dequeue() has been called on queue to retrieve an element. We iterate over all of its outgoing edges to update the in-degrees of the adjacent nodes.`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            
            topologicalOrder++;
            numberOfNodesToBeprocessed--;
            
            const currentNode = this._graph.getNode(currentNodeId)!;
            const outgoingEdges:number[] = [];
            
            for(const neighbourId of currentNode.AdjacencyList){
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(neighbourId)!;
                
                outgoingEdges.push(edgeId);
                currentState = this.markEdgeAsSelected(currentState, edgeId);
                currentState.algorithmInfobox = {
                    information: `We now check if the adjacent node has in-degree 0 with the removal, if so we add it to the queue.`,
                    dataStructure: {
                        type: "queue",
                        ds: this.getLabelsForQueueRepresentation(queue.toArray())
                    }
                }
                animationStates.push(currentState);

                const newInDegree = inDegrees.get(neighbourId)! - 1;
                inDegrees.set(neighbourId, newInDegree);
                if(newInDegree === 0){
                    queue.enqueue(neighbourId);
                    currentState = this.markNodeAsInQueue(currentState, neighbourId);
                    currentState.algorithmInfobox = {
                        information: `With the removal the currently observed adjacent node will have in-degree 0, so we add it to the queue.`,
                        dataStructure: {
                            type: "queue",
                            ds: this.getLabelsForQueueRepresentation(queue.toArray())
                        }
                    }
                    animationStates.push(currentState);
                }
                currentState = this.markEdgeAsNormal(currentState, edgeId);
                
            }
            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: `Now we remove the node and its outgoing edges.`,
                dataStructure: {
                    type: "queue",
                    ds: this.getLabelsForQueueRepresentation(queue.toArray())
                }
            }
            animationStates.push(currentState);
            for(const edgeId of outgoingEdges){
                currentState = this.markEdgeAsDeselected(currentState, edgeId);
            }
            currentState = this.markNodeAsDeselected(currentState, currentNodeId);
            currentState = this.updateNodeLabel(currentState, currentNodeId, `${this._graph.getNode(currentNodeId)!.label}(${topologicalOrder})`)
            animationStates.push(currentState);
        }
        currentState = this.copyAnimationState(currentState);
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Topological sort completed successfully. The graph has been ordered.`
        };
        animationStates.push(currentState);
        if(numberOfNodesToBeprocessed !== 0){
            return [];
        }
        return animationStates;
    }
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this._graph.getNode(id)!.label);
    }    
}