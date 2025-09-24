import { Graph, WeightedGraph, Node, Edge } from "../datastructures/Graph";
import { algorithmInformationBox, canvas, editingPanel } from "../dom/elements";
import { saveAs } from "file-saver"
import { Preset, presetEdge, presetNode } from "../types/preset";


type networkMode = "addEdgeMode" | "addNodeMode" | "idle" | "delete" | "disabled";
export class Network{
    private ctx:CanvasRenderingContext2D = canvas.getContext("2d")!;
    private isDown = false;
    private dragging = false;
    private isPanning = false;
    private offsetX = 0;
    private offsetY = 0;
    private scale = 1;
    private scaleFactor = 0.05;
    private mousePositionX = 0;
    private mousePositionY = 0;
    private nodeSize = 30;
    private nodeContourWidth = 4;
    private nodeIds:number[] = [];
    private mouseNodecenterVectorX = 0;
    private mouseNodecenterVectorY = 0;
    private nodeDragging = false;
    private draggedNode:Node|null = null;
    private dpr:number = 1;
    private euclideanWeights = false;
    private pendingEdge = false;
    private firstNode:Node|null = null;
    private canvasWidth = 0;
    private canvasHeight = 0;
    private selectNodeCallback: ((nodeId:number) => void) | null = null;
    private selectEdgeCallback: ((edgeId:number) => void) | null = null;
    private canvasBlankClick: (() => void) | null = null;
    private mode: networkMode = "idle";
    private graph: Graph;
    private edgesTwoWay:boolean;
    private negativeEdges: boolean;

