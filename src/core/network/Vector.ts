export default class Vector{
    private _x: number;
    private _y: number;

    constructor(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    get x(): number {
        return this._x;
    }

    get y(): number {
        return this._y;
    }

    get length(): number {
        return Math.sqrt(this._x ** 2 + this._y ** 2);
    }

    get normal(): Vector{
        return new Vector(-this._y, this._x);
    }

    normalize(): Vector {
        const length = this.length;
        if (length === 0) { 
            return new Vector(0, 0);
        }
        return new Vector(this._x / length, this._y / length);
    }

    scale(factor: number): Vector {
        return new Vector(this._x * factor, this._y * factor);
    }

    add(other: Vector): Vector {
        return new Vector(this._x + other.x, this._y + other.y);
    }

    subtract(other: Vector): Vector {
        return new Vector(this._x - other.x, this._y - other.y);
    }
}