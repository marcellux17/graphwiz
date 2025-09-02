import { Animation } from "../animation/Animation";
import { Graph } from "../datastructures/Graph";
import { playBox, pauseButton, playButton, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible, } from "../dom/helpers";
import { Network } from "../network/Network";
import DFS from "./DFSAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "run-animation" | "step-by-step" | "animation-running";
export class DFSController {
    private network: Network;
    private startingNodeId: number | null = null;
    private canvasState: canvasState = "idle"; //aka no mode is selected
    private animation: Animation;
    private algorithm: DFS;
    constructor() {
        const graph = new Graph();
        this.network = new Network(graph, false, true, false);
        this.animation = new Animation(this.network);
        this.algorithm = new DFS(graph);
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
    changeCanvasState(newState: canvasState): void {
        if ( (this.canvasState === "run-animation" || this.canvasState === "animation-running") && newState !== "idle" && newState !== "animation-running" ) return;
        const prevCanvasState = this.canvasState;
        this.canvasState = newState;
        switch (newState) {
            case "add-edge-mode":
                changeMessageBox( "to create an edge click and drag from one node to the other" );
                this.network.addEdgeModeOn();
                break;
            case "add-node-mode":
                changeMessageBox("click on the canvas to create a node");
                this.network.addNodeModeOn();
                break;
            case "delete":
                changeMessageBox("select an element to delete");
                this.network.deleteElementModeOn();
                break;
            case "idle":
                if ( prevCanvasState === "run-animation" || prevCanvasState === "animation-running" ) {
                    this.animation.escapeAnimation();
                    makeInvisible(algorithmInformationBox);
                    makeInvisible(speedBox);
                }
                this.startingNodeId = null;
                changeMessageBox( "idle mode (click on edges to modify weights)" );
                makeInvisible(playBox);
                this.network.resetToIdle();
                break;
            case "run-animation":
                changeMessageBox("select starting node");
                this.network.resetToIdle();
                break;
            case "animation-running":
                makeVisible(playBox);
                makeVisible(pauseButton);
                makeInvisible(playButton);
                makeVisible(algorithmInformationBox);
                makeVisible(speedBox);
                this.network.fitGraphIntoAnimationSpace(350)
                this.network.disableEverything();
                this.animation.start();
                break;
        }
    }
    selectNodeHandle(id: number): void {
        if (this.canvasState !== "run-animation") return;
        this.startingNodeId = id;
        const states = this.algorithm.Run(this.startingNodeId);
        this.animation.setAnimationStates(states);
        this.changeCanvasState("animation-running");  
    }
    private setUpNetworkEventListeners(): void {
        this.selectNodeHandle = this.selectNodeHandle.bind(this);
        this.network.onSelectNode(this.selectNodeHandle);
    }
    private setUpUiEventListeners(): void {
        addEdgeButton?.addEventListener("click", () => {
            this.changeCanvasState("add-edge-mode");
        });

        addNodeButton?.addEventListener("click", () => {
            this.changeCanvasState("add-node-mode");
        });
        deleteModeButton?.addEventListener("click", () => {
            this.changeCanvasState("delete");
        });

        escapeModeButton?.addEventListener("click", () => {
            this.changeCanvasState("idle");
        });

        runAnimationButton?.addEventListener("click", () => {
            this.changeCanvasState("run-animation");
        });
        resetButton?.addEventListener("click", () => {
            this.animation.resetAnimation();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        pauseButton?.addEventListener("click", () => {
            this.animation.pause();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        forwardButton?.addEventListener("click", () => {
            this.animation.setAnimationStateForward();
            this.animation.animateCurrentState();
        });
        backButton?.addEventListener("click", () => {
            this.animation.setAnimationStateBackward();
            this.animation.animateCurrentState();
        });
        playButton?.addEventListener("click", () => {
            this.animation.continueAnimation();
            makeInvisible(playButton);
            makeVisible(pauseButton);
        });
        speedRangeInput?.addEventListener("input", () => {
            let newspeed = Number.parseInt(speedRangeInput!.value);
            speedInfo.textContent = `speed: ${newspeed}x`;
            this.animation.setAnimationSpeedChange(1000 / newspeed);
        });
        presetInput?.addEventListener("input", () => {
            if(presetInput!.value !== "load a graph" && this.canvasState !== "run-animation" && this.canvasState !== "animation-running"){
                this.network.loadPreset("dfs", presetInput!.value);
            }
        })
    }
}
