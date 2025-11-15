import Graph from "../datastructures/Graph";
import Edge from "../datastructures/Edge";
import Node from "../datastructures/Node";
import { algorithmInformationBox, canvas, editingPanel } from "../dom/elements";
import { saveAs } from "file-saver"
import { Preset, presetEdge, presetNode } from "../types/preset";

type networkMode = "addEdgeMode" | "addNodeMode" | "idle" | "delete" | "disabled";
export default class Network{
    private readonly _ctx = canvas.getContext("2d")!;
    private readonly _graph: Graph;
    private readonly _edgesBidirectional:boolean;
    private readonly _negativeEdges: boolean;
    private readonly _nodeSize = 30;
    private readonly _nodeContourWidth = 4;
    private readonly _euclideanWeights: boolean;
    private readonly _fontSize = 17;
    private readonly _edgeWidth = 2;
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

    constructor(graph: Graph,edgesBidirectional: boolean = false, euclideanWeights: boolean = false, negativeEdges: boolean = false) {
        this._graph = graph;
        this._euclideanWeights = euclideanWeights;
        this._edgesBidirectional = edgesBidirectional;
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
    saveGraphToJSON():void{
        const jsonOjbect:Preset = {
            info: {
                weighted: this._graph.isWeighted,
                edgesBidirectional: this._edgesBidirectional,
                scale: this._scale
                }, 
            nodes: [], 
            edges: []
        };

        for(const node of this._graph.nodes){
            const nodeObj: presetNode = {
                id: node.id,
                x: node.x,
                y: node.y,
                color: node.color,
            }
            jsonOjbect.nodes.push(nodeObj);
        }
        
        const edges = this._graph.edges;
        for(let edgeId = 0; edgeId < edges.length; edgeId++){
            const edge = edges[edgeId]
            const edgeOjb:presetEdge = {
                from: edge.from,
                to: edge.to,
            }
            if(this._graph.isWeighted){
                edgeOjb.weight = edge.weight!
            }
            jsonOjbect.edges.push(edgeOjb);
            
        }
        const blob = new Blob([JSON.stringify(jsonOjbect)], { type: "application/json;charset=utf-8" });
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const time = now.toTimeString() .split(" ")[0] .replace(/:/g, "-");
        const filename = `graphwiz-${date}_${time}.json`;
        saveAs(blob, filename);
    }
    deleteElementModeOn(): void {
        this.resetToIdle();
        this._mode = "delete";
    }
    addNodeModeOn(): void {
        this.resetToIdle();
        this._mode = "addNodeMode";
    }
    disableEverything(): void {
        this.resetToIdle();
        this._mode = "disabled";
    }
    addEdgeModeOn(): void {
        this.resetToIdle();
        this._mode = "addEdgeMode";
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
    fitGraphIntoAnimationSpace():void{
        const algorithmInfoBoxOffsetX = algorithmInformationBox!.clientWidth === 0? 50: algorithmInformationBox!.clientWidth;
        let {topLeftX, topLeftY, width, height} = this.measureGraphRectangle();
        
        const animationSpaceWidth = this._canvasWidth - algorithmInfoBoxOffsetX - 70;
        const animationSpaceHeight = this._canvasHeight - 100;
        
        if(width / animationSpaceWidth > 1){
            let newScale = animationSpaceWidth / width;
            
            topLeftX *= newScale
            topLeftY *= newScale
            
            height *= newScale
            width *=newScale
            
            if(height/animationSpaceHeight > 1){
                newScale *= animationSpaceHeight / height
               
                topLeftX *= animationSpaceHeight / height
                topLeftY *= animationSpaceHeight / height
               
                width *= animationSpaceHeight / height
                height *= animationSpaceHeight / height
            }
            
            this.setCanvasScale(this._scale * newScale);
        }else if(height / animationSpaceHeight > 1){
            this.setCanvasScale(this._scale * (animationSpaceHeight / height))
            
            topLeftX *= animationSpaceHeight / height
            topLeftY *= animationSpaceHeight / height
            
            width *= animationSpaceHeight / height
            height *= animationSpaceHeight / height
        }
        
        const fittedTopX = algorithmInfoBoxOffsetX + 50;
        const fittedTopY = (this._canvasHeight - height) / 2;
        
        this._offsetX = fittedTopX - topLeftX;
        this._offsetY = fittedTopY - topLeftY;
        
        this.drawCanvas();
    }
    updateEdge(edge :{id: number, color?: string, weight?: number, width?: number}):void{
        const edgeToModified = this._graph.getEdge(edge.id)!;
        if(edge.color){
            edgeToModified.color = edge.color;
        }
        if(edge.weight){
            edgeToModified.weight = edge.weight;
        }
        if(edge.width){
            edgeToModified.width = edge.width;
        }
        this.drawCanvas();
    }
    updateEdges(edges: {id: number, color?: string, weight?: number, width?: number}[]): void {
        edges.forEach(edge => {
            const edgeToModify = this._graph.getEdge(edge.id)!;
            
            if (edge.color !== undefined) {
                edgeToModify.color = edge.color;
            }
            if (edge.weight !== undefined) {
                edgeToModify.weight = edge.weight;
            }
            if(edge.width){
                edgeToModify.width = edge.width;
            }
        });
        this.drawCanvas();
    }
    updateNodes(nodes: { id: number; color?: string; label?: string }[]): void {
        nodes.forEach(node => {
            const nodeToModify = this._graph.getNode(node.id)!;

            if (node.color !== undefined) {
                nodeToModify.color = node.color;
            }
            if (node.label !== undefined) {
                nodeToModify.label = node.label;
            }
        });
        this.drawCanvas();
    }
    updateNode(node: { id: number; color?: string; label?: string }): void {
        const nodeToModify = this._graph.getNode(node.id)!;

        if (node.color !== undefined) {
            nodeToModify.color = node.color;
        }
        if (node.label !== undefined) {
            nodeToModify.label = node.label;
        }
        this.drawCanvas();
    }
    resetGraphToOriginal(): void {
        this._graph.resetGraphToOriginalVisual();
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
                this._graph.addEdge(edge.from, edge.to,this._edgesBidirectional,this._edgeWidth, edge.weight);
            } else {
                this._graph.addEdge(edge.from, edge.to, this._edgesBidirectional, this._edgeWidth);
            }
        }
        
        this.fitGraphIntoAnimationSpace();
    }
    clearGraph(): void {
        this._graph.clearGraph();
        this._nodeIds = [];
        this.drawCanvas();
    }
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
    private measureDistance( x1: number, y1: number, x2: number, y2: number ): number {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }
    private drawCanvas = (): void => {
        this._ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        this.drawEdges();
        this.drawNodes();
        
        if (this._pendingEdge) {
            this.drawPendingEdge();
            this.drawNode(this._graph.getNode(this._firstNodeId!)!);
        }
    };
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
        if(!this._edgesBidirectional){
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

        if(!this._edgesBidirectional){
            if(this._graph.edgeHasParallel(edge)){
                this.drawCurvedEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.weight);
            }else{
                this.drawStraightEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.weight)
                const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
                
                let edgeVectorNormalizedX = (toX - fromX) / lengthOfEdge;
                let edgeVectorNormalizedY = (toY - fromY) / lengthOfEdge;
                
                edgeVectorNormalizedX *= (lengthOfEdge - (this._nodeSize * this._scale) - (this._nodeContourWidth * this._scale) / 2)
                edgeVectorNormalizedY *= (lengthOfEdge - (this._nodeSize * this._scale) - (this._nodeContourWidth * this._scale) / 2)
                
                this.drawTriangleTo(fromX+edgeVectorNormalizedX, fromY+edgeVectorNormalizedY, edgeVectorNormalizedX, edgeVectorNormalizedY, edge.color);
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
        
        let edgeVectorNormalVectorX = edgeVectorNormalizedY * -1;
        let edgeVectorNormalVectorY = edgeVectorNormalizedX;
        
        const edgeCenterX = (fromX + toX) / 2;
        const edgeCenterY = (fromY + toY) / 2;

        const circleCenterX = edgeCenterX + edgeVectorNormalVectorX * lengthOfEdge;
        const circleCenterY = edgeCenterY + edgeVectorNormalVectorY * lengthOfEdge;

        const circleCenterToNodeVectorX = toX - circleCenterX;
        const circleCenterToNodeVectorY = toY - circleCenterY;
        const circleCenterFromNodeVectorX = fromX - circleCenterX;
        const circleCenterFromNodeVectorY = fromY - circleCenterY;

        const angleA = this.getAngleNormalized(circleCenterFromNodeVectorX, - circleCenterFromNodeVectorY);
        const angleB = this.getAngleNormalized(circleCenterToNodeVectorX, - circleCenterToNodeVectorY);
        let startAngle = Math.min(angleA, angleB);
        let endAngle = Math.max(angleA, angleB);
        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);
        if(endAngle-startAngle > Math.PI){
            [endAngle, startAngle] = [startAngle, endAngle];
        }
        
