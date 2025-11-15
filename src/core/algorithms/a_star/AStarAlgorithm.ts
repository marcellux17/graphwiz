import Graph from "../../datastructures/Graph";
import Node from "../../datastructures/Node";
import { MinPriorityQueue } from "../../datastructures/Queue";
import { algorithmInfoBoxState, animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class AStar extends Algorithm{  
    constructor(graph: Graph){
        super(graph);
    }
    run(from: number, to: number, scale: number): animationState[] {
        const animationStates: animationState[] = [];
        const fScores = new MinPriorityQueue(this._graph.nodes.length); 
        const gScores = new Map<number, number>();
        const visited = new Map<number, boolean>();
        const previousNode = new Map<number, number>();
        const heuristics = new Map<number, number>();
        
        this.measureDistancesFromAllNodesToDestinationNode(to, heuristics, scale);
        
        for(const node of this._graph.nodes){
            const g = (node.id === from ? 0 : Infinity);
            gScores.set(node.id, g);
            
            const f = (node.id === from ? 0 : Infinity) + heuristics.get(node.id)!;
            fScores.insert({ id: node.id, value: f });
        }
        
        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
            information: `We assign each node a value of ∞, except for the starting node which will get a value of 0. It denotes the distance from the starting node plus the heuristic estimate.
            Inside the loop we retrieve the element that has the smallest possible value of g(x) + h(x). With the retrieval the the shortest distance to the node is finalized.
            We also check if a shorter distance is possible through the current node to the adjacent nodes. If so we update the priority-queue. We repeat this until the destination node is retrieved.
            <hr>
            h(x): heuristic, in our case its euclidean distance<br>
            g(x): shortest distance known from source node`
            
        };
        animationStates.push(currentState);
        currentState = this.copyAnimationState(currentState);
        currentState.algorithmInfobox = {
            information: "Selecting node from priority queue with the smallest distance",
            dataStructure: {
                type: "priority-queue",
                ds: this.getLabelsForQueueRepresentation(fScores.toArray())
            }
        }
        animationStates.push(currentState);
        
        let currentElement = fScores.extractMin()!;
        visited.set(currentElement.id, true);
        
        currentState = this.markNodeAsVisited(currentState, currentElement.id);
        currentState.algorithmInfobox = {
            information: "Node with the smallest g(x) + h(x) selected from priority queue.",
            dataStructure: {
                type: "priority-queue",
                ds: this.getLabelsForQueueRepresentation(fScores.toArray())
            }
        }
        animationStates.push(currentState);

        while (currentElement.id !== to) {
            const currentNode = this._graph.getNode(currentElement.id)!;
            let previousEdgeId:number|undefined;
            
            for(const neighbourId of currentNode.AdjacencyList){
                if(visited.get(neighbourId))continue;
                
                if(previousEdgeId !== undefined){
                    currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
                }
                const edgeIdConnectedToNeighbour = currentNode.getEdgeIdConnectingToNeighbour(neighbourId)!;

                const edgeW = this._graph.getEdge(edgeIdConnectedToNeighbour)!.weight!;
                const gThroughCurrent = gScores.get(currentElement.id)! + edgeW;
                
                const gScoreNeighbor = gScores.get(neighbourId)!;
                const neighbourHeusristic = heuristics.get(neighbourId)!;

                currentState = this.markEdgeAsSelected(currentState, edgeIdConnectedToNeighbour)
                currentState.algorithmInfobox = {
                    information: `Checking for adjacent nodes if the distance through the node currently being visited is smaller than the distance previously set:<br> 
                    <br>${gScores.get(currentElement.id)} + ${edgeW} < ? ${gScoreNeighbor == Infinity ? "∞": gScoreNeighbor}`,
                    dataStructure: {
                        type: "priority-queue",
                        ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                    }
                }
                animationStates.push(currentState);

                
                
                if (gThroughCurrent < gScoreNeighbor) {

                    previousNode.set(neighbourId, currentElement.id);

                    currentState = this.updateNodeLabel(currentState, neighbourId, `${this._graph.getNode(neighbourId)!.label}(${gThroughCurrent + neighbourHeusristic})`);    
                    currentState.algorithmInfobox = {
                        information: `distance through current node < current smallest distance to neighbour<br> (${gThroughCurrent} < ${gScoreNeighbor == Infinity ? "∞": gScoreNeighbor})
                        <br>update the value held by the node to the new f(x) = g(x) + h(x)
                        <br>update the value held by the node to: ${gThroughCurrent} + ${neighbourHeusristic} = ${gThroughCurrent + neighbourHeusristic}`,
                        dataStructure: {
                            type: "priority-queue",
                            ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                        }
                    };
                    animationStates.push(currentState);

                    gScores.set(neighbourId, gThroughCurrent);
                    fScores.update(neighbourId, gThroughCurrent + neighbourHeusristic);
                }else{
                    currentState = this.copyAnimationState(currentState);
                    currentState.algorithmInfobox = {
                        information: `distance through current node > current smallest distance to neighbour<hr> no updates`,
                        dataStructure: {
                            type: "priority-queue",
                            ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                        }
                    };
                    animationStates.push(currentState);
                }
                previousEdgeId = edgeIdConnectedToNeighbour;
                
            }
            
            if(previousEdgeId !== undefined){
                currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
            }
            
            visited.set(currentElement.id, true);

            currentState = this.copyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: `Selecting node from priority queue with the smallest g(x) + h(x)<br>
                h(x): heuristic, in our case its euclidean distance<br>
                g(x): shortest distance known from source node`,
                dataStructure: {
                    type: "priority-queue",
                    ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                }
            };
            animationStates.push(currentState);
            
            currentElement = fScores.extractMin()!;
            
            currentState = this.markNodeAsVisited(currentState, currentElement.id);
            currentState.algorithmInfobox = {
                information: "Node with the smallest g(x) + h(x) selected from priority queue.",
                dataStructure: {
                    type: "priority-queue",
                    ds: this.getLabelsForQueueRepresentation(fScores.toArray())
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
                const edgeId = currentNode.getEdgeIdConnectingToNeighbour(nextNodeId);
                newState = this.markEdgeAsPartOfPath(newState, edgeId!);
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
    private measureDistancesFromAllNodesToDestinationNode(to:number, heuristics: Map<number, number>, scale: number):void{
        for(const node of this._graph.nodes){
            heuristics.set(node.id, this.measureDistance(this._graph.getNode(to)!, node, scale));
        }
    }
    private measureDistance(nodeA: Node, nodeB: Node, scale: number):number{
        return Math.floor(Math.sqrt((nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2) / (10 * scale));
    }
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this._graph.getNode(id)!.label);
    }
}