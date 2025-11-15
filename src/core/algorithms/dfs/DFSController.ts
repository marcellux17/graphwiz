import Animation from "../../animation/Animation";
import Graph from "../../datastructures/Graph";
import { playBox, pauseButton, playButton, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, algorithmInformationBox, speedBox, downloadGraphButton, uploadGraphInput, } from "../../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible, } from "../../dom/helpers";
import Network from "../../Network/Network";
import { isPreset } from "../../types/preset";
import DFS from "./DFSAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "pre-animation" | "step-by-step" | "animation-running";
export default class DFSController {
    private readonly _network: Network;
    private readonly _animation: Animation;
    private readonly _algorithm: DFS;
    private readonly _graph: Graph;
    private _startingNodeId?: number;
    private _canvasState: canvasState = "idle";
    
    constructor() {
        this._graph = new Graph();
        this._network = new Network(this._graph, true);
        this._animation = new Animation(this._network);
        this._algorithm = new DFS(this._graph);
        
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
   private changeCanvasState(newState: canvasState): void {
        if ( (this._canvasState === "pre-animation" || this._canvasState === "animation-running") && newState !== "pre-animation" && newState !== "animation-running" ){
            this._animation.escapeAnimation();
            makeInvisible(algorithmInformationBox);
            makeInvisible(speedBox);
            makeInvisible(playBox);
            this._startingNodeId = undefined;
        }
        if(this._canvasState === "animation-running" && newState === "pre-animation")return;
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
                changeMessageBox( "idle mode" );
                this._network.resetToIdle();
                break;
            case "pre-animation":
                changeMessageBox("select starting node");
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
        this._canvasState = newState;
    }
    private selectNodeHandle = (id: number): void => {
        if (this._canvasState !== "pre-animation") return;
        
        this._startingNodeId = id;
        const states = this._algorithm.run(this._startingNodeId);
        this._animation.setAnimationStates(states);
        
        this.changeCanvasState("animation-running");  
    }
    private setUpNetworkEventListeners(): void {
        this.selectNodeHandle = this.selectNodeHandle.bind(this);
        this._network.onSelectNode(this.selectNodeHandle);
    }
    private setUpUiEventListeners(): void {
        uploadGraphInput.addEventListener("change", async () => {
            if(this._canvasState === "pre-animation" || this._canvasState === "animation-running")return;
            
            const file = uploadGraphInput!.files![0];
            
            if(!file || file.type !== "application/json")return;
            try{
                const text = await file.text();
                const json = await JSON.parse(text);
                
                if(!isPreset(json))throw new Error("wrong graph format");
                if(!json.info.edgesBidirectional || json.info.weighted)throw new Error("the graph is not suitable for the algorithm")
                
                    this._network.loadPreset(json);
            }catch(e:any){
                alert(e.message)
            }
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
                if(this._canvasState === "pre-animation" || this._canvasState === "animation-running"){
                    this.changeCanvasState("idle");
                }
                const request = new Request(`./graph_presets/dfs/${presetInput!.value}.json`);
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
