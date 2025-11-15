import { algorithmInfoBox, pauseButton, playButton } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible } from "../dom/helpers";
import { algorithmInfoBoxState, animationState} from "../types/animation";
import Network from "../Network/Network";

type animationPhase = "running" | "paused";
type nodeUpdate = {
    id: number;
    label: string;
    color: string;
}
type edgeUpdate = {
    id: number;
    color: string;
    width: number;
}
type stateRendering = {
    edgeUpdates: edgeUpdate[];
    nodeUpdates: nodeUpdate[];
}
export default class Animation {
    private readonly _network: Network;
    private readonly _pathColor = "#c00000ff";
    private readonly _normalNodeColor = "white";
    private readonly _normalEdgeColor = "black";
    private readonly _queueNodeColor = "#2e77ffff";
    private readonly _stackNodeColor = "#2e77ffff";
    private readonly _deselectedEdgeColor = "#e4e4e4ff";
    private readonly _deselectedNodeColor = "#e4e4e4ff";
    private readonly _selectedEdgeColor = "blue";
    private readonly _visitedNodeColor = "orange";
    private _interval?: number;
    private _animationSpeed = 1000; 
    private _animationSpeedChange = 1000; 
    private _currentAnimationStateNumber = 0; 
    private _animationPhase: animationPhase = "running";
    private _states?: animationState[];
    private _stateRenderings?: stateRendering[];

    constructor(network: Network) {
        this._network = network;
    }
    setAnimationSpeedChange(speed: number): void {
        this._animationSpeedChange = speed;
    }
    setAnimationStates(states: animationState[]): void {
        this._states = states;
        this._stateRenderings = this.createStateRenderingsFromStates(this._states);
        this._currentAnimationStateNumber = -1;
    }
    escapeAnimation():void{
        this.pause();
        this.resetGraph();
        this.clearInfoBox();
        this._currentAnimationStateNumber = -1;
    }
    setAnimationStateForward(): void {
        if (this._animationPhase !== "paused") return;
        this.moveAnimationStateForward();
    }
    setAnimationStateBackward(): void {
        if (this._animationPhase !== "paused") return;
        if (this._currentAnimationStateNumber <= 0) return;
        this._currentAnimationStateNumber--;
    }
    setAnimationPhase(state: animationPhase): void {
        this._animationPhase = state;
        changeMessageBox(this._animationPhase);
    }
    continueAnimation(): void {
        if (this._states) {
            this.setAnimationPhase("running");
            this._interval = setInterval(() => {

                if (this._animationSpeed !== this._animationSpeedChange) {
                    this._animationSpeed = this._animationSpeedChange;
                    clearInterval(this._interval!);
                    this.continueAnimation();
                } else {
                    this.moveAnimationStateForward();
                    this.animateCurrentState();
                    if (this.isLastState()) {
                        clearInterval(this._interval!);
                        this.setAnimationPhase("paused");
                        makeInvisible(pauseButton);
                        makeVisible(playButton);
                        return;
                    }
                }
            }, this._animationSpeed);
        }
    }
    pause(): void {
        this.setAnimationPhase("paused");
        clearInterval(this._interval!);
    }
    start(): void {
        this.setAnimationPhase("running");
        this.continueAnimation();
    }
    resetAnimation(): void {
        this.pause();
        this._currentAnimationStateNumber = 0;
        this.animateCurrentState();
    }
    animateCurrentState(): void {
        if (this._currentAnimationStateNumber === -1) return;
        
        const currentState = this._states![this._currentAnimationStateNumber];
        const currentStateRendering = this._stateRenderings![this._currentAnimationStateNumber];
        
        this._network.updateNodes(currentStateRendering.nodeUpdates);
        this._network.updateEdges(currentStateRendering.edgeUpdates);
        
        this.renderInfoBox(currentState.algorithmInfobox);
    }
    private createStateRenderingsFromStates(states:animationState[]):stateRendering[]{
        const stateRenderings: stateRendering[] = [];
        for(const state of states){
            stateRenderings.push(this.createStateRenderingFromState(state));
        }
        return stateRenderings;
    }
    private createStateRenderingFromState(state: animationState):stateRendering{
        const nodeUpdates:nodeUpdate[] = [];
        for(const node of state.nodes.values()){
            let color: string;
            switch (node.state) {
                case "visitedNode": 
                    color = this._visitedNodeColor; 
                    break;
                case "normal": 
                    color = this._normalNodeColor; 
                    break;
                case "partOfPath": 
                    color = this._pathColor;
                    break;
                case "inQueue":
                    color = this._queueNodeColor;
                    break;
                case "inStack":
                    color = this._stackNodeColor;
                    break;
                case "deselectedNode":
                    color = this._deselectedNodeColor;
                    break;
                default: 
                    color = this._normalNodeColor;
                    break;
                }
            nodeUpdates.push({
                id: node.id,
                label: node.label,
                color: color,
            });
        }
        
        const edgeUpdates:edgeUpdate[] = [];
        for(const edge of state.edges.values()){
            let color: string;
            let edgeWidth: number = 2;
            switch (edge.state) {
                case "selectedEdge": 
                    color = this._selectedEdgeColor; 
                    edgeWidth = 3;
                    break;
                case "normal": 
                    color = this._normalEdgeColor; 
                    break;
                case "partOfPath": 
                    color = this._pathColor; 
                    edgeWidth = 4;
                    break;
                case "deselectedEdge": 
                    color = this._deselectedEdgeColor;
                    break;
                default: 
                    color = this._normalEdgeColor;
                    break;
            }
            edgeUpdates.push({
                id: edge.id,
                color,
                width: edgeWidth,
            });
        }
        return {edgeUpdates, nodeUpdates};
    }
    private renderInfoBox(input?: algorithmInfoBoxState): void {
        if (!input) {
            return;
        }
        algorithmInfoBox.innerHTML = "";
        if (input.information) {
            const info = document.createElement("div");
            info.id = "info-text";
            info.innerHTML = input.information;
            
            algorithmInfoBox.appendChild(info);
        }
        if (input.dataStructure) {
            const { type, ds } = input.dataStructure;
            
            const container = document.createElement("div");
            const dsName = document.createElement("h3");
            
            dsName.textContent = type;
            dsName.className = "ds-name";
            
            container.id = "ds-container";
            container.className = type;
            
            algorithmInfoBox.appendChild(dsName);
            
            for (let i = 0; i < ds.length; i++) {
                if (ds[i]) {
                    const el = document.createElement("div");
                    el.className = "ds-box";
                    el.textContent = ds[i];
                    container.appendChild(el);
                }
            }
            algorithmInfoBox.appendChild(container);
            if (type === "queue" || type === "priority-queue") {
                const labels = document.createElement("div");
                labels.id = "queue-label";
                labels.innerHTML = `<span>Front</span><span>Back</span>`;
                
                algorithmInfoBox.appendChild(labels);
            }
            if (type === "stack") {
                const label = document.createElement("div");
                label.id = "stack-label";
                label.innerHTML = `<span>Bottom</span>`;
                
                algorithmInfoBox.appendChild(label);
            }
        }
    }
    private moveAnimationStateForward(): void {
        if (this.isLastState())return;
        this._currentAnimationStateNumber++;
    }
    private clearInfoBox(): void {
        algorithmInfoBox.innerHTML = "";
    }
    private isLastState():boolean{
        return this._currentAnimationStateNumber === this._states!.length - 1;
    }
    private resetGraph(): void {
        this._network.resetGraphToOriginal();
    }
}
