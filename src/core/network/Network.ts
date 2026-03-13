import Graph from "../datastructures/Graph";
import Edge from "../datastructures/Edge";
import Node from "../datastructures/Node";
import { algorithmInformationBox, canvas, editingPanel } from "../dom/elements";
import { Preset} from "../types/preset";

type networkMode = "addEdgeMode" | "addNodeMode" | "idle" | "delete" | "disabled";
export default class Network{
    private readonly _ctx = canvas.getContext("2d")!;
    private readonly _negativeEdges: boolean;
    private readonly _nodeSize = 27;
    private readonly _nodeContourWidth = 4;
    private readonly _euclideanWeights: boolean;
    private readonly _fontSize = 17;
    private readonly _edgeWidth = 2;
    private _graph: Graph;
    private _isDown = false;
    private _dragging = false;
    private _isPanning = false;
    private _offsetX = 0;
    private _offsetY = 0;
    private _scale = 1;
    private _scaleFactor = 0.05;
    private _mousePositionX = 0;
    private _mousePositionY = 0;
    private _nodeIds:number[] = [];
    private _mouseNodeCenterVectorX = 0;
    private _mouseNodeCenterVectorY = 0;
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
        const { topLeftX, topLeftY, width, height } = this.measureGraphRectangle();

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

        this._offsetX = fittedTopX - topLeftX * fitScale;
        this._offsetY = fittedTopY - topLeftY * fitScale;

