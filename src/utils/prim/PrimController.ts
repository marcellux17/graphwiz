import { Animation } from "../animation/Animation";
import { WeightedGraph } from "../datastructures/Graph";
import { playBox, pauseButton, playButton, inputGroup, label, weightInput, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, downloadGraphButton, uploadGraphInput, } from "../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible, resetInput, } from "../dom/helpers";
import { Network } from "../network/Network";
import { isPreset } from "../types/preset";
import Prim from "./PrimAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "run-animation" | "step-by-step" | "animation-running";
export class PrimController {
    private network: Network;
    private selectedEdgeId: number | null = null;
    private startingNodeId: number | null = null;
    private canvasState: canvasState = "idle"; //aka no mode is selected
    private algorithm: Prim;
    private animation: Animation;
    constructor() {
        const graph = new WeightedGraph();
        this.network = new Network(graph, false, true);
        this.algorithm = new Prim(graph);
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
                changeMessageBox( "idle mode (click on edges to modify weights)" );
                makeInvisible(playBox);
                this.network.resetToIdle();
                break;
            case "run-animation":
                changeMessageBox("select starting node");
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
                this.network.fitGraphIntoAnimationSpace();
                this.network.disableEverything();
                this.animation.start();
                break;
        }
        resetInput();
    }
    selectNodeHandle(id: number): void {
        if (this.canvasState !== "run-animation") return;
        this.startingNodeId = id;
        const states = this.algorithm.Run(this.startingNodeId);
        this.animation.setAnimationStates(states);
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
        uploadGraphInput?.addEventListener("change", async () => {
            const file = uploadGraphInput!.files![0];
            if(file.type !== "application/json")return;
            const text = await file.text();
            try{
                const json = await JSON.parse(text);
                if(!isPreset(json))throw new Error("wrong graph format");
                if(!json.info.edgesToWay || !json.info.weighted)throw new Error("the graph is not suitable for the algorithm")
                this.network.loadPreset(json);
            }catch(e:any){
                //should update this for a nice error message for the user
                alert(e.message)
            }
        })
        downloadGraphButton?.addEventListener("click", () => {
            if(this.canvasState !== "run-animation" && this.canvasState !== "animation-running"){
                this.network.saveGraphToJSON();
            }
        })
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
        presetInput?.addEventListener("input", () => {
            if(presetInput!.value !== "load a graph" && this.canvasState !== "run-animation" && this.canvasState !== "animation-running"){
                const request = new Request(`./graph_presets/prim/${presetInput!.value}.json`);
                fetch(request)
                    .then((res) => {
                        return res.json();
                    })
                    .then((preset) => {
                        this.network.loadPreset(preset);
                    });
            }
        })
    }
}
