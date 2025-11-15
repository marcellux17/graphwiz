import Graph from "../../datastructures/Graph";
import { animationEdgeInformation, animationNodeInformation, animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class BellmanFord extends Algorithm{
    constructor(graph: Graph){
        super(graph);
    }
    run(from: number, to:number): animationState[] {
        const animationStates: animationState[] = [];
        const currentEstimate = new Map<number, number>();
        const previousNodes = new Map<number, number>();
        const previousEdges = new Map<number, number>();

        for(const node of this._graph.nodes){
            currentEstimate.set(node.id, Infinity);
        }

        currentEstimate.set(from, 0); 
        
        let currentState = this.createInitialState(from);
        currentState.algorithmInfobox = {
                information: `<h4>edge relaxation:</h4>we iterate over all the edges e(u, v)<br> at most |V| - 1 times to see if the shortest path length to v can be improved via u.
                <br>(All paths originate from the start node)`
        }
        animationStates.push(currentState);
        currentState = this.markNodeAsVisited(currentState, from);

        let changes = true;
        let i = 0;
        while(i <= this._graph.nodes.length - 1 && changes){
            changes = false;
            currentState.algorithmInfobox = {
                information: `<h4>${i}. edge relaxation:</h4>
                we iterate over all the edges e(u, v) to see if we can update path lengths.`
            }
            animationStates.push(currentState);
            let previousEdgeId : number | undefined;;
            for(const edge of this._graph.edges){
                const to = edge.to;
                const from = edge.from;
                if(currentEstimate.get(from) !== Infinity){
                    const distanceThroughFrom = currentEstimate.get(from)! + edge.weight!;
                    currentState = this.markEdgeAsSelected(currentState, edge.id);
                    previousEdgeId = edge.id;
                    currentState.algorithmInfobox = {
                        information: `<h4>checking:</h4> is distance to v through u smaller than the current estimate to v?
                        <br>u label: ${this._graph.getNode(from)!.label}
                        <br>v label: ${this._graph.getNode(to)!.label}
                        <hr>does this hold?<br>d[u] + w(e) < d[v]`
                    }
                    animationStates.push(currentState);
                    if(distanceThroughFrom < currentEstimate.get(to)!){
                        currentState = this.updateNodeLabel(currentState, to, `${this._graph.getNode(to)!.label}(${distanceThroughFrom})`)
                        currentState.algorithmInfobox = {
                            information: `it holds: (${distanceThroughFrom} < ${currentEstimate.get(to)! == Infinity ? "∞": currentEstimate.get(to)!})
                            <hr>d[u] + w(e) < d[v]`
                        }
                        previousNodes.set(to, from);
                        previousEdges.set(to, edge.id);
                        currentEstimate.set(to, distanceThroughFrom);
                        animationStates.push(currentState);
                        changes = true;
                    }else{
                        currentState = this.copyAnimationState(currentState);
                        currentState.algorithmInfobox = {
                            information: `it does not hold: (${distanceThroughFrom} < ${currentEstimate.get(to)! == Infinity ? "∞": currentEstimate.get(to)!})
                            <hr>d[u] + w(e) > d[v]`
                        }
                        animationStates.push(currentState);
                    }

                }
                if(previousEdgeId !== undefined){
                    currentState = this.markEdgeAsNormal(currentState, previousEdgeId);
                    previousEdgeId = undefined;
                }
            }
            i++;
        }
        
        for(const edge of this._graph.edges){
            const to = edge.to;
            const from = edge.from;
            if(currentEstimate.get(from) !== Infinity){
                const distanceThroughFrom = currentEstimate.get(from)! + edge.weight!
                if(distanceThroughFrom < currentEstimate.get(to)!){
                    return [];
                }

            }
        }
        animationStates.push(this.createPathHighLightState(currentState, from, to, previousNodes, previousEdges));
        return animationStates;
    }
    private createPathHighLightState(state: animationState, from: number,to: number, previousNodes: Map<number, number>, previousEdges: Map<number, number>): animationState {
        let newState = state;
        let currentNode = this._graph.getNode(to);
        newState.algorithmInfobox = {
            information: `Algorithm finished running!<hr>Shortest path found between ${this._graph.getNode(from)!.label} and ${this._graph.getNode(to)!.label}.`
        }
        while (currentNode) {
            const currentNodeId = currentNode.id;
            const nextNodeId = previousNodes.get(currentNodeId)!;
            newState = this.markNodeAsPartOfPath(newState, currentNodeId);
            if (nextNodeId !== undefined) {
                const edgeId = previousEdges.get(currentNodeId)!;
                newState = this.markEdgeAsPartOfPath(newState, edgeId)
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
}