        this.drawCanvas();
    }
    loadPreset(preset: Preset): void {
        this._graph.clearGraph();
        
        this._scale = preset.info.scale;
        this._nodeIds = [];
        
        for (const node of preset.nodes) {
            this._graph.addExistingNode(node.id, node.x, node.y, node.color);
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
            node.x = node.x * (1 - this._scaleFactor);
            node.y = node.y * (1 - this._scaleFactor);
        }
    }
    private setCanvasScale(newScale: number): void {
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;
            
            node.x = (node.x * newScale) / this._scale;
            node.y = (node.y * newScale) / this._scale;
        }
        
        this._scale = newScale;
    }
    private canvasScaleUp(): void {
        this._scale *= 1 + this._scaleFactor;
        
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;
        
            node.x = node.x * (1 + this._scaleFactor);
            node.y = node.y * (1 + this._scaleFactor);
        }
    }
    private hitNode( x: number, y: number ): number {
        for (let i = this._nodeIds.length - 1; i >= 0; i--) {
            const node = this._graph.getNode(this._nodeIds[i])!;
            
            if ((node.x - x) ** 2 + (node.y - y) ** 2 < (this._nodeSize * this._scale + (this._nodeContourWidth * this._scale / 2)) ** 2) {
                return i;
            }
        }
        
        return -1;
    }
    private hitEdge(x: number, y: number): number {
        for (const edge of this._graph.edges) {
            const fromNode = this._graph.getNode(edge.from)!;
            
            const fromX = fromNode.x;
            const fromY = fromNode.y;
            
            const toNode = this._graph.getNode(edge.to)!;
            const toX = toNode.x;
            const toY = toNode.y;
            
            const hasAPair = this._graph.edgeHasParallel(edge)
            if(hasAPair && this.checkIfOnArc(x, y, fromX, fromY, toX, toY, edge.width)){
                return edge.id;
            }
            if((!this._graph.isDirected || !hasAPair) && this.checkIfOnLine(x, y, fromX, fromY, toX, toY, edge.width)){
                return edge.id;
            }
        }
        return -1;
    }
    private measureDistance( x1: number, y1: number, x2: number, y2: number ): number {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }
    private drawPendingEdge(): void {
        const firstNode = this._graph.getNode(this._firstNodeId!)!;
        const x1 = firstNode.x;
        const y1 = firstNode.y;
        
        const x2 = this.screenToCanvasX(this._mousePositionX);
        const y2 = this.screenToCanvasY(this._mousePositionY);
        
        const length = this.measureDistance(x1, y1, x2, y2);
        const mouseNodeVectorNormalizedX = (x2 - x1) / length;
        const mouseNodeVectorNormalizedY = (y2 - y1) / length;
        
        const startingX = x1 + mouseNodeVectorNormalizedX * (this._nodeSize * this._scale) + mouseNodeVectorNormalizedX * (this._nodeContourWidth * this._scale / 2);
        const startingY = y1 + mouseNodeVectorNormalizedY * (this._nodeSize * this._scale) + mouseNodeVectorNormalizedY * (this._nodeContourWidth * this._scale / 2);
        
        this.drawLine(startingX, startingY, x2, y2, 2, "black");
        if(this._graph.isDirected){
            this.drawTriangleTo(x2, y2, mouseNodeVectorNormalizedX, mouseNodeVectorNormalizedY, "black");
            return;
        }
        this.drawArc(x2, y2, 3 * this._scale, 0, Math.PI * 2, "black", 2, "red")
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
    private screenToCanvasX(screenX: number): number {
        return screenX - this._offsetX;
    }
    private screenToCanvasY(screenY: number): number {
        return screenY - this._offsetY;
    }
    private canvasToScreenX(canvasX: number): number {
        return canvasX + this._offsetX;
    }
    private canvasToScreenY(canvasY: number): number {
        return canvasY + this._offsetY;
    }
    private drawLine(fromX: number, fromY: number, toX: number, toY: number, lineWidth: number, color: string):void{
        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth * this._scale;
        this._ctx.strokeStyle = color;
        this._ctx.moveTo(this._offsetX + fromX, this._offsetY + fromY);
        this._ctx.lineTo(this._offsetX + toX, this._offsetY + toY);
        this._ctx.stroke();
        this._ctx.closePath();
    }
    private drawArc(x:number, y:number, radius: number, startingAngle: number, endAngle: number, contour: string, lineWidth: number,color?: string):void{
        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth * this._scale;
        this._ctx.strokeStyle = contour;
        this._ctx.arc(this._offsetX + x, this._offsetY + y, radius, startingAngle, endAngle);
        this._ctx.stroke();
        if(color){
            this._ctx.fillStyle = color;
            this._ctx.fill();
        }
        this._ctx.closePath();
    }
    private drawText(x: number, y: number,text: string, fontFamily: string, fontColor: string):void{
        this._ctx.font = `${this._fontSize * this._scale}px ${fontFamily}`;
        this._ctx.textAlign = "center";
        this._ctx.textBaseline = "middle";
        this._ctx.fillStyle = fontColor;
        this._ctx.fillText(text, this._offsetX + x, this._offsetY + y);
    }
    private drawNode(node: Node): void {
        this.drawArc(node.x, node.y, this._nodeSize * this._scale, 0, Math.PI * 2,"black",this._nodeContourWidth, node.color ? node.color : "white")
        this.drawText(node.x, node.y, `${node.label}`, "arial", "black");
    }
    private drawEdge(edge: Edge): void {
        const fromNode = this._graph.getNode(edge.from)!;
        const toNode = this._graph.getNode(edge.to)!;

        const fromX = fromNode.x;
        const fromY = fromNode.y;
       
        const toX = toNode.x;
        const toY = toNode.y;

        if(this._graph.isDirected){
            if(this._graph.edgeHasParallel(edge)){
                this.drawCurvedEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.weight);
            }else{
                this.drawStraightEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.weight)
                const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
                
                let edgeVectorNormalizedX = (toX - fromX) / lengthOfEdge;
                let edgeVectorNormalizedY = (toY - fromY) / lengthOfEdge;
                
                edgeVectorNormalizedX *= (lengthOfEdge - (this._nodeSize * this._scale) - (this._nodeContourWidth * this._scale) / 2)
                edgeVectorNormalizedY *= (lengthOfEdge - (this._nodeSize * this._scale) - (this._nodeContourWidth * this._scale) / 2)
                
                this.drawTriangleTo(fromX + edgeVectorNormalizedX, fromY + edgeVectorNormalizedY, edgeVectorNormalizedX, edgeVectorNormalizedY, edge.color);
            }
        }else{
            this.drawStraightEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.weight)
        }
    }
    private drawStraightEdge(fromX:number, fromY:number, toX:number, toY:number, width: number, color: string, weight?: number):void{
        this.drawLine(fromX, fromY, toX, toY, width, color);
        if (this._graph.isWeighted){ 
            this.drawWeightToHalfLine(fromX,fromY,toX,toY, weight!, color);
        }
    }
    private drawCurvedEdge(fromX:number, fromY:number, toX:number, toY:number, width: number, color: string, weight?: number):void{
        const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
        const edgeVectorNormalizedX = (toX - fromX) / lengthOfEdge;
        const edgeVectorNormalizedY = (toY - fromY) / lengthOfEdge;
        
        let edgeVectorNormalVectorX = -edgeVectorNormalizedY;
        let edgeVectorNormalVectorY = edgeVectorNormalizedX;
        
        const circleCenterX = (fromX + toX) / 2 + edgeVectorNormalVectorX * lengthOfEdge;
        const circleCenterY = (fromY + toY) / 2 + edgeVectorNormalVectorY * lengthOfEdge;

        const angleA = this.getAngleNormalized(fromX - circleCenterX, -(fromY - circleCenterY));
        const angleB = this.getAngleNormalized(toX - circleCenterX, -(toY - circleCenterY));
        let startAngle = Math.min(angleA, angleB);
        let endAngle = Math.max(angleA, angleB);
        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);
        if(endAngle - startAngle > Math.PI){
            [endAngle, startAngle] = [startAngle, endAngle];
        }
        
        this.drawArc(circleCenterX, circleCenterY, radius, startAngle, endAngle, color, width);
        
        edgeVectorNormalVectorX *= -1;
        edgeVectorNormalVectorY *= -1;
        
        this.drawTriangleTo(circleCenterX + edgeVectorNormalVectorX * radius, circleCenterY + edgeVectorNormalVectorY *  radius, edgeVectorNormalizedX, edgeVectorNormalizedY, color);
        if(this._graph.isWeighted){
            this.drawWeightToArcMiddle(circleCenterX, circleCenterY, radius, (fromX + toX) / 2 - circleCenterX, (fromY + toY) / 2 - circleCenterY, weight!, color);
        }
    }
    private getAngleNormalized(vectorX: number, vectorY: number): number {
        return (Math.atan2(-vectorY, vectorX) + Math.PI * 2) % (Math.PI * 2);
    }
    private drawTriangleTo(x:number, y:number, directionVectorX:number, directionVectorY:number, color: string):void{
        const lengthOfVector = this.measureDistance(0, 0, directionVectorX , directionVectorY);
        directionVectorX = directionVectorX / lengthOfVector;
        directionVectorY = directionVectorY / lengthOfVector;
        
        const normalVectorX = directionVectorY;
        const normalVectorY = -directionVectorX;
        
        const triangleHeight = 13 * this._scale;
        const halfBaseLength = 7  * this._scale;
        
        this._ctx.beginPath();
        this._ctx.moveTo(this._offsetX + (x - directionVectorX * triangleHeight) + normalVectorX * halfBaseLength,this._offsetY + (y - directionVectorY * triangleHeight) + normalVectorY * halfBaseLength);
        this._ctx.lineTo(this._offsetX + (x - directionVectorX * triangleHeight) - normalVectorX * halfBaseLength,this._offsetY + (y - directionVectorY * triangleHeight) - normalVectorY * halfBaseLength);
        this._ctx.lineTo(this._offsetX + x, this._offsetY + y);
        this._ctx.closePath();
        this._ctx.fillStyle = color;
        this._ctx.fill();
    }
    private checkIfOnArc(x: number, y: number, fromX: number, fromY: number, toX: number, toY: number, arcWidth: number):boolean{
        const threshold = (arcWidth / 2) * this._scale + this._scale;

        const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
        const circleCenterX = (fromX + toX) / 2 + ((-(toY - fromY)) / lengthOfEdge) * lengthOfEdge;
        const circleCenterY = (fromY + toY) / 2 + ((toX - fromX) / lengthOfEdge) * lengthOfEdge;

        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);
        const distanceFromCenterToMouse = this.measureDistance(circleCenterX, circleCenterY, x, y);
        if (Math.abs(distanceFromCenterToMouse - radius) >= threshold) return false;

        const mouseAngle = this.getAngleNormalized(x - circleCenterX, -(y - circleCenterY));
        const angleA = this.getAngleNormalized(fromX - circleCenterX, -(fromY - circleCenterY));
        const angleB = this.getAngleNormalized(toX - circleCenterX, -(toY - circleCenterY));
        const startAngle = Math.min(angleA, angleB);
        const endAngle = Math.max(angleA, angleB);
        let betweenAngles = startAngle < mouseAngle && mouseAngle < endAngle;
       
        if (endAngle - startAngle > Math.PI) betweenAngles = !betweenAngles;

        return betweenAngles;     
    }
    private checkIfOnLine( x: number, y: number, x1: number, y1: number, x2: number, y2: number, lineWidth: number ): boolean {
        const threshold = (lineWidth / 2) * this._scale + this._scale;
        
        const xDelta = x2 - x1;
        const yDelta = y2 - y1;
        const segmentLengthSquared = xDelta ** 2 + yDelta ** 2;
        
        if (segmentLengthSquared === 0) {
            return this.measureDistance(x, y, x1, y1) <= threshold;
        }

        let projectionScalar = ((x - x1) * xDelta + (y - y1) * yDelta) / segmentLengthSquared;
        projectionScalar = Math.max(0, Math.min(1, projectionScalar));

        const closestX = x1 + projectionScalar * xDelta;
        const closestY = y1 + projectionScalar * yDelta;
        
        return this.measureDistance(closestX, closestY, x, y) <= threshold;
    }
    private drawWeightToArcMiddle(circleCenterX: number, circleCenterY: number,radius:number, directionVectorX: number, directionVectorY: number, weight: number, color?: string):void{
        const length = this.measureDistance(0, 0, directionVectorX, directionVectorY);
        
        directionVectorX = directionVectorX / length;
        directionVectorY = directionVectorY / length;
        
        const x = circleCenterX + directionVectorX * (radius + 15 * this._scale);
        const y = circleCenterY + directionVectorY * (radius + 15 * this._scale);
        
        this.drawText(x, y, `${weight}`, "arial", color ?? "black");
    }
    private drawWeightToHalfLine( x1: number, y1: number, x2: number, y2: number, weight: number, color?: string ): void {
        const length = this.measureDistance(x1, y1, x2, y2);

        let lineVectorNormalizedX = (x1 - x2) / length;
        let lineVectorNormalizedY = (y1 - y2) / length;

        let normalVectorX = -lineVectorNormalizedY;
        let normalVectorY = lineVectorNormalizedX;

        if (normalVectorY > 0) {
            normalVectorX *= -1;
            normalVectorY *= -1;
        }

        const x = (x1 + x2) / 2 + normalVectorX * 15 * this._scale;
        const y = (y1 + y2) / 2 + normalVectorY * 15 * this._scale;

        this.drawText(x, y, `${weight}`, "arial", color ?? "black");
    }
    private updateEuclideanDistancesOfDraggedNode(): void {
        for (const edge of this._graph.getEdgesConnectedToNode( this._draggedNodeId! )) {

            const fromNode = this._graph.getNode(edge.from)!;
            const toNode = this._graph.getNode(edge.to)!;
            
            edge.weight = this.calculateEuclideanWeight(fromNode.x, fromNode.y, toNode.x, toNode.y);
        }
    }
    private measureGraphRectangle(): { topLeftX: number; topLeftY: number; width: number; height: number; } {
        let minX = Infinity;
        let maxX = -Infinity;
        
        let minY = Infinity;
        let maxY = -Infinity;
        
        for (const nodeId of this._nodeIds) {
            const node = this._graph.getNode(nodeId)!;        
            if (node.x < minX) {
                minX = node.x;
            } else if (node.x > maxX) {
                maxX = node.x; 
            }
            if (node.y < minY) {
                minY = node.y;
            } else if (node.y > maxY) {
                maxY = node.y;
            }
        }
        const nodeRadius = this._nodeSize * this._scale;
        const contourOffset = this._nodeContourWidth * this._scale;
        const padding = nodeRadius + contourOffset / 2;

        return { topLeftX: minX - padding, topLeftY: minY - padding, width: maxX - minX + nodeRadius * 2 + contourOffset, height: maxY - minY + nodeRadius * 2 + contourOffset };
    }
    private wheelEventHandler = (e: WheelEvent): void => {
        e.preventDefault();
        
        if (this._mode === "disabled") return;
        
        this._mousePositionX = e.x;
        this._mousePositionY = e.y;
        
        const canvasMouseX = this.screenToCanvasX(this._mousePositionX);
        const canvasMouseY = this.screenToCanvasY(this._mousePositionY);
        
        if (0 < e.deltaY) {
            this.canvasScaleDown();
        
            this._offsetY += this.canvasToScreenY(canvasMouseY * this._scaleFactor) - this._offsetY;
            this._offsetX += this.canvasToScreenX(canvasMouseX * this._scaleFactor) - this._offsetX;
        } else {
            this.canvasScaleUp();
        
            this._offsetY += this._offsetY - this.canvasToScreenY(canvasMouseY * this._scaleFactor);
            this._offsetX += this._offsetX - this.canvasToScreenX(canvasMouseX * this._scaleFactor);
        }
        
        this.drawCanvas();
    };
    private mouseDownEventHandler = (e: MouseEvent): void => {
        e.preventDefault();
        
        if (this._mode === "disabled") return;
        
        this._mousePositionX = e.x;
        this._mousePositionY = e.y;
        
        this._isDown = true;
    };
    private mouseMoveEventHandler = (e: MouseEvent): void => {
        if (this._mode === "disabled") return;
        if (!this._isDown) return;
        
        this._dragging = true;
        
        const deltaX = this._mousePositionX - e.x;
        const deltaY = this._mousePositionY - e.y;
        
        const canvasMouseX = this.screenToCanvasX(e.x);
        const canvasMouseY = this.screenToCanvasY(e.y);
        
        this._mousePositionX = e.x;
        this._mousePositionY = e.y;
        
        if(this._isPanning){
            this._offsetX -= deltaX;
            this._offsetY -= deltaY;
            this.drawCanvas();
            return;
        }
        
        if(this._pendingEdge){
            this.drawCanvas();
            return;
        }
        if(this._nodeDragging){
            const draggedNode = this._graph.getNode(this._draggedNodeId!)!;
        
            draggedNode.x = canvasMouseX + this._mouseNodeCenterVectorX;
            draggedNode.y = canvasMouseY + this._mouseNodeCenterVectorY;
            
            if (this._euclideanWeights){
                this.updateEuclideanDistancesOfDraggedNode();
            }
            this.drawCanvas();
            return;
        }
        
        const hitNodeIndex = this.hitNode(canvasMouseX, canvasMouseY);
        if ( this._mode === "addEdgeMode" && hitNodeIndex !== -1) {
            this._firstNodeId = this._nodeIds[hitNodeIndex];
            this._pendingEdge = true;

            this.drawCanvas();
            return;
        } 
        if (hitNodeIndex !== -1) {
            this._draggedNodeId = this._nodeIds[hitNodeIndex];
            const node = this._graph.getNode(this._draggedNodeId)!;
            
            this._mouseNodeCenterVectorX = node.x - canvasMouseX;
            this._mouseNodeCenterVectorY = node.y - canvasMouseY;
            
            this._nodeDragging = true;
            
            this._nodeIds.splice(hitNodeIndex, 1);
            this._nodeIds.push(node.id);
            this.drawCanvas();
            return;
        }
        this._offsetX -= deltaX;
        this._offsetY -= deltaY;
        
        this._isPanning = true;
        this.drawCanvas();
        return;
    
    };
    private mouseUpEventHandler = (e: MouseEvent): void => {
        if (this._mode === "disabled") return;
        
        const canvasMouseX = this.screenToCanvasX(e.x);
        const canvasMouseY = this.screenToCanvasY(e.y);
        
        if (!this._dragging && e.target == canvas && !this._isPanning) {
            
            if (this._mode === "addNodeMode") {
                const id = this._graph.addNode();
                const node = this._graph.getNode(id)!
                
                node.x = canvasMouseX;
                node.y = canvasMouseY;
                
                this._nodeIds.push(id);
            } else if (this._mode === "delete") {
                const hitNodeIndex = this.hitNode(canvasMouseX, canvasMouseY);
                const hitEdgeId = this.hitEdge(canvasMouseX, canvasMouseY);
                
                if (hitNodeIndex !== -1) {
                    this._graph.removeNode(this._nodeIds[hitNodeIndex]);
                    this._nodeIds.splice(hitNodeIndex, 1);
                
                } else if (hitEdgeId !== -1) {
                    this._graph.removeEdge(hitEdgeId);
                }

            } else if (this._mode === "idle") {
                const hitNodeIndex = this.hitNode(canvasMouseX, canvasMouseY);
                const hitEdgeId = this.hitEdge(canvasMouseX, canvasMouseY);

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
                
                const hitNodeIndex = this.hitNode( canvasMouseX, canvasMouseY );
                
                if (hitNodeIndex !== -1 && this._firstNodeId !== undefined) {
                    const node = this._graph.getNode(this._nodeIds[hitNodeIndex])!;

                    if (this._graph.isWeighted) {
                        const firstNode = this._graph.getNode(this._firstNodeId)!;
                        
                        const euclideanWeight = this.calculateEuclideanWeight(firstNode.x, firstNode.y, node.x, node.y);                
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
    private calculateEuclideanWeight(x1: number, y1: number, x2: number, y2: number): number {
         return Math.floor( this.measureDistance( x1, y1, x2, y2 ) / (10 * this._scale) );
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
