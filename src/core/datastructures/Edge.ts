export default class Edge {
    private readonly _id: number;
    private readonly _to: number;
    private readonly _from: number;
    private _weight?: number;
    private _color = "black";
    private _width = 2;

    constructor(id: number, to: number, from: number, width: number, weight?: number) {
        this._id = id;
        this._to = to;
        this._from = from;
        this._weight = weight;
        this._width = width;
    }
    set color(newColor: string) {
        this._color = newColor;
    }
    get color(): string {
        return this._color;
    }
    set width(newWidth: number) {
        this._width = newWidth;
    }
    get width(): number {
        return this._width;
    }
    set weight(weight: number) {
        this._weight = weight;
    }
    get weight(): number | undefined {
        return this._weight;
    }
    get to(): number {
        return this._to;
    }
    get from(): number {
        return this._from;
    }
    get id(): number {
        return this._id;
    }
    reset(): void {
        this._color = "black";
        this._width = 2;
    }
}
