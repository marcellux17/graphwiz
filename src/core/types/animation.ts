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
export type edgeState = "selectedEdge" | "visitedEdge" | "partOfPath" | "normal" | "deselectedEdge";
export type nodeState = "visitedNode" | "inQueue" | "partOfPath" | "inStack" | "normal" | "deselectedNode";
export type algorithmInfoBoxState = {
    information?: string; 
    dataStructure?: {
        type: string; 
        ds: string[];
    };
}
