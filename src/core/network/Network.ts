import Graph from "../datastructures/Graph";
import Edge from "../datastructures/Edge";
import Node from "../datastructures/Node";
import { algorithmInformationBox, canvas, editingPanel } from "../dom/elements";
import { Preset} from "../types/preset";
import Vector from "./Vector";

type networkMode = "addEdgeMode" | "addNodeMode" | "idle" | "delete" | "disabled";
export default class Network{
    private readonly _ctx = canvas.getContext("2d")!;
    private readonly _negativeEdges: boolean;
    private readonly _euclideanWeights: boolean;
    private readonly _fontSize = 17;
    private readonly _edgeWidth = 2;
    private _graph: Graph;
    private _isDown = false;
    private _dragging = false;
    private _isPanning = false;
    private _offset = new Vector(0, 0);
    private _scale = 1;
    private _scaleFactor = 0.05;
    private _mousePosition = new Vector(0, 0);
    private _nodeIds:number[] = [];
    private _mouseNodeCenterVector = new Vector(0, 0);
    private _nodeDragging = false;
    private _draggedNodeId?: number;
    private _firstNodeId?: number;
    private _dpr:number = 1;
    private _pendingEdge = false;
    private _canvasWidth = 0;
    private _canvasHeight = 0;
    private _selectNodeCallback?: (nodeId:number) => void;
    private _selectEdgeCallback?: (edgeId:number) => void;
    private _canvasBlankClick?: () => void;
    private _mode: networkMode = "idle";

