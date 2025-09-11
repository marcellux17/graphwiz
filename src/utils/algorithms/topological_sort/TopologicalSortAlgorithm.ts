import { Graph } from "../../datastructures/Graph";
import { animationState} from "../../types/animation";
import Algorithm from "../Algorithm";

export default class TopologicalSort extends Algorithm{
    constructor(graph: Graph){
        super(graph);
    }
    Run(): animationState[] {
        const animationStates: animationState[] = [];
        //code
        return animationStates;
    }
        
}