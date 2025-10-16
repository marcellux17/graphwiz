import { Node, WeightedGraph } from "../../datastructures/Graph";
import { MinPriorityQueue } from "../../datastructures/Queue";
import { algorithmInfoBoxState, animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class AStar extends Algorithm{
    private heuristics: (number |null)[];//idx: nodeId, element: distance to destination node
    constructor(graph: WeightedGraph){
        super(graph);
        this.heuristics = Array(this.graph.getNodeList().length).fill(null);
    }
    private createPathHighLightState(state: animationState, from: number,to: number, previous:number[]): animationState {
        let newState = state;
        let currentNode:Node|null = this.graph.getNode(to);
        let algorithmStateInfo: algorithmInfoBoxState = {
            information: `Algorithm finished running!<hr>Shortest path found between ${this.graph.getLabelOfNode(from)} and ${this.graph.getLabelOfNode(to)}.`,
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
                const edgeId = currentNode.getEdgeIdConnectingToNeihgbour(nextNodeId);
                newState = this.markEdgeAsPartOfPath(newState, edgeId)
                currentNode = this.graph.getNode(nextNodeId);
            } else {
                currentNode = null;
            }
        }
        return newState;
    }
    override createInitialState(from: number): animationState {
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
                label: `${edge.getWeight()}`
            };
        });

        return { nodes, edges };
    }
    private measureDistancesFromAllNodesToDestinationNode(to:number):void{
        const nodes = this.graph.getNodeList();
        for(let nodeId = 0; nodeId < nodes.length; nodeId++){
            if(nodes[nodeId] !== null){
                this.heuristics[nodeId] = this.measureDistance(nodes[to]!, nodes[nodeId]!);
            }
        }
    }
    private measureDistance(nodeA: Node, nodeB: Node):number{
        return Math.floor(Math.sqrt((nodeA.x!-nodeB.x!)**2+(nodeA.y!-nodeB.y!)**2)/10);//weights of the graph are calculated by this function as well
    }
    private getLabelsForQueueRepresentation(ids: number[]):string[]{
        return ids.map(id => this.graph.getLabelOfNode(id));
    }
    run(from: number, to: number): animationState[] {
        const animationStates: animationState[] = [];
        const nodeList = this.graph.getNodeList();
        const fScores = new MinPriorityQueue(nodeList.length); //fScores
        const gScores = new Array(nodeList.length).fill(Infinity);//gScores: 
        const visited:boolean[] = Array(nodeList.length).fill(false);
        const previousNode:number[] = Array(nodeList.length).fill(-1);
        this.measureDistancesFromAllNodesToDestinationNode(to);
        gScores[from] = 0;
        this.graph.getNodeList().forEach((node) => {
            if (node) {
                const f = (node.getId() === from ? 0 : Infinity) + this.heuristics[node.getId()]!;
                fScores.insert({ id: node.getId(), value: f });
            }
        });
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
        currentState = JSON.parse(JSON.stringify(currentState));
        currentState.algorithmInfobox = {
            information: "Selecting node from priority queue with the smallest distance",
            dataStructure: {
                type: "priority-queue",
                ds: this.getLabelsForQueueRepresentation(fScores.toArray())
            }
        }
        animationStates.push(currentState);
        
        let currentNode = fScores.extractMin()!;
        visited[currentNode.id] = true;
        
        currentState = this.markNodeAsVisited(currentState, currentNode.id);
        currentState.algorithmInfobox = {
            information: "Node with the smallest g(x) + h(x) selected from priority queue.",
            dataStructure: {
                type: "priority-queue",
                ds: this.getLabelsForQueueRepresentation(fScores.toArray())
            }
        }
        animationStates.push(currentState);

        while (currentNode.id !== to) {
            const node = this.graph.getNode(currentNode.id)!;
            let previousEdgeId:number|null = null;
            for(let neighbourId = 0; neighbourId < this.graph.getNodeList().length; neighbourId++){
                if(visited[neighbourId])continue;
                if(previousEdgeId !== null){
                    currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
                }
                const edgeIdConnectedToNeighbour = node.getEdgeIdConnectingToNeihgbour(neighbourId);
                if(edgeIdConnectedToNeighbour === -1){
                    continue;
                }
                const edgeW = this.graph.getEdge(edgeIdConnectedToNeighbour)!.getWeight()!;
                const gThroughCurrent = gScores[currentNode.id] + edgeW;

                currentState = this.markEdgeAsSelected(currentState, edgeIdConnectedToNeighbour)
                currentState.algorithmInfobox = {
                    information: `Checking for adjacent nodes if the distance through the node currently being visited is smaller than the distance previously set:<br> 
                    <br>${gScores[currentNode.id]} + ${edgeW} < ? ${gScores[neighbourId] == Infinity ? "∞": gScores[neighbourId]}`,
                    dataStructure: {
                        type: "priority-queue",
                        ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                    }
                }
                animationStates.push(currentState);

                if (gThroughCurrent< gScores[neighbourId]) {

                    previousNode[neighbourId] = currentNode.id;

                    currentState = this.updateNodeLabel(currentState, neighbourId, `${this.graph.getLabelOfNode(neighbourId)}(${gThroughCurrent + this.heuristics[neighbourId]})`)
                    currentState.algorithmInfobox = {
                        information: `distance through current node < current smallest distance to neighbour<br> (${gThroughCurrent} < ${gScores[neighbourId] == Infinity ? "∞": gScores[neighbourId]})`,
                        dataStructure: {
                            type: "priority-queue",
                            ds: this.getLabelsForQueueRepresentation(fScores.toArray())
                        }
                    };
                    animationStates.push(currentState);

                    gScores[neighbourId] = gThroughCurrent;
                    fScores.update(neighbourId, gThroughCurrent+this.heuristics[neighbourId]);
                }else{
                    currentState = JSON.parse(JSON.stringify(currentState));
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
            if(previousEdgeId !== null){
                currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
            }
            visited[currentNode.id] = true;
            currentState = JSON.parse(JSON.stringify(currentState));
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
            currentNode = fScores.extractMin()!;
            currentState = this.markNodeAsVisited(currentState, currentNode.id);
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
}