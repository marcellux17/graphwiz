import { animationEdgeInformation, animationNodeInformation, animationState} from "../types/animation";
import { Graph } from "../datastructures/Graph";

export default class DFS{
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
    private markNodeAsInStack(state: animationState, nodeId: number): animationState {
        const newState = JSON.parse(JSON.stringify(state));
        if (newState.nodes[nodeId]) {
            newState.nodes[nodeId].state = "inStack";
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
    private getLabelsForStackRepresentation(ids: number[]):string[]{
        return ids.map(id => this.graph.getLabelOfNode(id));
    }
    Run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        const nodes = this.graph.getNodeList();
        const visited:boolean[] = Array(nodes.length).fill(false);
        //code
        const stack:number[] = [];
        stack.push(from);
        visited[from] = true;
        let currentState = this.createInitialState();
        currentState = this.markNodeAsInStack(currentState, from);
        currentState.algorithmInfobox = {
            information: "Putting the starting node in stack for dfs to run.",
            dataStructure: {
                type: "stack",
                ds: this.getLabelsForStackRepresentation(stack)
            }
        }
        animationStates.push(currentState);
        while(stack.length > 0){
            currentState = JSON.parse(JSON.stringify(currentState))
            currentState.algorithmInfobox = {
                information: `Pop() method called on stack to retrieve top element.`,
                dataStructure: {
                    type: "stack",
                    ds: this.getLabelsForStackRepresentation(stack)
                }
            }
            animationStates.push(currentState);
            const currentNodeId = stack.pop();
            currentState = this.markNodeAsVisited(currentState, currentNodeId!);
            currentState.algorithmInfobox = {
                information: `Pop() method called on stack to retrieve top element: (${this.graph.getLabelOfNode(currentNodeId!)}).`,
                dataStructure: {
                    type: "stack",
                    ds: this.getLabelsForStackRepresentation(stack)
                }
            }
            animationStates.push(currentState);
            const adjacencyList = this.graph.getNode(currentNodeId!).getAdjacencyList();
            for(let i = 0; i < adjacencyList.length; i++){
                if(adjacencyList[i] !== -1){
                    currentState = this.markEdgeAsSelected(currentState, adjacencyList[i]);
                    currentState.algorithmInfobox = {
                        information: `Checking if neighbour of the current node is already in stack or has been visited.`,
                        dataStructure: {
                            type: "stack",
                            ds: this.getLabelsForStackRepresentation(stack)
                        }
                    }
                    animationStates.push(currentState);
                    if(!visited[i]){
                        stack.push(i);
                        visited[i] = true;
                        currentState = this.markNodeAsInStack(currentState, i);
                        currentState.algorithmInfobox = {
                            information: `Node (${this.graph.getLabelOfNode(i)}) hasn't been visited and not in stack:<br>pushing it onto the stack.`,
                            dataStructure: {
                                type: "stack",
                                ds: this.getLabelsForStackRepresentation(stack)
                            }
                        }
                        animationStates.push(currentState);
                    }
                    currentState = this.markEdgeAsNormal(currentState, adjacencyList[i])
                }
            }
        }
        currentState.algorithmInfobox = {
            information: `Algorithm finished running!<hr> All nodes reachable from starting node have been visited since the stack is empty!`
        }
        animationStates.push(currentState);
        return animationStates;
    }
        
}