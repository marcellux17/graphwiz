import { Animation } from "../../animation/Animation";
import { Graph } from "../../datastructures/Graph";
import { playBox, pauseButton, playButton, weightInput, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, downloadGraphButton, uploadGraphInput, } from "../../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible } from "../../dom/helpers";
import { Network } from "../../network/Network";
import { isPreset } from "../../types/preset";
import TopologicalSort from "./TopologicalSortAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "pre-animation" | "step-by-step" | "animation-running";
export class TopologicalSortController {
    private network: Network;
    private selectedEdgeId: number | null = null;
    private canvasState: canvasState = "idle"; //aka no mode is selected
    private animation: Animation;
    private algorithm: TopologicalSort
    constructor() {
        const graph = new Graph();
        this.network = new Network(graph, false);
        this.animation = new Animation(this.network);
        this.algorithm = new TopologicalSort(graph);
        this.setUpUiEventListeners();
    }
    changeCanvasState(newState: canvasState): void {
        if ( (this.canvasState === "pre-animation" || this.canvasState === "animation-running") && newState !== "pre-animation" && newState !== "animation-running" ){
            this.animation.escapeAnimation();
            makeInvisible(algorithmInformationBox);
            makeInvisible(speedBox);
            makeInvisible(playBox);
        }
        if(this.canvasState === "animation-running" && newState === "pre-animation")return;
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
                changeMessageBox( "idle mode" );
                this.network.resetToIdle();
                break;
            case "pre-animation":
                this.network.resetToIdle();
                if(this.network.getNumberOfNodes() === 0){
                    changeMessageBox("no nodes to run algorithm on.");
                    setTimeout(() => {
                        this.changeCanvasState("idle");
                    }, 1500);
                    break;
                }
                const states = this.algorithm.run();
                if(states.length === 0){
                    changeMessageBox("Graph contains cycle(s). Remove them to run algorithm.");
                    setTimeout(() => {
                        this.changeCanvasState("idle");
                    }, 1500);
                    break;
                }
                this.animation.setAnimationStates(states);
                this.changeCanvasState("animation-running");
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
        this.canvasState = newState;
    }
    private setUpUiEventListeners(): void {
        uploadGraphInput?.addEventListener("change", async () => {
            if(this.canvasState === "pre-animation" || this.canvasState === "animation-running")return;
            const file = uploadGraphInput!.files![0];
            if(!file || file.type !== "application/json")return;
            try{
                const text = await file.text();
                const json = await JSON.parse(text);
                if(!isPreset(json))throw new Error("wrong graph format");
                if(json.info.edgesTwoWay || !json.info.weighted)throw new Error("the graph is not suitable for the algorithm")
                this.network.loadPreset(json);
            }catch(e:any){
                //should update this for a nice error message for the user
                alert(e.message)
            }
        })
        downloadGraphButton?.addEventListener("click", () => {
            if(this.canvasState !== "pre-animation" && this.canvasState !== "animation-running"){
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
            this.changeCanvasState("pre-animation");
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
            if(presetInput!.value !== "load a graph" && this.canvasState !== "pre-animation" && this.canvasState !== "animation-running"){
                const request = new Request(`./graph_presets/topological_sort/${presetInput!.value}.json`);
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