        this.drawArc(circleCenterX, circleCenterY, radius, startAngle, endAngle, color, width);
        
        edgeVectorNormalVectorX *= -1;
        edgeVectorNormalVectorY *= -1;
        
        this.drawTriangleTo(circleCenterX + edgeVectorNormalVectorX * radius, circleCenterY + edgeVectorNormalVectorY *  radius, edgeVectorNormalizedX, edgeVectorNormalizedY, color);
        if(this._graph.isWeighted){
            this.drawWeightToArcMiddle(circleCenterX, circleCenterY, radius, edgeCenterX - circleCenterX, edgeCenterY - circleCenterY, weight!, color);
        }
    }
    private getAngleNormalized(vectorX:number, vectorY:number):number{
        if(vectorX === 0){
            return vectorY < 0 ? Math.PI / 2 : Math.PI * 3 / 2;
        }
        if(vectorY === 0){
            return vectorX < 0 ? Math.PI: 0;
        }
        if(vectorX > 0){
            const angle = Math.atan(Math.abs(vectorY / vectorX));
            return vectorY < 0 ? angle: Math.PI * 2 - angle;
        }
        
        const angle = Math.atan(Math.abs(vectorY / vectorX));
        return vectorY < 0 ? Math.PI - angle: Math.PI + angle;
    }
    private drawTriangleTo(x:number, y:number, directionVectorX:number, directionVectorY:number, color: string):void{
        const lengthOfVector = Math.sqrt(directionVectorX ** 2 + directionVectorY ** 2);
        directionVectorX = directionVectorX / lengthOfVector;
        directionVectorY = directionVectorY / lengthOfVector;
        
        const normalVectorX = directionVectorY;
        const normalVectorY = directionVectorX * -1;
        
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
            if((this._edgesBidirectional || !hasAPair) && this.checkIfOnLine(x, y, fromX, fromY, toX, toY, edge.width)){
                return edge.id;
            }
        }
        return -1;
    }
    private checkIfOnArc(x: number, y: number, fromX: number, fromY: number, toX: number, toY: number, arcWidth: number):boolean{
        const threshold = (arcWidth / 2) * this._scale + this._scale;
        
        const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
        
        const edgeVectorNormalizedX = (toX - fromX) / lengthOfEdge;
        const edgeVectorNormalizedY = (toY - fromY) / lengthOfEdge;

        const edgeVectorNormalVectorX = edgeVectorNormalizedY * -1;
        const edgeVectorNormalVectorY = edgeVectorNormalizedX;

        const circleCenterX = (fromX + toX) / 2 + edgeVectorNormalVectorX * lengthOfEdge;
        const circleCenterY = (fromY + toY) / 2 + edgeVectorNormalVectorY * lengthOfEdge;

        const circleCenterMouseVectorX = x - circleCenterX;
        const circleCenterMouseVectorY = y - circleCenterY;

        const mouseAngle = this.getAngleNormalized(circleCenterMouseVectorX, circleCenterMouseVectorY * -1);
        
        const angleA = this.getAngleNormalized(fromX - circleCenterX, (fromY - circleCenterY) * -1);
        const angleB = this.getAngleNormalized(toX - circleCenterX, (toY - circleCenterY) * -1);
        const startAngle = Math.min(angleA, angleB);
        const endAngle = Math.max(angleA, angleB);
        let betweenAngles = startAngle < mouseAngle && mouseAngle < endAngle;
        if(endAngle - startAngle > Math.PI){
            betweenAngles = !betweenAngles;
        }
        
        const lengthOfVector = Math.sqrt(circleCenterMouseVectorX ** 2 + circleCenterMouseVectorY ** 2);
        
        const circleCenterMouseVectorNormalizedX = circleCenterMouseVectorX / lengthOfVector;
        const circleCenterMouseVectorNormalizedY = circleCenterMouseVectorY / lengthOfVector;
        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);

        const referencePointX = circleCenterX + circleCenterMouseVectorNormalizedX * radius;
        const referencePointY = circleCenterY + circleCenterMouseVectorNormalizedY * radius;

        return this.measureDistance(referencePointX, referencePointY, x, y) < threshold && betweenAngles;       
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
        const length = Math.sqrt(directionVectorX ** 2 + directionVectorY ** 2);
        
        directionVectorX = directionVectorX / length;
        directionVectorY = directionVectorY / length;
        
        const x = circleCenterX + directionVectorX * (radius + 15 * this._scale);
        const y = circleCenterY + directionVectorY * (radius + 15 * this._scale);
        
        this.drawText(x, y, `${weight}`, "arial", color ?? "black");
    }
    private drawWeightToHalfLine( x1: number, y1: number, x2: number, y2: number, weight: number, color?: string ): void {
        const halfLineX = (x1 + x2) / 2;
        const halfLineY = (y1 + y2) / 2;
        
        let lineVectorX = x1 - x2;
        let lineVectorY = y1 - y2;
        
        const length = this.measureDistance(x1, y1, x2, y2);
        
        lineVectorX = lineVectorX / length;
        lineVectorY = lineVectorY / length;
        
        let normalVectorX = -lineVectorY;
        let normalVectorY = lineVectorX;
        
        if (normalVectorY > 0) {
            normalVectorX *= -1;
            normalVectorY *= -1;
        }
        
        const x = halfLineX + (normalVectorX * 15 * this._scale);
        const y = halfLineY + (normalVectorY * 15 * this._scale);
        
        this.drawText(x, y, `${weight}`, "arial", color ?? "black");
    }
    private updateEuclideanDistancesOfDraggedNode(): void {
        for (const edge of this._graph.getEdgesConnectedToNode( this._draggedNodeId! )) {

            const fromNode = this._graph.getNode(edge.from)!;
            const toNode = this._graph.getNode(edge.to)!;
            
            edge.weight = this.calculateEuclidieanWeight(fromNode.x, fromNode.y, toNode.x, toNode.y);
        }
    }
    private measureGraphRectangle(): { topLeftX: number; topLeftY: number; width: number; height: number; } {
        let minX = Infinity;
        let maxX = Infinity * -1;
        
        let minY = Infinity;
        let maxY = Infinity * -1;
        
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
        if (!this._nodeDragging) {
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
        } 
        const draggedNode = this._graph.getNode(this._draggedNodeId!)!;
        
        draggedNode.x = canvasMouseX + this._mouseNodeCenterVectorX;
        draggedNode.y = canvasMouseY + this._mouseNodeCenterVectorY;
        
        if (this._euclideanWeights){
            this.updateEuclideanDistancesOfDraggedNode();
        }
        this.drawCanvas();
        return;
    };
    private mouseUpEventHandler = (e: MouseEvent): void => {
        if (this._mode === "disabled") return;
        
        const canvasMouseX = this.screenToCanvasX(e.x);
        const canvasMouseY = this.screenToCanvasY(e.y);
        
        if (!this._dragging && e.target == canvas && !this._isPanning) {
            const hitNodeIndex = this.hitNode(canvasMouseX, canvasMouseY);
            const hitEdgeId = this.hitEdge(canvasMouseX, canvasMouseY);
            
            if (this._mode === "addNodeMode") {
                const id = this._graph.addNode();
                const node = this._graph.getNode(id)!
                
                node.x = canvasMouseX;
                node.y = canvasMouseY;
                
                this._nodeIds.push(id);
            } else if (this._mode === "delete") {
                if (hitNodeIndex !== -1) {
                    this._graph.removeNode(this._nodeIds[hitNodeIndex]);
                    this._nodeIds.splice(hitNodeIndex, 1);
                
                } else if (hitEdgeId !== -1) {
                    this._graph.removeEdge(hitEdgeId);
                }
            } else if (this._mode === "idle") {
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
                        
                        const euclideanWeight = this.calculateEuclidieanWeight(firstNode.x, firstNode.y, node.x, node.y);                
                        let normalWeight = Math.floor(Math.random() * 5) + 1;
                        normalWeight *= (this._negativeEdges && Math.random() > 0.8) ? -1 : 1;
                        
                        const weight = this._euclideanWeights ?  euclideanWeight: normalWeight;
                        this._graph.addEdge( this._firstNodeId, node.id,this._edgesBidirectional,this._edgeWidth, weight );
                    } else {
                        this._graph.addEdge( this._firstNodeId, node.id, this._edgesBidirectional, this._edgeWidth );
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
    private calculateEuclidieanWeight(x1: number, y1: number, x2: number, y2: number): number {
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
