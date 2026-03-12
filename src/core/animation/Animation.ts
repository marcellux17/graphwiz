import { algorithmInfoBox, pauseButton, playButton } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible } from "../dom/helpers";
import { algorithmInfoBoxState, animationState} from "../types/animation";
import Network from "../network/Network";

type animationPhase = "running" | "paused";
export default class Animation {
    private readonly _network: Network;
    
    private _interval?: number;
    private _animationSpeed = 1000; 
    private _animationSpeedChange = 1000; 
    private _currentAnimationStateNumber = 0; 
    private _animationPhase: animationPhase = "running";
    private _states?: animationState[];

    constructor(network: Network) {
        this._network = network;
    }
    setAnimationSpeedChange(speed: number): void {
        this._animationSpeedChange = speed;
    }
    setAnimationStates(states: animationState[]): void {
        this._states = states;
        this._currentAnimationStateNumber = -1;
    }
    escapeAnimation():void{
        this.pause();
        this.clearInfoBox();
        this._states = [];
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
        this._network.graph = currentState.graph;

        this.renderInfoBox(currentState.algorithmInfobox);
    }
    private renderInfoBox(infoBoxState?: algorithmInfoBoxState): void {
        if (!infoBoxState)return;
        
        algorithmInfoBox.innerHTML = "";
        if (infoBoxState.information) {
            const info = document.createElement("div");
            info.id = "info-text";
            info.innerHTML = infoBoxState.information;
            
            algorithmInfoBox.appendChild(info);
        }
        if (infoBoxState.dataStructure) {
            const { type, ds } = infoBoxState.dataStructure;
            
            const container = document.createElement("div");
            const datastructureName = document.createElement("h3");
            
            datastructureName.textContent = type;
            datastructureName.className = "ds-name";
            
            container.id = "ds-container";
            container.className = type;
            
            algorithmInfoBox.appendChild(datastructureName);
            
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
}
