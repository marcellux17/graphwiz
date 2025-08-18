import { Animation } from "../animation/animation";
import { WeightedGraph } from "../datastructures/graph";
import { playBox, pauseButton, playButton, startingNodeInfo, destinationNodeInfo, pathInfoBox, inputGroup, label, weightInput, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible, resetInput, } from "../dom/helpers";
import { Network } from "../network/network";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "run-animation" | "step-by-step" | "animation-running";
export class BellmanFordController {
    private network: Network;
    private selectedEdgeId: number | null = null;
    private startingNodeId: number | null = null;
    private destinationNodeId: number | null = null;
    private canvasState: canvasState = "idle"; //aka no mode is selected
    private animation: Animation;
    constructor() {
        const graph = new WeightedGraph();
        this.network = new Network(graph, false, false, true);
        this.animation = new Animation(this.network);
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
    changeCanvasState(newState: canvasState): void {
        if ( (this.canvasState === "run-animation" || this.canvasState === "animation-running") && newState !== "idle" && newState !== "animation-running" ) return;
        const prevCanvasState = this.canvasState;
        this.canvasState = newState;
        switch (newState) {
            case "add-edge-mode":
                changeMessageBox(
                    "to create an edge click and drag from one node to the other"
                );
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
                this.destinationNodeId = null;
                startingNodeInfo!.textContent = "start: ";
                destinationNodeInfo!.textContent = "dest: ";
                changeMessageBox( "idle mode (click on edges to modify weights)" );
                makeInvisible(pathInfoBox);
                makeInvisible(playBox);
                this.network.resetToIdle();
                break;
            case "run-animation":
                changeMessageBox("select starting node");
                makeVisible(pathInfoBox);
                resetInput();
                this.selectedEdgeId = null;
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
        resetInput();
    }
    selectNodeHandle(id: number): void {
        if (this.canvasState !== "run-animation") return;
        if (this.startingNodeId === null && this.startingNodeId != 0) {
            this.startingNodeId = id;
            changeMessageBox("choose destination node");
            startingNodeInfo!.textContent = `start: ${this.network.getLabelOfNode( this.startingNodeId! )}`;
            return;
        }
        this.destinationNodeId = id;
        if (this.destinationNodeId === this.startingNodeId) {
            changeMessageBox("choose destination node");
            return;
        }
        const connected = this.network.areConnected( this.startingNodeId!, this.destinationNodeId! );
        if (!connected) {
            changeMessageBox( "no path from starting node to destination node, choose another destination node" );
            return;
        }
        destinationNodeInfo!.textContent = `dest: ${this.network.getLabelOfNode( this.destinationNodeId! )}`;
        // const states = this.algorithm.Run( this.startingNodeId!, this.destinationNodeId! );
        // this.animation.setAnimationStates(states);
        this.changeCanvasState("animation-running");
    }
    selectEdgeHandle(id: number): void {
        if ( this.canvasState === "animation-running" || this.canvasState === "run-animation" )return;
        if (this.canvasState !== "idle") return;
        makeVisible(inputGroup);
        this.selectedEdgeId = id;
        label.textContent = `Change weight of the selected edge`;
        weightInput.value = `${this.network.getEdgeWeight( this.selectedEdgeId! )}`;
    }
    canvasBlankClickHandle(): void {
        resetInput();
    }
    private setUpNetworkEventListeners(): void {
        this.selectNodeHandle = this.selectNodeHandle.bind(this);
        this.selectEdgeHandle = this.selectEdgeHandle.bind(this);
        this.canvasBlankClickHandle = this.canvasBlankClickHandle.bind(this);
        this.network.onSelectEdge(this.selectEdgeHandle);
        this.network.onSelectNode(this.selectNodeHandle);
        this.network.onCanvasBlankClick(this.canvasBlankClickHandle);
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
        weightInput.addEventListener("input", () => {
            const newValue = Number.parseInt(weightInput.value);
            const selectedElementId = this.selectedEdgeId!;
            this.network.updateEdge({ id: selectedElementId, weight: newValue, });
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
        // presetInput?.addEventListener("input", () => {
        //     if(presetInput!.value !== "load a graph" && this.canvasState !== "run-animation" && this.canvasState !== "animation-running"){
        //         this.network.loadPreset("dijkstra", presetInput!.value);
        //     }
        // })
    }
}
