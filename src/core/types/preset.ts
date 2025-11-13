export type Preset = {
    info: {
        weighted: boolean;
        edgesBidirectional: boolean;
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
export function isPreset(obj: any): obj is Preset {
  return (
    typeof obj === "object" && obj !== null &&
    typeof obj.info === "object" && obj.info !== null &&
    typeof obj.info.weighted === "boolean" &&
    typeof obj.info.edgesTwoWay === "boolean" &&
    typeof obj.info.scale === "number" &&
    Array.isArray(obj.nodes) &&
    obj.nodes.every(
      (n: any) =>
        typeof n === "object" && n !== null &&
        typeof n.id === "number" &&
        typeof n.x === "number" &&
        typeof n.y === "number" &&
        typeof n.color === "string"
    ) &&
    Array.isArray(obj.edges) &&
    obj.edges.every(
      (e: any) =>
        typeof e === "object" && e !== null &&
        typeof e.from === "number" &&
        typeof e.to === "number" &&
        (e.weight === undefined || typeof e.weight === "number")
    )
  );
}
