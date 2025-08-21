import { algorithmInfoBox, pauseButton, playButton } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible } from "../dom/helpers";
import { algorithmInfoBoxState, animationState} from "./types";
import { Network } from "../network/network";

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
export class Animation {
    private interval: number | null = null;
    private animationSpeed = 1000; //in ms
    private animationSpeedChange = 1000; //in case the user wants to change the speed of the animation
    private currentAnimationStateNumber = 0; //in the animation function it first increments so it does not point to a negative index of the states
    private pathColor = "#17c53cff";
    private normalNodeColor = "white";
    private normalEdgeColor = "black";
    private queueNodeColor = "#2e77ffff";
    private selectedEdgeColor = "blue";
    private visitedNodeColor = "orange";
    private animationPhase: animationPhase = "running";
    private states: animationState[] | null = null;
    private stateRenderings: stateRendering[]|null = null;
    private network: Network;

    constructor(network: Network) {
        this.network = network;
    }
    setAnimationSpeedChange(speed: number): void {
        this.animationSpeedChange = speed;
    }
    setAnimationStates(states: animationState[]): void {
        this.states = states;
        this.stateRenderings = this.createStateRenderingsFromStates(this.states);
        this.currentAnimationStateNumber = -1;
    }
    escapeAnimation():void{
        this.pause();
        this.resetGraph();
        this.clearInfoBox();
        this.currentAnimationStateNumber = -1;
    }
    setAnimationStateForward(): void {
        if (this.animationPhase !== "paused") return;
        this.moveAnimationStateForward();
    }
    setAnimationStateBackward(): void {
        if (this.animationPhase !== "paused") return;
        if (this.currentAnimationStateNumber <= 0) return;
        this.currentAnimationStateNumber--;
    }
    setAnimationPhase(state: animationPhase): void {
        this.animationPhase = state;
        changeMessageBox(this.animationPhase);
    }
    continueAnimation(): void {
        if (this.states) {
            this.setAnimationPhase("running");
            this.interval = setInterval(() => {
                //if animation speed has been altered by the user
                if (this.animationSpeed !== this.animationSpeedChange) {
                    this.animationSpeed = this.animationSpeedChange;
                    clearInterval(this.interval!);
                    this.continueAnimation();
                } else {
                    this.moveAnimationStateForward();
                    this.animateCurrentState();
                    //if animation finished running
                    if (this.isLastState()) {
                        clearInterval(this.interval!);
                        this.setAnimationPhase("paused");
                        makeInvisible(pauseButton);
                        makeVisible(playButton);
                        return;
                    }
                }
            }, this.animationSpeed);
        }
    }
    pause(): void {
        this.setAnimationPhase("paused");
        clearInterval(this.interval!);
    }
    start(): void {
        this.setAnimationPhase("running");
        this.continueAnimation();
    }
    resetAnimation(): void {
        this.pause();
        this.currentAnimationStateNumber = 0;
        this.animateCurrentState();
    }
    animateCurrentState(): void {
        if (this.currentAnimationStateNumber === -1) return;
        const currentState = this.states![this.currentAnimationStateNumber];
        const currentStateRendering = this.stateRenderings![this.currentAnimationStateNumber];
        this.network.updateNodes(currentStateRendering.nodeUpdates);
        this.network.updateEdges(currentStateRendering.edgeUpdates);
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
        for(const node of state.nodes){
            if(!node)continue;
            let color: string;
            switch (node.state) {
                case "visitedNode": 
                    color = this.visitedNodeColor; 
                    break;
                case "normal": 
                    color = this.normalNodeColor; 
                    break;
                case "partOfPath": 
                    color = this.pathColor;
                    break;
                case "inQueue":
                    color = this.queueNodeColor;
                    break;
                default: 
                    color = this.normalNodeColor;
                    break;
                }
            nodeUpdates.push({
                id: node.id,
                label: node.label,
                color: color,
            });
        }
        const edgeUpdates:edgeUpdate[] = [];
        for(const edge of state.edges){
            if(!edge)continue;
            let color: string;
            let edgeWidth: number = 2;
            switch (edge.state) {
                case "selectedEdge": 
                color = this.selectedEdgeColor; 
                edgeWidth = 3;
                break;
                case "normal": 
                color = this.normalEdgeColor; 
                break;
                case "partOfPath": 
                color = this.pathColor; 
                edgeWidth = 3;
                break;
                default: 
                color = this.normalEdgeColor;
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
                labels.id = "ds-labels";
                labels.innerHTML = `<span>Front</span><span>Back</span>`;
                algorithmInfoBox.appendChild(labels);
            }
            if (type === "stack") {
                const label = document.createElement("div");
                label.id = "ds-labels";
                label.innerHTML = `<span>Top</span>`;
                algorithmInfoBox.appendChild(label);
            }
        }
    }
    private moveAnimationStateForward(): void {
        if (this.isLastState())return;
        this.currentAnimationStateNumber++;
    }
    private clearInfoBox(): void {
        algorithmInfoBox.innerHTML = "";
    }
    private isLastState():boolean{
        return this.currentAnimationStateNumber === this.states!.length - 1;
    }
    private resetGraph(): void {
        this.network.resetGraphToOriginal();
    }
}
