export type Preset = {
    info: {
        weighted: boolean;
        directed: boolean;
        scale: number
    };
    nodes: presetNode[];
    edges: presetEdge[];
};
export type presetNode = {
    id: number;
    x: number;
    y: number;
    color: string;
};
export type presetEdge = {
    from: number;
    to: number;
    weight?: number;
}

