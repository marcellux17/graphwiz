import Graph from "../datastructures/Graph";

export type animationState = {
    graph: Graph;
    algorithmInfobox?: algorithmInfoBoxState;
}
export type algorithmInfoBoxState = {
    information?: string; 
    dataStructure?: {
        type: string; 
        ds: string[];
    };
}
