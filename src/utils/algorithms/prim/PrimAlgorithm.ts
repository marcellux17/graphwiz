import { WeightedGraph } from "../../datastructures/Graph";
import { animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import { MinPriorityQueue, Queue } from "../../datastructures/Queue";
import Algorithm from "../Algorithm";
export default class Prim extends Algorithm{
    constructor(graph: WeightedGraph){
        super(graph);
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
                label: id === from ? `${node.label}(0)` : `${node.label}(∞)`
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
    private fillQueue(from: number):MinPriorityQueue{
        const nodes = this.graph.getNodeList()
        const bfsQueue = new Queue<number>(nodes.length);
        const returnQueue = new MinPriorityQueue(nodes.length);
        const visited:boolean[] = new Array(nodes.length).fill(false);
        visited[from] = true;
        bfsQueue.enqueue(from);
        while(!bfsQueue.isEmpty()){
            const currentNodeId = bfsQueue.dequeue()!;
            const currentNode = this.graph.getNode(currentNodeId)!;
            if(currentNodeId === from){
                returnQueue.insert({id: currentNodeId, value: 0});
            }else{
                returnQueue.insert({id: currentNodeId, value: Infinity});
            }
            for(let nodeid = 0; nodeid < this.graph.getNodeList().length; nodeid++){
                if(currentNode.hasEdgeToNode(nodeid) && !visited[nodeid]){
                    bfsQueue.enqueue(nodeid);
                    visited[nodeid] = true;
                }
            }
        }
        return returnQueue;

    }
    run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        const priorityQueue = this.fillQueue(from);
        const nodes = this.graph.getNodeList();
        const edges = this.graph.getEdgeList();
        const MST:boolean[] = new Array(nodes.length).fill(false);
        const edgesConnectingNodesToMST:number[]  = new Array(nodes.length).fill(-1);
        const mstEdges:boolean[] = new Array(edges.length).fill(false);
        const componentEdgeIds:boolean[] = new Array(edges.length).fill(false);
        let res = 0;
        
        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
            information: `We assign each node a value of ∞, except for the starting node which will get a value of 0. It denotes the cost of including that node in the MST.
            Inside the loop we retrieve the element with the minimum cost from the priority-queue. With the retrieval the node will be included in the MST.
            We also check if the adjacent nodes that are not yet in the MST can be assigned a smaller cost through the current node. If so we update the priority-queue. We repeat until there are no more
            nodes left in the priority queue.`
        };
        animationStates.push(currentState);
        while(!priorityQueue.isEmpty()){
            currentState = JSON.parse(JSON.stringify(currentState));
            currentState.algorithmInfobox = {
                information: "We call dequeue() on the priority-queue to retrieve the node with the smallest cost of including it in the MST."
            }
            animationStates.push(currentState);
            const currentElement = priorityQueue.extractMin()!;
            const currentNode = this.graph.getNode(currentElement.id)!;
            currentState = this.markNodeAsPartOfPath(currentState, currentElement.id);
            if(edgesConnectingNodesToMST[currentElement.id] !== -1){
                const edgeId = edgesConnectingNodesToMST[currentElement.id];
                currentState = this.markEdgeAsPartOfPath(currentState, edgeId)
                res += this.graph.getEdge(edgeId)!.getWeight()!;
                mstEdges[edgeId] = true;
            }
            currentState.algorithmInfobox = {
                information: "The node with the minimum cost to include it in the MST has been retrieved from the priority-queue."
            }
            animationStates.push(currentState);
            MST[currentElement!.id] = true;
            for(let nodeId = 0; nodeId < this.graph.getNodeList().length; nodeId++){
                if(currentNode.hasEdgeToNode(nodeId)){
                    const edgeId = currentNode.getEdgeIdConnectingToNeihgbour(nodeId);
                    componentEdgeIds[edgeId] = true;
                    const w = this.graph.getEdge(edgeId)!.getWeight()!;
                    currentState = this.markEdgeAsSelected(currentState, edgeId);
                    currentState.algorithmInfobox = {
                        information: "Checking whether the adjacent node is already in the MST. And if so, whether the weight of the edge connecting it to the current node is smaller the one previously set."
                    };
                    animationStates.push(currentState);
                    if(!MST[nodeId]){
                        const currentCost = priorityQueue.get(nodeId)!.value
                        if(w < currentCost){
                            priorityQueue.update(nodeId, w);
                            edgesConnectingNodesToMST[nodeId] = edgeId;
                            currentState = this.updateNodeLabel(currentState, nodeId, `${this.graph.getLabelOfNode(nodeId)}(${w})`)
                            currentState.algorithmInfobox = {
                                information: `We can improve the cost of connecting the adjacent node to the MST.<hr>
                                ${w} < ${currentCost == Infinity ? `∞`: currentCost}`
                            };
                            animationStates.push(currentState);
                        }else{
                            currentState = JSON.parse(JSON.stringify(currentState));
                            currentState.algorithmInfobox = {
                                information: `We can't improve the cost of connecting the adjacent node to the MST.`
                            };
                            animationStates.push(currentState);
                        }
                        currentState = this.markEdgeAsNormal(currentState, edgeId)
                    }else{
                        const from = this.graph.getEdge(edgeId)!.getFrom();
                        const to = this.graph.getEdge(edgeId)!.getTo();
                        if( edgesConnectingNodesToMST[to] === edgeId || edgesConnectingNodesToMST[from] === edgeId){
                            currentState = this.markEdgeAsPartOfPath(currentState, edgeId);
                        }else{
                            currentState = this.markEdgeAsNormal(currentState, edgeId)
                        }
                        currentState.algorithmInfobox = {
                            information: "Adjacent node is already in the MST. We don't do anything with it."
                        };
                        animationStates.push(currentState);
                    }
                }
            }
        }
        currentState = JSON.parse(JSON.stringify(currentState));
        for(let edgeId = 0; edgeId < componentEdgeIds.length; edgeId++){
            if(componentEdgeIds[edgeId] && !mstEdges[edgeId]){
                currentState = this.markEdgeAsDeselected(currentState, edgeId);
            }
        }
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Minimum spanning tree of the weighted graph has been created with a total weight of: ${res}.`
        };
        animationStates.push(currentState);
        return animationStates;
    }

}