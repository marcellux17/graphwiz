import Vector from "../network/Vector";

export default class Node {
    private readonly _id: number;
    private readonly _adjacencyList: Map<number, number>;
    private readonly _originalLabel: string;
    private _label: string;
    private _Position = new Vector(0, 0);
    private _color = "white";

    constructor(id: number, label: string) {
        this._originalLabel = label;
        this._label = label;
        this._id = id;
        this._adjacencyList = new Map<number, number>();
    }
    get color(): string {
        return this._color;
    }
    set color(newColor: string) {
        this._color = newColor;
    }
    get label(): string {
        return this._label;
    }
    set label(newLabel: string) {
        this._label = newLabel;
    }
    set position(newPosition: Vector) {
        this._Position = newPosition;
    }
    get position(): Vector {
        return this._Position;
    }
    get id(): number {
        return this._id;
    }
    get AdjacencyList(): number[] {
        return Array.from(this._adjacencyList.keys());
    }
    getEdgeIdConnectingToNeighbour(neighbourId: number): number | undefined {
        return this._adjacencyList.get(neighbourId);
    }
    removeNeighbour(neighborId: number): void {
        this._adjacencyList.delete(neighborId);
    }
    addNeighbour(neighborId: number, edgeId: number): void {
        this._adjacencyList.set(neighborId, edgeId);
    }
    hasEdgeToNode(id: number): boolean {
        return this._adjacencyList.has(id);
    }
    reset(): void {
        this._label = this._originalLabel;
        this._color = "white";
    }
    clone(): Node {
        const cloned = new Node(this._id, this._originalLabel);
        cloned._label = this._label;
        cloned._Position = new Vector(this._Position.x, this._Position.y);
        cloned._color = this._color;
        this._adjacencyList.forEach((edgeId, neighbourId) => {
            cloned._adjacencyList.set(neighbourId, edgeId);
        });
        return cloned;
    }
}
