import { Node, WeightedGraph } from "../../datastructures/Graph";
import { animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class BellmanFord extends Algorithm{
    constructor(graph: WeightedGraph){
        super(graph);
    }
    private createPathHighLightState(state: animationState, from: number,to: number, previousNodes: number[], previousEdges: number[]): animationState {
        let newState = state;
        let currentNode:Node|null = this.graph.getNode(to);
        newState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Shortest path found between ${this.graph.getLabelOfNode(from)} and ${this.graph.getLabelOfNode(to)}.`
        }
        while (currentNode !== null) {
            const currentNodeId = currentNode.getId();
            const nextNodeId = previousNodes[currentNodeId];
            newState = this.markNodeAsPartOfPath(newState, currentNodeId);
            if (nextNodeId !== -1) {
                const edgeId = previousEdges[currentNodeId];
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
    run(from: number, to:number): animationState[] {
        const animationStates: animationState[] = [];
        const nodeList = this.graph.getNodeList();
        const currentEstimate = Array(nodeList.length).fill(Infinity);
        const previousNodes = Array(nodeList.length).fill(-1);
        const previousEdges = Array(nodeList.length).fill(-1);
        currentEstimate[from] = 0; 
        
        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
                information: `<h4>edge relaxation:</h4>we iterate over all the edges e(u, v)<br> at most |V| - 1 times to see if the shortest path length to v can be improved via u.
                <br>(All paths originate from the start node)`
        }
        animationStates.push(currentState);
        currentState = this.markNodeAsVisited(currentState, from);

        let changes = true;
        let i = 0;
        while(i <= this.graph.getNumberOfNodes()-1 && changes){
            changes = false;
            currentState.algorithmInfobox = {
                information: `<h4>${i}. edge relaxation:</h4>
                we iterate over all the edges e(u, v) to see if we can update path lengths.`
            }
            animationStates.push(currentState);
            let previousEdge = null;
            for(const edge of this.graph.getEdgeList()){
                if(!edge){
                    continue;
                }
                const to = edge.getTo();
                const from = edge.getFrom();
                if(currentEstimate[from] !== Infinity){
                    const distanceThroughFrom = currentEstimate[from] + edge.getWeight()
                    currentState = this.markEdgeAsSelected(currentState, edge.getId());
                    previousEdge = edge.getId();
                    currentState.algorithmInfobox = {
                        information: `<h4>checking:</h4> is distance to v through u smaller than the current estimate to v?
                        <br>u label: ${this.graph.getLabelOfNode(from)}
                        <br>v label: ${this.graph.getLabelOfNode(to)}
                        <hr>does this hold?<br>d[u] + w(e) < d[v]`
                    }
                    animationStates.push(currentState);
                    if(distanceThroughFrom < currentEstimate[to]){
                        currentState = this.updateNodeLabel(currentState, to, `${this.graph.getLabelOfNode(to)}(${distanceThroughFrom})`)
                        currentState.algorithmInfobox = {
                            information: `it holds: (${distanceThroughFrom} < ${currentEstimate[to] == Infinity ? "∞": currentEstimate[to]})
                            <hr>d[u] + w(e) < d[v]`
                        }
                        previousNodes[to] = from;
                        previousEdges[to] = edge.getId();
                        currentEstimate[to] = distanceThroughFrom;
                        animationStates.push(currentState);
                        changes = true;
                    }else{
                        currentState = this.CopyAnimationState(currentState);
                        currentState.algorithmInfobox = {
                            information: `it does not hold: (${distanceThroughFrom} < ${currentEstimate[to] == Infinity ? "∞": currentEstimate[to]})
                            <hr>d[u] + w(e) > d[v]`
                        }
                        animationStates.push(currentState);
                    }

                }
                if(previousEdge !== null){
                    currentState = this.markEdgeAsNormal(currentState, previousEdge);
                    previousEdge = null;
                }
            }
            i++;
        }
        
        for(const edge of this.graph.getEdgeList()){
            if(!edge){
                continue;
            }
            const to = edge.getTo();
            const from = edge.getFrom();
            if(currentEstimate[from] !== Infinity){
                const distanceThroughFrom = currentEstimate[from] + edge.getWeight()
                if(distanceThroughFrom < currentEstimate[to]){
                    return [];
                }

            }
        }
        animationStates.push(this.createPathHighLightState(currentState, from, to, previousNodes, previousEdges));
        return animationStates;
    }
        
}