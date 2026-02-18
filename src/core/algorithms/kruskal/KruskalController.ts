import Animation from "../../animation/Animation";
import Graph from "../../datastructures/Graph";
import { playBox, pauseButton, playButton, inputGroup, label, weightInput, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, downloadGraphButton, uploadGraphInput, clearGraphButton, closeAnimationButton, } from "../../dom/elements";
import { changeMessageBox, disableElement, enableElement, makeInvisible, makeVisible, resetWeightChangeInput, } from "../../dom/helpers";
import Network from "../../network/Network";
import { isPreset } from "../../types/preset";
import Kruskal from "./KruskalAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "step-by-step" | "animation-running" | "pre-animation";

export default class KruskalController {
    private readonly _network: Network;
    private readonly _algorithm: Kruskal;
    private readonly _graph: Graph;
    private readonly _animation: Animation;
    private _selectedEdgeId?: number;
    private _componentNodeId?: number;
    private _canvasState: canvasState = "idle"; 
    
    constructor() {
        this._graph = new Graph(true, false);
        this._network = new Network(this._graph, false, true);
        this._algorithm = new Kruskal(this._graph);
        this._animation = new Animation(this._network);
        
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
    private changeCanvasState(newState: canvasState): void {
        if ( (this._canvasState === "animation-running" || this._canvasState === "pre-animation") && newState === "idle" ){
            this._animation.escapeAnimation();
            this.enableAllButtons();
            makeInvisible(algorithmInformationBox);
            makeInvisible(speedBox);
            makeInvisible(playBox);
            this._componentNodeId = undefined;
        }
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
            case "pre-animation":
                if(this._graph.isEmpty){
                    changeMessageBox("no nodes to run algorithm on.");
                    setTimeout(() => {
                        this.changeCanvasState("idle");
                    }, 1500);
                    break;
                }
                this.disableAllButtons();
                changeMessageBox("select a node from a component");
                this._selectedEdgeId = undefined;
                this._network.resetToIdle();
                break;
            case "idle":
                changeMessageBox( "idle mode (click on edges to modify weights)" );
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
                this._animation.start();
                break;
        }
    }
    private enableAllButtons() {
        enableElement(addEdgeButton);
        enableElement(addNodeButton);
        enableElement(deleteModeButton);
        enableElement(clearGraphButton);
        enableElement(escapeModeButton);
        enableElement(runAnimationButton);
        enableElement(downloadGraphButton);
        enableElement(uploadGraphInput);
        enableElement(presetInput);
        
    }
    private disableAllButtons() {
        disableElement(addEdgeButton);
        disableElement(addNodeButton);
        disableElement(clearGraphButton);
        disableElement(deleteModeButton);
        disableElement(escapeModeButton);
        disableElement(runAnimationButton);
        disableElement(downloadGraphButton);
        disableElement(uploadGraphInput);
        disableElement(presetInput);
    }
    private selectNodeHandle = (id: number): void => {
        if (this._canvasState !== "pre-animation") return;
        
        this._componentNodeId = id;
        
        const states = this._algorithm.run(this._componentNodeId);
        this._animation.setAnimationStates(states);
        
        this.changeCanvasState("animation-running");
    }
    private selectEdgeHandle = (id: number): void => {
        if ( this._canvasState === "animation-running" || this._canvasState !== "idle")return;
        
        makeVisible(inputGroup);
        
        this._selectedEdgeId = id;
        
        label!.textContent = `Change weight of the selected edge`;
        weightInput!.value = `${this._graph.getEdge( this._selectedEdgeId! )!.weight}`;
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
        uploadGraphInput.addEventListener("change", async () => {
            const file = uploadGraphInput!.files![0];
            
            if(!file || file.type !== "application/json")return;
            try{
                const text = await file.text();
                const json = await JSON.parse(text);
            
                if(!isPreset(json))throw new Error("wrong graph format");
                if(json.info.directed || !json.info.weighted)throw new Error("the graph is not suitable for the algorithm")
            
                this._network.loadPreset(json);
            }catch(e:any){
                alert(e.message)
            }
        })
        closeAnimationButton.addEventListener("click", () => {
            this.changeCanvasState("idle");
        })
        downloadGraphButton.addEventListener("click", () => {
            if(this._canvasState !== "pre-animation" && this._canvasState !== "animation-running"){
                this._network.saveGraphToJSON();
            }
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
            this._network.updateEdge({ id: selectedElementId, weight: newValue, });
        });
        clearGraphButton.addEventListener("click", () => {
            this._network.clearGraph();
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
            this._animation.animateCurrentState();
        });
        backButton.addEventListener("click", () => {
            this._animation.setAnimationStateBackward();
            this._animation.animateCurrentState();
        });
        playButton.addEventListener("click", () => {
            this._animation.continueAnimation();
            makeInvisible(playButton);
            makeVisible(pauseButton);
        });
        speedRangeInput.addEventListener("input", () => {
            const newspeed = Number.parseInt(speedRangeInput!.value);
            speedInfo.textContent = `speed: ${newspeed}x`;
            this._animation.setAnimationSpeedChange(1000 / newspeed);
        });
        presetInput.addEventListener("input", () => {
            if(presetInput!.value !== "load a graph"){
                const request = new Request(`./graph_presets/kruskal/${presetInput!.value}.json`);
                fetch(request)
                    .then((res) => {
                        return res.json();
                    })
                    .then((preset) => {
                        this._network.loadPreset(preset);
                    });
            }
        })
    }
}
