import Animation from "../../animation/Animation";
import Graph from "../../datastructures/Graph";
import { playBox, pauseButton, playButton, inputGroup, label, weightInput, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, clearGraphButton, closeAnimationButton, } from "../../dom/elements";
import { changeMessageBox, disableElement, enableElement, makeInvisible, makeVisible, resetWeightChangeInput, } from "../../dom/helpers";
import Network from "../../network/Network";
import Prim from "./PrimAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "pre-animation" |  "animation-running";
export default class PrimController {
    private readonly _network: Network;
    private readonly _algorithm: Prim;
    private readonly _animation: Animation;
    private readonly _graph: Graph;
    private _selectedEdgeId?: number;
    private _startingNodeId?: number;
    private _canvasState: canvasState = "idle";
    constructor() {
        this._graph = new Graph(true, false);
        this._network = new Network(this._graph, false, true);
        this._algorithm = new Prim(this._graph);
        this._animation = new Animation(this._network);
        
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
    private changeCanvasState(newState: canvasState): void {
        this._canvasState = newState;
        resetWeightChangeInput();
        switch (newState) {
            case "add-edge-mode":
                changeMessageBox( "to create an edge click and drag from one node to the other" );
                this._network.addEdgeModeOn();
                break;
            case "add-node-mode":
                changeMessageBox("click on the canvas to create a node");
                this._network.addNodeModeOn();
                break;
            case "delete":
                changeMessageBox("select an element to delete");
                this._network.deleteElementModeOn();
                break;
            case "idle":
                this.escapeAnimation();
                changeMessageBox( "idle mode (click on edges to modify weights)" );
                this._network.resetToIdle();
                break;
            case "pre-animation":
                this.disableAllButtons();
                if(this._graph.isEmpty){
                    changeMessageBox("no nodes to run algorithm on.");
                    setTimeout(() => {
                        this.changeCanvasState("idle");
                    }, 1500);
                    break;
                }
                changeMessageBox("select starting node");
                this._selectedEdgeId = undefined;
                this._network.resetToIdle();
                break;
            case "animation-running":
                makeVisible(playBox);
                makeVisible(pauseButton);
                makeInvisible(playButton);
                makeVisible(algorithmInformationBox);
                makeVisible(speedBox);
                this._network.fitGraphIntoAnimationSpace();
                this._network.disableEverything();

                const states = this._algorithm.run(this._startingNodeId!);
                this._animation.setAnimationStates(states);

                this._animation.start();
                break;
        }
        
    }
    private escapeAnimation(): void {
        this._animation.escapeAnimation();
        this._network.graph = this._graph;
        this.enableAllButtons();
        makeInvisible(algorithmInformationBox);
        makeInvisible(speedBox);
        makeInvisible(playBox);
        this._startingNodeId = undefined;
    }
    private enableAllButtons() {
        enableElement(addEdgeButton);
        enableElement(addNodeButton);
        enableElement(deleteModeButton);
        enableElement(clearGraphButton);
        enableElement(escapeModeButton);
        enableElement(runAnimationButton);
        enableElement(presetInput);
    }
    private disableAllButtons() {
        disableElement(addEdgeButton);
        disableElement(addNodeButton);
        disableElement(clearGraphButton);
        disableElement(deleteModeButton);
        disableElement(escapeModeButton);
        disableElement(runAnimationButton);
        disableElement(presetInput);
    }
    private selectNodeHandle = (id: number): void => {
        if (this._canvasState !== "pre-animation") return;
        
        this._startingNodeId = id;
        
        this.changeCanvasState("animation-running");
    }
    private selectEdgeHandle = (id: number): void => {
        if (this._canvasState !== "idle") return;
        makeVisible(inputGroup);
        
        this._selectedEdgeId = id;
        
        label!.textContent = `Change weight of the selected edge`;
        weightInput!.value = `${this._graph.getEdge(this._selectedEdgeId!)!.weight ?? ""}`;
    }
    private canvasBlankClickHandle = (): void => {
        resetWeightChangeInput();
    }
    private setUpNetworkEventListeners(): void {
        this._network.onSelectEdge(this.selectEdgeHandle);
        this._network.onSelectNode(this.selectNodeHandle);
        this._network.onCanvasBlankClick(this.canvasBlankClickHandle);
    }
    private setUpUiEventListeners(): void {
        closeAnimationButton.addEventListener("click", () => {
            this.changeCanvasState("idle");
        })
        addEdgeButton.addEventListener("click", () => {
            this.changeCanvasState("add-edge-mode");
        });

        addNodeButton.addEventListener("click", () => {
            this.changeCanvasState("add-node-mode");
        });
        deleteModeButton.addEventListener("click", () => {
            this.changeCanvasState("delete");
        });

        escapeModeButton.addEventListener("click", () => {
            this.changeCanvasState("idle");
        });

        runAnimationButton.addEventListener("click", () => {
            this.changeCanvasState("pre-animation");
        });
        weightInput!.addEventListener("input", () => {
            const newValue = Number.parseInt(weightInput!.value);
            const selectedElementId = this._selectedEdgeId!;
            this._graph.getEdge(selectedElementId)!.weight = newValue;
            this._network.drawCanvas();
        });
        resetButton.addEventListener("click", () => {
            this._animation.resetAnimation();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        pauseButton.addEventListener("click", () => {
            this._animation.pause();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        forwardButton.addEventListener("click", () => {
            this._animation.setAnimationStateForward();
        });
        backButton.addEventListener("click", () => {
            this._animation.setAnimationStateBackward();
        });
        playButton.addEventListener("click", () => {
            this._animation.continueAnimation();
            makeInvisible(playButton);
            makeVisible(pauseButton);
        });
        clearGraphButton.addEventListener("click", () => {
            this._network.clearGraph();
        });
        speedRangeInput.addEventListener("input", () => {
            const newspeed = Number.parseInt(speedRangeInput!.value);
            speedInfo.textContent = `speed: ${newspeed}x`;
            this._animation.setAnimationSpeedChange(1000 / newspeed);
        });
        presetInput.addEventListener("input", async () => {
            if(presetInput!.value !== "load a graph"){    
                const request = new Request(`./graph_presets/prim/${presetInput!.value}.json`);
                const response = await fetch(request);
                const preset = await response.json();
                this._network.loadPreset(preset);
            }
        })
    }
}
