export type animationState = {
    nodes: (animationNodeInformation|null)[];
    edges: (animationEdgeInformation|null)[];
    algorithmInfobox?: algorithmInfoBoxState;
}
export type animationNodeInformation = {
    state: nodeState;
    label: string;
    id: number;
}
export type animationEdgeInformation = {
    state: edgeState;
    label: string;
    id: number;
}
export type edgeState = "selectedEdge" | "visitedEdge" | "partOfPath" | "normal";
export type nodeState = "visitedNode" | "inQueue" | "partOfPath" | "stackTop" | "normal";
export type algorithmInfoBoxState = {
    information?: string; //information to display in the algorithm-information-box: describes what's happening inside the algorithm
    dataStructure?: {
        type: string; //the type of the ds
        ds: string[]; //array representation of the datastructure(like queue, priority queue or stack )
    };
}
