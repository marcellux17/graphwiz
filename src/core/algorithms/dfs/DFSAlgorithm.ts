import { animationState} from "../../types/animation";
import { Graph } from "../../datastructures/Graph";
import Algorithm from "../Algorithm";

export default class DFS extends Algorithm{
    constructor(graph: Graph){
        super(graph);
    }
    private getLabelsForStackRepresentation(ids: number[]):string[]{
        return ids.map(id => this.graph.getLabelOfNode(id));
    }
    run(from: number): animationState[] {
        const animationStates: animationState[] = [];
        const nodes = this.graph.getNodeList();
        const visited:boolean[] = Array(nodes.length).fill(false);

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
            currentState = this.CopyAnimationState(currentState);
            currentState.algorithmInfobox = {
                information: `Pop() method called on stack to retrieve top element.`,
                dataStructure: {
                    type: "stack",
                    ds: this.getLabelsForStackRepresentation(stack)
                }
            }
            animationStates.push(currentState);
            const currentNodeId = stack.pop()!;
            const currentNode = this.graph.getNode(currentNodeId)!;
            currentState = this.markNodeAsVisited(currentState, currentNodeId!);
            currentState.algorithmInfobox = {
                information: `Pop() method called on stack to retrieve top element: (${this.graph.getLabelOfNode(currentNodeId!)}).`,
                dataStructure: {
                    type: "stack",
                    ds: this.getLabelsForStackRepresentation(stack)
                }
            }
            animationStates.push(currentState);
            for(let nodeId = 0; nodeId < this.graph.getNodeList().length; nodeId++){
                if(currentNode.hasEdgeToNode(nodeId)){
                    const edgeId = currentNode.getEdgeIdConnectingToNeihgbour(nodeId)
                    currentState = this.markEdgeAsSelected(currentState, edgeId);
                    currentState.algorithmInfobox = {
                        information: `Checking if neighbour of the current node is already in stack or has been visited.`,
                        dataStructure: {
                            type: "stack",
                            ds: this.getLabelsForStackRepresentation(stack)
                        }
                    }
                    animationStates.push(currentState);
                    if(!visited[nodeId]){
                        stack.push(nodeId);
                        visited[nodeId] = true;
                        currentState = this.markNodeAsInStack(currentState, nodeId);
                        currentState.algorithmInfobox = {
                            information: `Node (${this.graph.getLabelOfNode(nodeId)}) hasn't been visited and not in stack:<br>pushing it onto the stack.`,
                            dataStructure: {
                                type: "stack",
                                ds: this.getLabelsForStackRepresentation(stack)
                            }
                        }
                        animationStates.push(currentState);
                    }
                    currentState = this.markEdgeAsNormal(currentState, edgeId)
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