    constructor(graph: Graph,edgesTwoWay: boolean = false, euclideanWeights: boolean = false, negativeEdges: boolean = false) {
        this.graph = graph;
        this.euclideanWeights = euclideanWeights;
        this.edgesTwoWay = edgesTwoWay;
        this.negativeEdges = negativeEdges;
        canvas.addEventListener("mousedown", this.mouseDownEventHandler);
        canvas.addEventListener("wheel", this.wheelEventHandler);
        window.addEventListener("mousemove", this.mouseMoveEventHandler);
        window.addEventListener("mouseup", this.mouseUpEventHandler);
        window.addEventListener("load", this.resizeHandler);
        window.addEventListener("resize", this.resizeHandler)
    }
    saveGraphToJSON():void{
        const jsonOjbect:Preset = {info: {
            weighted: this.graph instanceof WeightedGraph,
            edgesTwoWay: this.edgesTwoWay,
            scale: this.scale
        }, nodes: [], edges: []};
        const nodes = this.graph.getNodeList();
        for(let nodeId = 0; nodeId < nodes.length; nodeId++){
            const node = nodes[nodeId];
            if(node !== null){
                const nodeObj: presetNode = {
                    id: node.getId(),
                    x: node.x!,
                    y: node.y!,
                    color: node.color,
                }
                jsonOjbect.nodes.push(nodeObj);
            }
        }
        const edges = this.graph.getEdgeList();
        for(let edgeId = 0; edgeId < edges.length; edgeId++){
            const edge = edges[edgeId];
            if(edge !== null){
                const edgeOjb:presetEdge = {
                    from: edge.getFrom(),
                    to: edge.getTo(),
                }
                if(this.graph instanceof WeightedGraph){
                    edgeOjb.weight = edge.getWeight()!
                }
                jsonOjbect.edges.push(edgeOjb);
            }
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
        this.mode = "delete";
    }
    addNodeModeOn(): void {
        this.resetToIdle();
        this.mode = "addNodeMode";
    }
    disableEverything(): void {
        this.resetToIdle();
        this.mode = "disabled";
    }
    addEdgeModeOn(): void {
        this.resetToIdle();
        this.mode = "addEdgeMode";
    }
    resetToIdle(): void {
        this.mode = "idle";
        this.firstNode = null;
        this.drawCanvas();
    }
    onSelectNode(callback: (nodeId: number) => void): void {
        this.selectNodeCallback = callback;
    }
    onSelectEdge(callback: (edgeId: number) => void): void {
        this.selectEdgeCallback = callback;
    }
    onCanvasBlankClick(callback: () => void): void {
        this.canvasBlankClick = callback;
    }
    areConnected(aNodeId: number, bNodeId: number): boolean {
        return this.graph.areConnected(aNodeId, bNodeId);
    }
    getLabelOfNode(nodeId: number): string {
        return this.graph.getLabelOfNode(nodeId);
    }
    getEdgeWeight(edgeId: number): number {
        if (this.graph instanceof WeightedGraph)return this.graph.getEdgeWeight(edgeId);
        return 0;
    }
    fitGraphIntoAnimationSpace():void{
        const algorithmInfoBoxOffsetX = algorithmInformationBox!.clientWidth === 0? 50: algorithmInformationBox!.clientWidth;
        let {topLeftX, topLeftY, width, height} = this.measureGraphRectangle();
        const animationSpaceWidth = this.canvasWidth-algorithmInfoBoxOffsetX-70;
        const animationSpaceHeight = this.canvasHeight-100;
        if(width/animationSpaceWidth > 1){
            let newScale = animationSpaceWidth/width;
            topLeftX *= newScale
            topLeftY *= newScale
            height *= newScale
            width *=newScale
            if(height/animationSpaceHeight > 1){
                newScale *= animationSpaceHeight/height
                topLeftX *= animationSpaceHeight/height
                topLeftY *= animationSpaceHeight/height
                width *= animationSpaceHeight/height
                height *= animationSpaceHeight/height
            }
            this.setCanvasScale(this.scale*newScale);
        }else if(height/animationSpaceHeight > 1){
            this.setCanvasScale(this.scale*(animationSpaceHeight/height))
            topLeftX *= animationSpaceHeight/height
            topLeftY *= animationSpaceHeight/height
            width *=animationSpaceHeight/height
            height *= animationSpaceHeight/height
        }
        
        const fittedTopX = algorithmInfoBoxOffsetX+50;
        const fittedTopY = (this.canvasHeight-height)/2;
        this.offsetX = fittedTopX-topLeftX;
        this.offsetY = fittedTopY-topLeftY;
        this.drawCanvas();
    }
    updateEdge(edge :{id: number, color?: string, weight?: number, width?: number}):void{
        const edgeToModified = this.graph.getEdge(edge.id)!;
        if(edge.color){
            edgeToModified.color = edge.color;
        }
        if(edge.weight){
            edgeToModified.setWeight(edge.weight);
        }
        if(edge.width){
            edgeToModified.width = edge.width;
        }
        this.drawCanvas();
    }
    updateEdges(edges: {id: number, color?: string, weight?: number, width?: number}[]): void {
        edges.forEach(edge => {
            const edgeToModify = this.graph.getEdge(edge.id)!;
            if (!edgeToModify) return;
            if (edge.color !== undefined) {
                edgeToModify.color = edge.color;
            }
            if (edge.weight !== undefined) {
                edgeToModify.setWeight(edge.weight);
            }
            if(edge.width){
                edgeToModify.width = edge.width;
            }
        });
        this.drawCanvas();
    }
    updateNodes(nodes: { id: number; color?: string; label?: string }[]): void {
        nodes.forEach(node => {
            const nodeToModify = this.graph.getNode(node.id)!;
            if (!nodeToModify) return;

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
        const nodeToModify = this.graph.getNode(node.id)!;
        if (!nodeToModify) return;

        if (node.color !== undefined) {
            nodeToModify.color = node.color;
        }
        if (node.label !== undefined) {
            nodeToModify.label = node.label;
        }
        this.drawCanvas();
    }
    resetGraphToOriginal(): void {
        this.graph.resetGraphToOriginalVisual();
    }
    loadPreset(preset: Preset): void {
        this.scale = preset.info.scale;
        this.nodeSize = 30*this.scale;
        this.graph.clearGraph();
        this.nodeIds = [];
        for (const node of preset.nodes) {
            this.graph.addExistingNode(node.id, node.x, node.y, node.color);
            this.nodeIds.push(node.id);
        }
        for (const edge of preset.edges) {
            if (this.graph instanceof WeightedGraph) {
                this.graph.addEdge(edge.from, edge.to,this.edgesTwoWay, edge.weight);
            } else {
                this.graph.addEdge(edge.from, edge.to, this.edgesTwoWay);
            }
        }
        this.fitGraphIntoAnimationSpace();
    }
    getNumberOfNodes():number{
        return this.graph.getNumberOfNodes();
    }
    private canvasScaleDown(): void {
        if (this.scale < 0.5) return;
        this.scale *= 1 - this.scaleFactor;
        for (const nodeId of this.nodeIds) {
            const node = this.graph.getNode(nodeId)!;
            node.x! = node.x! * (1 - this.scaleFactor);
            node.y! = node.y! * (1 - this.scaleFactor);
        }
        this.nodeSize *= 1 - this.scaleFactor;
    }
    private setCanvasScale(newScale: number): void {
        for (const nodeId of this.nodeIds) {
            const node = this.graph.getNode(nodeId)!;
            node.x! = (node.x! * newScale) / this.scale;
            node.y! = (node.y! * newScale) / this.scale;
        }
        this.nodeSize = (this.nodeSize * newScale) / this.scale;
        this.scale = newScale;
    }
    private canvasScaleUp(): void {
        this.scale *= 1 + this.scaleFactor;
        for (const nodeId of this.nodeIds) {
            const node = this.graph.getNode(nodeId)!;
            node.x! = node.x! * (1 + this.scaleFactor);
            node.y! = node.y! * (1 + this.scaleFactor);
        }
        this.nodeSize *= 1 + this.scaleFactor;
    }
    private hitNode( x: number, y: number ): { node: Node | null; index: number } {
        for (let j = this.nodeIds.length - 1; j >= 0; j--) {
            let node: Node = this.graph.getNode(this.nodeIds[j])!;
            if ((node.x! - x) ** 2 + (node.y! - y) ** 2 < (this.nodeSize+(this.nodeContourWidth*this.scale/2)) ** 2) {
                return { node, index: j };
            }
        }
        return { node: null, index: 0 };
    }
    private measureDistance( x1: number, y1: number, x2: number, y2: number ): number {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }
    private drawCanvas = (): void => {
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.drawEdges();
        this.drawNodes();
        if (this.pendingEdge) {
            this.drawPendingEdge();
            this.drawNode(this.firstNode!);
        }
    };
    private drawPendingEdge(): void {
        const x1 = this.firstNode!.x!;
        const y1 = this.firstNode!.y!;
        const x2 = this.screenToCanvasX(this.mousePositionX);
        const y2 = this.screenToCanvasY(this.mousePositionY);
        const length = this.measureDistance(x1, y1, x2, y2);
        const normalizedMouseNodeVectorX = (x2 - x1) / length;
        const normalizedMouseNodeVectorY = (y2 - y1) / length;
        const startingX = x1 + normalizedMouseNodeVectorX * this.nodeSize + normalizedMouseNodeVectorX * 2;
        const startingY = y1 + normalizedMouseNodeVectorY * this.nodeSize + normalizedMouseNodeVectorY * 2;
        this.drawLine(startingX, startingY, x2, y2, 2, "black");
        if(!this.edgesTwoWay){
            this.drawTriangleTo(x2+normalizedMouseNodeVectorX*2, y2+normalizedMouseNodeVectorY*2, normalizedMouseNodeVectorX, normalizedMouseNodeVectorY, "black", false);
            return;
        }
        this.drawArc(x2, y2, 3, 0, Math.PI*2, "black", 2, "red")
    }
    private drawEdges(): void {
        for (const edge of this.graph.getEdgeList()) {
            if (edge) {
                this.drawEdge(edge);
            }
        }
    }
    private drawNodes(): void {
        for (const id of this.nodeIds) {
            if(id !== this.firstNode?.getId()){
                this.drawNode(this.graph.getNode(id)!);
            }
        }
    }
    private screenToCanvasX(screenX: number): number {
        return screenX - this.offsetX;
    }
    private screenToCanvasY(screenY: number): number {
        return screenY - this.offsetY;
    }
    private canvasToScreenX(canvasX: number): number {
        return canvasX + this.offsetX;
    }
    private canvasToScreenY(canvasY: number): number {
        return canvasY + this.offsetY;
    }
    private drawLine(fromX: number, fromY: number, toX: number, toY: number, lineWidth: number, color: string):void{
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth*this.scale;
        this.ctx.strokeStyle = color;
        this.ctx.moveTo(this.offsetX + fromX, this.offsetY + fromY);
        this.ctx.lineTo(this.offsetX + toX, this.offsetY + toY);
        this.ctx.stroke();
        this.ctx.closePath();
    }
    private drawArc(x:number, y:number, radius: number, startingAngle: number, endAngle: number, contour: string, lineWidth: number,color?: string):void{
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth*this.scale;
        this.ctx.strokeStyle = contour;
        this.ctx.arc(this.offsetX + x, this.offsetY + y, radius, startingAngle, endAngle);
        this.ctx.stroke();
        if(color){
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        this.ctx.closePath();
    }
    private drawText(x: number, y: number,text: string, fontSize: number, fontFamily: string, fontColor: string):void{
        this.ctx.font = `${fontSize * this.scale}px ${fontFamily}`;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
        this.ctx.fillStyle = fontColor;
        this.ctx.fillText(text, this.offsetX+x, this.offsetY+y);
    }
    private drawNode(node: Node): void {
        this.drawArc(node.x!, node.y!, this.nodeSize, 0, Math.PI*2,"black",this.nodeContourWidth, node.color ? node.color : "white")
        this.drawText(node.x!, node.y!, `${node.label}`, 17, "arial", "black");
    }
    private drawEdge(edge: Edge): void {
        const fromNode = this.graph.getNode(edge.getFrom())!;
        const toNode = this.graph.getNode(edge.getTo())!;
        const fromX = fromNode.x!;
        const fromY = fromNode.y!;
        const toX = toNode.x!;
        const toY = toNode.y!;
        if(!this.edgesTwoWay){
            if(this.graph.edgeHasAPair(edge)){
                this.drawCurvedEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.getWeight());
            }else{
                this.drawStraightEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.getWeight())
                const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
                let edgeVectorNormalizedX = (toX-fromX)/lengthOfEdge;
                let edgeVectorNormalizedY = (toY-fromY)/lengthOfEdge;
                edgeVectorNormalizedX *=(lengthOfEdge-this.nodeSize-(this.nodeContourWidth*this.scale)/2)
                edgeVectorNormalizedY *=(lengthOfEdge-this.nodeSize-(this.nodeContourWidth*this.scale)/2)
                this.drawTriangleTo(fromX+edgeVectorNormalizedX, fromY+edgeVectorNormalizedY, edgeVectorNormalizedX, edgeVectorNormalizedY, edge.color, true);
            }
        }else{
            this.drawStraightEdge(fromX, fromY, toX, toY, edge.width, edge.color, edge.getWeight())
        }
    }
    private drawStraightEdge(fromX:number, fromY:number, toX:number, toY:number, width: number, color: string, weight?: number):void{
        this.drawLine(fromX, fromY, toX, toY, width, color);
        if (this.graph instanceof WeightedGraph) {
            this.drawWeightToHalfLine(fromX,fromY,toX,toY, weight!, color);
        }
    }
    private drawCurvedEdge(fromX:number, fromY:number, toX:number, toY:number, width: number, color: string, weight?: number):void{
        const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
        let edgeVectorNormalizedX = (toX-fromX)/lengthOfEdge;
        let edgeVectorNormalizedY = (toY-fromY)/lengthOfEdge;
        let edgeVectorNormalVX = -edgeVectorNormalizedY;
        let edgeVectorNormalVY = edgeVectorNormalizedX;
        const edgeCenterX = (fromX+toX)/2;
        const edgeCenterY = (fromY+toY)/2;

        const circleCenterX = edgeCenterX + edgeVectorNormalVX*lengthOfEdge;
        const circleCenterY = edgeCenterY + edgeVectorNormalVY*lengthOfEdge;

        const circleCenterToNodeVectorX = toX-circleCenterX;
        const circleCenterToNodeVectorY = toY-circleCenterY;
        const circleCenterFromNodeVectorX = fromX-circleCenterX;
        const circleCenterFromNodeVectorY = fromY-circleCenterY;

        const angleA = this.getAngleNormalized(circleCenterFromNodeVectorX, -circleCenterFromNodeVectorY);
        const angleB = this.getAngleNormalized(circleCenterToNodeVectorX, -circleCenterToNodeVectorY);
        let startAngle = Math.min(angleA, angleB);
        let endAngle = Math.max(angleA, angleB);
        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);
        if(endAngle-startAngle > Math.PI){
            const temp = endAngle;
            endAngle = startAngle;
            startAngle = temp;
        }
        this.drawArc(circleCenterX, circleCenterY, radius, startAngle, endAngle, color, width);
        edgeVectorNormalVX *= -1;
        edgeVectorNormalVY *= -1;
        this.drawTriangleTo(circleCenterX+edgeVectorNormalVX*radius, circleCenterY+edgeVectorNormalVY*radius, edgeVectorNormalizedX, edgeVectorNormalizedY, color, false);
        if(this.graph instanceof WeightedGraph){
            this.drawWeightToArcMiddle(circleCenterX, circleCenterY, radius, edgeCenterX-circleCenterX, edgeCenterY-circleCenterY, weight!, color);
        }
    }
    private getAngleNormalized(vectorX:number, vectorY:number):number{
        if(vectorX === 0){
            return vectorY < 0 ? Math.PI/2 : Math.PI*3/2;
        }
        if(vectorY === 0){
            return vectorX < 0 ? Math.PI: 0;
        }
        if(vectorX > 0){
            const angle = Math.atan(Math.abs(vectorY/vectorX));
            return vectorY < 0 ? angle: Math.PI*2-angle;
        }
        //vectorX < 0
        const angle = Math.atan(Math.abs(vectorY/vectorX));
        return vectorY < 0 ? Math.PI-angle: Math.PI+angle;
    }
    private drawTriangleTo(x:number, y:number, directionVectorX:number, directionVectorY:number, color: string, normalize: boolean):void{
        const lenghthOfV = Math.sqrt(directionVectorX**2 + directionVectorY**2);
        if(normalize){
            directionVectorX = directionVectorX/lenghthOfV;
            directionVectorY = directionVectorY/lenghthOfV;
        }
        const normalVX = directionVectorY;
        const noramlVY = -directionVectorX;
        const triangleHeight = 15*this.scale;
        const halfBaseLength = 8*this.scale;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX+(x-directionVectorX*triangleHeight)+normalVX*halfBaseLength,this.offsetY+(y-directionVectorY*triangleHeight)+noramlVY*halfBaseLength);
        this.ctx.lineTo(this.offsetX+(x-directionVectorX*triangleHeight)-normalVX*halfBaseLength,this.offsetY+(y-directionVectorY*triangleHeight)-noramlVY*halfBaseLength)
        this.ctx.lineTo(this.offsetX+x, this.offsetY+y)
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }
    private hitEdge(x: number, y: number): Edge | null {
        for (const edge of this.graph.getEdgeList()) {
            if (edge) {
                const fromNode = this.graph.getNode(edge.getFrom())!;
                const fromX = fromNode.x!;
                const fromY = fromNode.y!;
                const toNode = this.graph.getNode(edge.getTo())!;
                const toX = toNode.x!;
                const toY = toNode.y!;
                const hasAPair = this.graph.edgeHasAPair(edge)
                if(hasAPair && this.checkIfOnArc(x, y, fromX, fromY, toX, toY, edge.width)){
                    return edge;
                }
                if((this.edgesTwoWay || !hasAPair) && this.checkIfOnLine(x, y, fromX, fromY, toX, toY, edge.width)){
                    return edge;
                }
            }
        }
        return null;
    }
    private checkIfOnArc(x: number, y: number, fromX: number, fromY: number, toX: number, toY: number, arcWidth: number):boolean{
        let threshold = ((arcWidth)/2)*this.scale+this.scale;
        const lengthOfEdge = this.measureDistance(fromX, fromY, toX, toY);
        let edgeVectorNormalizedX = (toX-fromX)/lengthOfEdge;
        let edgeVectorNormalizedY = (toY-fromY)/lengthOfEdge;

        let edgeVectorNormalVX = -edgeVectorNormalizedY;
        let edgeVectorNormalVY = edgeVectorNormalizedX;

        const edgeCenterX = (fromX+toX)/2;
        const edgeCenterY = (fromY+toY)/2;

        const circleCenterX = edgeCenterX + edgeVectorNormalVX*lengthOfEdge;
        const circleCenterY = edgeCenterY + edgeVectorNormalVY*lengthOfEdge;

        const circleCenterMouseVX = x-circleCenterX;
        const circleCenterMouseVY = y-circleCenterY;

        const mouseAngle = this.getAngleNormalized(circleCenterMouseVX, -circleCenterMouseVY);
        const angleA = this.getAngleNormalized(fromX-circleCenterX, -(fromY-circleCenterY));
        const angleB = this.getAngleNormalized(toX-circleCenterX, -(toY-circleCenterY));
        let startAngle = Math.min(angleA, angleB);
        let endAngle = Math.max(angleA, angleB);
        let betweenAngles = mouseAngle > startAngle && mouseAngle < endAngle;
        if(endAngle-startAngle > Math.PI){
            betweenAngles = !betweenAngles;
        }
        const lengthOfVector = Math.sqrt(circleCenterMouseVX**2+circleCenterMouseVY**2);
        const circleCenterMouseVnormalizedX = circleCenterMouseVX/lengthOfVector
        const circleCenterMouseVnormalizedY = circleCenterMouseVY/lengthOfVector
        const radius = this.measureDistance(circleCenterX, circleCenterY, toX, toY);

        const referencePointX = circleCenterX + circleCenterMouseVnormalizedX*radius;
        const referencePointY = circleCenterY + circleCenterMouseVnormalizedY*radius;

        return this.measureDistance(referencePointX, referencePointY, x, y) < threshold && betweenAngles;       
    }
    private checkIfOnLine( x: number, y: number, x1: number, y1: number, x2: number, y2: number, lineWidth: number ): boolean {
        let threshold = ((lineWidth)/2)*this.scale+this.scale;
        const xDiff = x2 - x1;
        const yDiff = y2 - y1;
        const lenSq = xDiff * xDiff + yDiff * yDiff;
        if (lenSq === 0) {
            const distSq = (x - x1) ** 2 + (y - y1) ** 2;
            return distSq <= threshold ** 2;
        }
        let t = ((x - x1) * xDiff + (y - y1) * yDiff) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closestX = x1 + t * xDiff;
        const closestY = y1 + t * yDiff;
        const distSq = (x - closestX) ** 2 + (y - closestY) ** 2;
        return distSq <= threshold ** 2;
    }
    private drawWeightToArcMiddle(circleCenterX: number, circleCenterY: number,radius:number, directionVectorX: number, directionVectorY: number, weight: number, color?: string):void{
        const length = Math.sqrt(directionVectorX**2+directionVectorY**2);
        directionVectorX = directionVectorX/length;
        directionVectorY = directionVectorY/length;
        const x = circleCenterX+directionVectorX*(radius+15*this.scale);
        const y = circleCenterY+directionVectorY*(radius+15*this.scale);
        this.drawText(x, y, `${weight}`, 17, "arial", color? color: "black")
    }
    private drawWeightToHalfLine( x1: number, y1: number, x2: number, y2: number, weight: number, color?: string ): void {
        const halfLineX = (x1 + x2) / 2;
        const halfLineY = (y1 + y2) / 2;
        let lineVectorX = x1 - x2;
        let lineVectorY = y1 - y2;
        let length = this.measureDistance(x1, y1, x2, y2);
        lineVectorX = lineVectorX / length;
        lineVectorY = lineVectorY / length;
        let normalVectorX = -lineVectorY;
        let normalVectorY = lineVectorX;
        if (normalVectorY > 0) {
            normalVectorX *= -1;
            normalVectorY *= -1;
        }
        const x = halfLineX + (normalVectorX * 15*this.scale);
        const y = halfLineY + (normalVectorY * 15*this.scale);
        this.drawText(x, y, `${weight}`, 17, "arial", color? color: "black");
    }
    private updateEuclideanDistancesOfDraggedNode(): void {
        for (const edgeId of this.graph.getEdgeListOfNode( this.draggedNode!.getId() )) {
            const edge = this.graph.getEdge(edgeId)!;
            const fromNode = this.graph.getNode(edge.getFrom())!;
            const toNode = this.graph.getNode(edge.getTo())!;
            edge.setWeight(Math.floor( this.measureDistance( fromNode.x!, fromNode.y!, toNode.x!, toNode.y! ) / 10 ));
        }
    }
    private measureGraphRectangle(): { topLeftX: number; topLeftY: number; width: number; height: number; } {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (const nodeId of this.nodeIds) {
            const node = this.graph.getNode(nodeId)!;
            if (node.x! < minX) {
                minX = node.x!;
            } else if (node.x! > maxX) {
                maxX = node.x!;
            }
            if (node.y! < minY) {
                minY = node.y!;
            } else if (node.y! > maxY) {
                maxY = node.y!;
            }
        }
        return { topLeftX: minX - (this.nodeSize*this.scale)-this.nodeContourWidth*this.scale/2, topLeftY: minY - (this.nodeSize*this.scale) - this.nodeContourWidth*this.scale/2, width: maxX - minX + (this.nodeSize*this.scale) * 2 + this.nodeContourWidth*this.scale, height: maxY - minY + (this.nodeSize*this.scale) * 2 + this.nodeContourWidth*this.scale };
    }
    private wheelEventHandler = (e: WheelEvent): void => {
        e.preventDefault();
        if (this.mode == "disabled") return;
        this.mousePositionX = e.x;
        this.mousePositionY = e.y;
        let canvasMouseX = this.screenToCanvasX(this.mousePositionX);
        let canvasMouseY = this.screenToCanvasY(this.mousePositionY);
        if (0 < e.deltaY) {
            this.canvasScaleDown();
            this.offsetY += this.canvasToScreenY(canvasMouseY * this.scaleFactor) - this.offsetY;
            this.offsetX += this.canvasToScreenX(canvasMouseX * this.scaleFactor) - this.offsetX;
        } else {
            this.canvasScaleUp();
            this.offsetY += this.offsetY - this.canvasToScreenY(canvasMouseY * this.scaleFactor);
            this.offsetX += this.offsetX - this.canvasToScreenX(canvasMouseX * this.scaleFactor);
        }
        this.drawCanvas();
    };
    private mouseDownEventHandler = (e: MouseEvent): void => {
        e.preventDefault();
        if (this.mode === "disabled") return;
        this.mousePositionX = e.x;
        this.mousePositionY = e.y;
        this.isDown = true;
    };
    private mouseMoveEventHandler = (e: MouseEvent): void => {
        if (this.mode === "disabled") return;
        if (!this.isDown) return;
        this.dragging = true;
        const deltaX = this.mousePositionX - e.x;
        const deltaY = this.mousePositionY - e.y;
        const canvasMouseX = this.screenToCanvasX(e.x);
        const canvasMouseY = this.screenToCanvasY(e.y);
        this.mousePositionX = e.x;
        this.mousePositionY = e.y;
        if (!this.nodeDragging) {
            const { node, index } = this.hitNode(canvasMouseX, canvasMouseY);
            if ( this.mode === "addEdgeMode" && !this.firstNode && node && !this.isPanning ) {
                this.firstNode = node;
                this.pendingEdge = true;
                this.drawCanvas();
                return;
            } else if ( this.mode === "addEdgeMode" && this.firstNode && !this.isPanning ) {
                this.drawCanvas();
                return;
            }
            if (node && !this.isPanning) {
                this.draggedNode = node;
                this.mouseNodecenterVectorX = node.x! - canvasMouseX;
                this.mouseNodecenterVectorY = node.y! - canvasMouseY;
                this.nodeDragging = true;
                this.nodeIds.splice(index, 1);
                this.nodeIds.push(node.getId());
            } else {
                this.offsetX -= deltaX;
                this.offsetY -= deltaY;
                this.isPanning = true;
            }
        } else {
            this.draggedNode!.x = canvasMouseX + this.mouseNodecenterVectorX;
            this.draggedNode!.y = canvasMouseY + this.mouseNodecenterVectorY;
            if (this.euclideanWeights)
                this.updateEuclideanDistancesOfDraggedNode();
        }
        this.drawCanvas();
    };
    private mouseUpEventHandler = (e: MouseEvent): void => {
        if (this.mode === "disabled") return;
        const canvasMouseX = this.screenToCanvasX(e.x);
        const canvasMouseY = this.screenToCanvasY(e.y);
        if (!this.dragging && e.target == canvas) {
            const { node, index } = this.hitNode(canvasMouseX, canvasMouseY);
            const edge = this.hitEdge(canvasMouseX, canvasMouseY);
            if (this.mode === "addNodeMode") {
                const id = this.graph.addNode();
                this.graph.setNodeCoordinates(id, canvasMouseX, canvasMouseY);
                this.nodeIds.push(id);
            } else if (this.mode === "delete") {
                if (node) {
                    this.nodeIds.splice(index, 1);
                    this.graph.deleteNode(node.getId());
                } else if (edge) {
                    this.graph.removeEdge(edge.getFrom(), edge.getTo(), this.edgesTwoWay);
                }
            } else if (this.mode === "idle") {
                if (node) {
                    if (this.selectNodeCallback)
                        this.selectNodeCallback(node.getId());
                } else if (edge) {
                    if (this.selectEdgeCallback)
                        this.selectEdgeCallback(edge.getId());
                } else {
                    if (this.canvasBlankClick) this.canvasBlankClick();
                }
            }
        } else if (this.dragging) {
            if (this.mode === "addEdgeMode") {
                const { node } = this.hitNode( canvasMouseX, canvasMouseY );
                if (node && this.firstNode) {
                    if (this.graph instanceof WeightedGraph) {
                        const euclideanWeight = Math.floor( this.measureDistance( this.firstNode!.x!, this.firstNode!.y!, node.x!, node.y! ) / 10 );
                        let normalWeight = Math.floor(Math.random() * 5) + 1;
                        normalWeight *= (this.negativeEdges && Math.random() > 0.8) ? -1 : 1;
                        const weight = this.euclideanWeights ?  euclideanWeight: normalWeight;
                        this.graph.addEdge( this.firstNode!.getId(), node.getId(),this.edgesTwoWay, weight );
                    } else {
                        this.graph.addEdge(
                            this.firstNode!.getId(),
                            node.getId(),
                            this.edgesTwoWay
                        );
                    }
                    this.firstNode = null;
                    this.pendingEdge = false;
                } else {
                    this.firstNode = null;
                    this.pendingEdge = false;
                }
            }
        }
        this.draggedNode = null;
        this.nodeDragging = false;
        this.dragging = false;
        this.isDown = false;
        this.isPanning = false;
        this.drawCanvas();
    };
    private resizeHandler = ():void =>{
        const editingPanelRect = editingPanel!.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const newWidth = windowWidth-editingPanelRect.width;
        this.dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(newWidth * this.dpr);
        canvas.height = Math.round(windowHeight * this.dpr);;
        this.canvasWidth = Math.round(newWidth);
        this.canvasHeight = Math.round(windowHeight);
        canvas.style.width = `${Math.round(newWidth)}px`;
        canvas.style.height = `${Math.round(windowHeight)}px`;
        this.ctx.reset();
        this.ctx.scale(this.dpr, this.dpr);
        this.drawCanvas();
    }
}