    constructor(graph: Graph, euclideanWeights: boolean, negativeEdges: boolean) {
        this._graph = graph;
        this._euclideanWeights = euclideanWeights;
        this._negativeEdges = negativeEdges;
        
        canvas.addEventListener("mousedown", this.mouseDownEventHandler);
        canvas.addEventListener("wheel", this.wheelEventHandler);
        
        window.addEventListener("mousemove", this.mouseMoveEventHandler);
        window.addEventListener("mouseup", this.mouseUpEventHandler);
        window.addEventListener("load", this.resizeHandler);
        window.addEventListener("resize", this.resizeHandler)
    }
    get scale(): number {
        return this._scale;
    }
    set graph(graph: Graph){
        this._graph = graph;
        this._nodeIds = this._graph.nodes.map(node => node.id);
        this.drawCanvas();
    }
    deleteElementModeOn(): void {
        this._mode = "delete";
        this._firstNodeId = undefined;
        this.drawCanvas();
    }
    addNodeModeOn(): void {
        this._mode = "addNodeMode";
        this._firstNodeId = undefined;
        this.drawCanvas();
    }
    disableEverything(): void {
        this._mode = "disabled";
        this._firstNodeId = undefined;
        this.drawCanvas();
    }
    addEdgeModeOn(): void {
        this._mode = "addEdgeMode";
        this._firstNodeId = undefined;
        this.drawCanvas();
    }
    resetToIdle(): void {
        this._mode = "idle";
        this._firstNodeId = undefined;
        this.drawCanvas();
    }
    onSelectNode(callback: (nodeId: number) => void): void {
        this._selectNodeCallback = callback;
    }
    onSelectEdge(callback: (edgeId: number) => void): void {
        this._selectEdgeCallback = callback;
    }
    onCanvasBlankClick(callback: () => void): void {
        this._canvasBlankClick = callback;
    }
    fitGraphIntoAnimationSpace():void {
        const infoBoxWidth = algorithmInformationBox!.clientWidth || 50;
        const { topLeft, width, height } = this.measureGraphRectangle();

        const animationSpaceWidth = this._canvasWidth - infoBoxWidth - 70;
        const animationSpaceHeight = this._canvasHeight - 100;

        const scaleX = animationSpaceWidth / width;
        const scaleY = animationSpaceHeight / height;
        const fitScale = Math.min(scaleX, scaleY, 1);

        if (fitScale < 1) {
            this.setCanvasScale(this._scale * fitScale);
        }

        const fittedTopX = infoBoxWidth + 50;
        const fittedTopY = (this._canvasHeight - height * fitScale) / 2;

        this._offset = new Vector(fittedTopX - topLeft.x * fitScale, fittedTopY - topLeft.y * fitScale);

        this.drawCanvas();
    }
    loadPreset(preset: Preset): void {
        this._graph.clearGraph();
        
        this._scale = preset.info.scale;
        this._nodeIds = [];
        
        for (const node of preset.nodes) {
            this._graph.addExistingNode(node.id, new Vector(node.x, node.y), node.color);
            this._nodeIds.push(node.id);
        }
        
        for (const edge of preset.edges) {
            if (this._graph.isWeighted) {
                this._graph.addEdge(edge.from, edge.to, this._edgeWidth, edge.weight);
            } else {
                this._graph.addEdge(edge.from, edge.to, this._edgeWidth);
            }
        }
        
        this.fitGraphIntoAnimationSpace();
    }
    clearGraph(): void {
        this._graph.clearGraph();
        this._nodeIds = [];
        this.drawCanvas();
    }
    drawCanvas = (): void => {
        this._ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.drawEdges();
        this.drawNodes();
        
        if (this._pendingEdge) {
            this.drawPendingEdge();
            this.drawNode(this._graph.getNode(this._firstNodeId!)!);
        }
    };
    private canvasScaleDown(): void {
        if (this._scale < 0.5) return;
        
        this._scale *= 1 - this._scaleFactor;
        
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;
            node.position = node.position.scale(1 - this._scaleFactor);
        }
    }
    private setCanvasScale(newScale: number): void {
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;
            node.position = node.position.scale(newScale / this._scale);
        }
        
        this._scale = newScale;
    }
    private canvasScaleUp(): void {
        this._scale *= 1 + this._scaleFactor;
        
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;
        
            node.position = node.position.scale(1 + this._scaleFactor);
        }
    }
    private hitNode(pos: Vector): number {
        for (let i = this._nodeIds.length - 1; i >= 0; i--) {
            const node = this._graph.getNode(this._nodeIds[i])!;
            const nodePos = node.position;

            if (pos.subtract(nodePos).length < node.size * this._scale + (node.nodeBorderWidth * this._scale / 2)) {
                return i;
            }
        }
        
        return -1;
    }
    private hitEdge(pos: Vector): number {
        for (const edge of this._graph.edges) {
            const fromNode = this._graph.getNode(edge.from)!;
            const toNode = this._graph.getNode(edge.to)!;
            const from = fromNode.position;
            const to = toNode.position;

            const hasAPair = this._graph.edgeHasParallel(edge);
            if (hasAPair && this.checkIfOnArc(pos, from, to, edge.width)) {
                return edge.id;
            }
            if ((!this._graph.isDirected || !hasAPair) && this.checkIfOnLine(pos, from, to, edge.width)) {
                return edge.id;
            }
        }
        return -1;
    }

    private drawPendingEdge(): void {
        const firstNode = this._graph.getNode(this._firstNodeId!)!;
        const from = firstNode.position;
        const to = this.screenToCanvas(this._mousePosition);

        const directionNormalized = to.subtract(from).normalize();
        const offset = directionNormalized.scale(firstNode.size * this._scale + firstNode.nodeBorderWidth * this._scale / 2);
        const start = from.add(offset);

        this.drawLine(start, to, 2, "black");
        if (this._graph.isDirected) {
            this.drawTriangleTo(to, directionNormalized, "black");
            return;
        }
        this.drawArc(to, 3 * this._scale, 0, Math.PI * 2, "black", 2, "red");
    }
    private drawEdges(): void {
        for (const edge of this._graph.edges) {
            this.drawEdge(edge);
        }
    }
    private drawNodes(): void {
        for (const id of this._nodeIds) {
            if(id !== this._firstNodeId){
                this.drawNode(this._graph.getNode(id)!);
            }
        }
    }
    private screenToCanvas(screenPos: Vector): Vector {
        return screenPos.subtract(this._offset);
    }
    private canvasToScreen(canvasPos: Vector): Vector {
        return canvasPos.add(this._offset);
    }
    private drawLine(from: Vector, to: Vector, lineWidth: number, color: string): void {
        const screenFrom = this.canvasToScreen(from);
        const screenTo = this.canvasToScreen(to);
        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth * this._scale;
        this._ctx.strokeStyle = color;
        this._ctx.moveTo(screenFrom.x, screenFrom.y);
        this._ctx.lineTo(screenTo.x, screenTo.y);
        this._ctx.stroke();
        this._ctx.closePath();
    }
    private drawArc(center: Vector, radius: number, startingAngle: number, endAngle: number, contour: string, lineWidth: number, color?: string): void {
        const screenCenter = this.canvasToScreen(center);
        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth * this._scale;
        this._ctx.strokeStyle = contour;
        this._ctx.arc(screenCenter.x, screenCenter.y, radius, startingAngle, endAngle);
        this._ctx.stroke();
        if (color) {
            this._ctx.fillStyle = color;
            this._ctx.fill();
        }
        this._ctx.closePath();
    }
    private drawText(pos: Vector, text: string, fontFamily: string, fontColor: string): void {
        const screenPos = this.canvasToScreen(pos);
        this._ctx.font = `${this._fontSize * this._scale}px ${fontFamily}`;
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "middle";
        this._ctx.fillStyle = fontColor;
        this._ctx.fillText(text, screenPos.x, screenPos.y);
    }
    private drawNode(node: Node): void {
        this.drawArc(node.position, node.size * this._scale, 0, Math.PI * 2, "black", node.nodeBorderWidth, node.color ? node.color : "white");
        this.drawText(node.position, `${node.label}`, "arial", "black");
    }
    private drawEdge(edge: Edge): void {
        const fromNode = this._graph.getNode(edge.from)!;
        const toNode = this._graph.getNode(edge.to)!;

        const from = fromNode.position;
        const to = toNode.position;
        if (this._graph.isDirected) {
            if (this._graph.edgeHasParallel(edge)) {
                this.drawCurvedEdge(from, to, edge.width, edge.color, edge.weight);
            } else {
                this.drawStraightEdge(from, to, edge.width, edge.color, edge.weight);
                const edgeVec = to.subtract(from);
                const edgeNormalized = edgeVec.normalize();
                const arrowOffset = edgeVec.length - toNode.size * this._scale - toNode.nodeBorderWidth * this._scale / 2;
                const arrowTip = from.add(edgeNormalized.scale(arrowOffset));
                this.drawTriangleTo(arrowTip, edgeNormalized, edge.color);
            }
        } else {
            this.drawStraightEdge(from, to, edge.width, edge.color, edge.weight);
        }
    }
    private drawStraightEdge(from: Vector, to: Vector, width: number, color: string, weight?: number): void {
        this.drawLine(from, to, width, color);
        if (this._graph.isWeighted) {
            this.drawWeightToHalfLine(from, to, weight!, color);
        }
    }
    private drawCurvedEdge(from: Vector, to: Vector, width: number, color: string, weight?: number): void {
        const edgeVec = to.subtract(from);
        const edgeNormalized = edgeVec.normalize();
        const edgeNormal = edgeNormalized.normal;
        const edgeLength = edgeVec.length;

        const midpoint = from.add(to).scale(0.5);
        const circleCenter = midpoint.add(edgeNormal.scale(edgeLength));

        const angleA = this.getAngleNormalized(from.subtract(circleCenter));
        const angleB = this.getAngleNormalized(to.subtract(circleCenter));
        let startAngle = Math.min(angleA, angleB);
        let endAngle = Math.max(angleA, angleB);
        const radius = to.subtract(circleCenter).length;
        if (endAngle - startAngle > Math.PI) {
            [endAngle, startAngle] = [startAngle, endAngle];
        }

        this.drawArc(circleCenter, radius, startAngle, endAngle, color, width);

        const arrowTip = circleCenter.add(edgeNormal.scale(-radius));
        this.drawTriangleTo(arrowTip, edgeNormalized, color);
        if (this._graph.isWeighted) {
            this.drawWeightToArcMiddle(circleCenter, radius, midpoint.subtract(circleCenter), weight!, color);
        }
    }
    private getAngleNormalized(v: Vector): number {
        return (Math.atan2(v.y, v.x) + Math.PI * 2) % (Math.PI * 2);
    }
    private drawTriangleTo(tip: Vector, direction: Vector, color: string): void {
        const dir = direction.normalize();
        const normal = new Vector(dir.y, -dir.x);

        const triangleHeight = 13 * this._scale;
        const halfBaseLength = 7 * this._scale;

        const base = tip.subtract(dir.scale(triangleHeight));
        const screenTip = this.canvasToScreen(tip);
        const screenLeft = this.canvasToScreen(base.add(normal.scale(halfBaseLength)));
        const screenRight = this.canvasToScreen(base.subtract(normal.scale(halfBaseLength)));

        this._ctx.beginPath();
        this._ctx.moveTo(screenLeft.x, screenLeft.y);
        this._ctx.lineTo(screenRight.x, screenRight.y);
        this._ctx.lineTo(screenTip.x, screenTip.y);
        this._ctx.closePath();
        this._ctx.fillStyle = color;
        this._ctx.fill();
    }
    private checkIfOnArc(point: Vector, from: Vector, to: Vector, arcWidth: number): boolean {
        const threshold = (arcWidth / 2) * this._scale + this._scale;

        const edgeVec = to.subtract(from);
        const edgeNormal = edgeVec.normalize().normal;
        const midpoint = from.add(to).scale(0.5);
        const circleCenter = midpoint.add(edgeNormal.scale(edgeVec.length));

        const radius = to.subtract(circleCenter).length;
        if (Math.abs(point.subtract(circleCenter).length - radius) >= threshold) return false;

        const mouseAngle = this.getAngleNormalized(point.subtract(circleCenter));
        const angleA = this.getAngleNormalized(from.subtract(circleCenter));
        const angleB = this.getAngleNormalized(to.subtract(circleCenter));
        const startAngle = Math.min(angleA, angleB);
        const endAngle = Math.max(angleA, angleB);
        let betweenAngles = startAngle < mouseAngle && mouseAngle < endAngle;

        if (endAngle - startAngle > Math.PI) betweenAngles = !betweenAngles;

        return betweenAngles;
    }
    private checkIfOnLine(point: Vector, from: Vector, to: Vector, lineWidth: number): boolean {
        const threshold = (lineWidth / 2) * this._scale + this._scale;

        const segment = to.subtract(from);
        const segmentLengthSquared = segment.length ** 2;

        if (segmentLengthSquared === 0) {
            return point.subtract(from).length <= threshold;
        }

        const toPoint = point.subtract(from);
        let projectionScalar = (toPoint.x * segment.x + toPoint.y * segment.y) / segmentLengthSquared;
        projectionScalar = Math.max(0, Math.min(1, projectionScalar));

        const closest = from.add(segment.scale(projectionScalar));
        return point.subtract(closest).length <= threshold;
    }
    private drawWeightToArcMiddle(circleCenter: Vector, radius: number, direction: Vector, weight: number, color?: string): void {
        const pos = circleCenter.add(direction.normalize().scale(radius + 15 * this._scale));
        this.drawText(pos, `${weight}`, "arial", color ?? "black");
    }
    private drawWeightToHalfLine(from: Vector, to: Vector, weight: number, color?: string): void {
        let normal = from.subtract(to).normalize().normal;

        if (normal.y > 0) {
            normal = normal.scale(-1);
        }

        const pos = from.add(to).scale(0.5).add(normal.scale(15 * this._scale));
        this.drawText(pos, `${weight}`, "arial", color ?? "black");
    }
    private updateEuclideanDistancesOfDraggedNode(): void {
        for (const edge of this._graph.getEdgesConnectedToNode(this._draggedNodeId!)) {
            const from = this._graph.getNode(edge.from)!.position;
            const to = this._graph.getNode(edge.to)!.position;
            edge.weight = this.calculateEuclideanWeight(from, to);
        }
    }
    private measureGraphRectangle(): { topLeft: Vector; width: number; height: number; } {
        let minX = Infinity;
        let maxX = -Infinity;
        
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;        
            if (node.position.x < minX) {
                minX = node.position.x;
            } else if (node.position.x > maxX) {
                maxX = node.position.x; 
            }
            if (node.position.y < minY) {
                minY = node.position.y;
            } else if (node.position.y > maxY) {
                maxY = node.position.y;
            }
        }
        const node = this._graph.getNode(this._nodeIds[0])!;
        const nodeRadius = node.size * this._scale;
        const contourOffset = node.nodeBorderWidth * this._scale;
        const padding = nodeRadius + contourOffset / 2;

        return { topLeft: new Vector(minX - padding, minY - padding), width: maxX - minX + nodeRadius * 2 + contourOffset, height: maxY - minY + nodeRadius * 2 + contourOffset };
    }
    private wheelEventHandler = (e: WheelEvent): void => {
        e.preventDefault();
        
        if (this._mode === "disabled") return;
        
        this._mousePosition = new Vector(e.x, e.y);
        const canvasMouse = this.screenToCanvas(this._mousePosition);

        if (0 < e.deltaY) {
            this.canvasScaleDown();

            this._offset = this._offset.add(canvasMouse.scale(this._scaleFactor));
        } else {
            this.canvasScaleUp();
            this._offset = this._offset.subtract(canvasMouse.scale(this._scaleFactor));
        }
        
        this.drawCanvas();
    };
    private mouseDownEventHandler = (e: MouseEvent): void => {
        e.preventDefault();
        
        if (this._mode === "disabled") return;
        
        this._mousePosition = new Vector(e.x, e.y);
        this._isDown = true;
    };
    private mouseMoveEventHandler = (e: MouseEvent): void => {
        if (this._mode === "disabled") return;
        if (!this._isDown) return;
        
        this._dragging = true;

        const eventPos = new Vector(e.x, e.y);
        const delta = this._mousePosition.subtract(eventPos);
        const canvasMouse = this.screenToCanvas(eventPos);

        this._mousePosition = eventPos;

        if (this._isPanning) {
            this._offset = this._offset.subtract(delta);
            this.drawCanvas();
            return;
        }
        
        if(this._pendingEdge){
            this.drawCanvas();
            return;
        }
        if (this._nodeDragging) {
            const draggedNode = this._graph.getNode(this._draggedNodeId!)!;
            draggedNode.position = canvasMouse.add(this._mouseNodeCenterVector);

            if (this._euclideanWeights) {
                this.updateEuclideanDistancesOfDraggedNode();
            }
            this.drawCanvas();
            return;
        }

        const hitNodeIndex = this.hitNode(canvasMouse);
        if (this._mode === "addEdgeMode" && hitNodeIndex !== -1) {
            this._firstNodeId = this._nodeIds[hitNodeIndex];
            this._pendingEdge = true;

            this.drawCanvas();
            return;
        } 
        if (hitNodeIndex !== -1) {
            this._draggedNodeId = this._nodeIds[hitNodeIndex];
            const node = this._graph.getNode(this._draggedNodeId)!;
            this._mouseNodeCenterVector = node.position.subtract(canvasMouse);
            this._nodeDragging = true;
            this._nodeIds.splice(hitNodeIndex, 1);
            this._nodeIds.push(node.id);
            this.drawCanvas();
            return;
        }
        this._offset = this._offset.subtract(delta);
        
        this._isPanning = true;
        this.drawCanvas();
        return;
    
    };
    private mouseUpEventHandler = (e: MouseEvent): void => {
        if (this._mode === "disabled") return;
        
        const canvasMouse = this.screenToCanvas(new Vector(e.x, e.y));

        if (!this._dragging && e.target == canvas && !this._isPanning) {

            if (this._mode === "addNodeMode") {
                const id = this._graph.addNode();
                const node = this._graph.getNode(id)!;
                node.position = canvasMouse;
                
                this._nodeIds.push(id);
            } else if (this._mode === "delete") {
                const hitNodeIndex = this.hitNode(canvasMouse);
                const hitEdgeId = this.hitEdge(canvasMouse);

                if (hitNodeIndex !== -1) {
                    this._graph.removeNode(this._nodeIds[hitNodeIndex]);
                    this._nodeIds.splice(hitNodeIndex, 1);
                } else if (hitEdgeId !== -1) {
                    this._graph.removeEdge(hitEdgeId);
                }

            } else if (this._mode === "idle") {
                const hitNodeIndex = this.hitNode(canvasMouse);
                const hitEdgeId = this.hitEdge(canvasMouse);

                if (hitNodeIndex !== -1) {
                    if (this._selectNodeCallback){
                        this._selectNodeCallback(this._nodeIds[hitNodeIndex]);
                    }
                } else if (hitEdgeId !== -1) {
                    if (this._selectEdgeCallback){
                        this._selectEdgeCallback(hitEdgeId);
                    }
                } else {
                    if (this._canvasBlankClick){
                        this._canvasBlankClick();
                    }
                }
            }
        } else if (this._dragging && !this._isPanning) {
            if (this._mode === "addEdgeMode") {

                const hitNodeIndex = this.hitNode(canvasMouse);

                if (hitNodeIndex !== -1 && this._firstNodeId !== undefined) {
                    const node = this._graph.getNode(this._nodeIds[hitNodeIndex])!;

                    if (this._graph.isWeighted) {
                        const firstNode = this._graph.getNode(this._firstNodeId)!;

                        const euclideanWeight = this.calculateEuclideanWeight(firstNode.position, node.position);
                        let normalWeight = Math.floor(Math.random() * 5) + 1;
                        normalWeight *= (this._negativeEdges && Math.random() > 0.8) ? -1 : 1;
                        
                        const weight = this._euclideanWeights ?  euclideanWeight: normalWeight;
                        this._graph.addEdge( this._firstNodeId, node.id, this._edgeWidth, weight );
                    } else {
                        this._graph.addEdge( this._firstNodeId, node.id, this._edgeWidth );
                    }
                    
                    this._firstNodeId = undefined;
                    this._pendingEdge = false;
                } else {
                    this._firstNodeId = undefined;
                    this._pendingEdge = false;
                }
            }
        }
        this._draggedNodeId = undefined;
        this._nodeDragging = false;
        this._dragging = false;
        this._isDown = false;
        this._isPanning = false;
        
        this.drawCanvas();
    };
    private calculateEuclideanWeight(from: Vector, to: Vector): number {
        return Math.floor(from.subtract(to).length / (10 * this._scale));
    }
    private resizeHandler = ():void =>{
        const editingPanelRect = editingPanel!.getBoundingClientRect();
        
        const newHeight = window.innerHeight;
        const newWidth = window.innerWidth - editingPanelRect.width;        
        
        this._dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(newWidth * this._dpr);
        canvas.height = Math.round(newHeight * this._dpr);;
        
        this._canvasWidth = Math.round(newWidth);
        this._canvasHeight = Math.round(newHeight);
        
        canvas.style.width = `${Math.round(newWidth)}px`;
        canvas.style.height = `${Math.round(newHeight)}px`;
        
        this._ctx.reset();
        this._ctx.scale(this._dpr, this._dpr);
        
        this.drawCanvas();
    }
}
