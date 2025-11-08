import { Animation } from "../../animation/Animation";
import { WeightedGraph } from "../../datastructures/Graph";
import { playBox, pauseButton, playButton, startingNodeInfo, destinationNodeInfo, pathInfoBox, speedRangeInput, speedInfo, backButton, forwardButton, resetButton, runAnimationButton, escapeModeButton, deleteModeButton, addNodeButton, addEdgeButton, presetInput, speedBox, algorithmInformationBox, downloadGraphButton, uploadGraphInput, } from "../../dom/elements";
import { changeMessageBox, makeInvisible, makeVisible} from "../../dom/helpers";
import { Network } from "../../network/Network";
import { isPreset } from "../../types/preset";
import AStar from "./AStarAlgorithm";

type canvasState = "add-edge-mode" | "idle" | "delete" | "add-node-mode" | "pre-animation" | "step-by-step" | "animation-running";
export class AStarController {
    private network: Network;
    private startingNodeId: number | null = null;
    private destinationNodeId: number | null = null;
    private canvasState: canvasState = "idle"
    private algorithm: AStar;
    private animation: Animation;
    private graph: WeightedGraph;
    constructor() {
        this.graph = new WeightedGraph();
        this.network = new Network(this.graph, true, true);
        this.algorithm = new AStar(this.graph);
        this.animation = new Animation(this.network);
        this.setUpNetworkEventListeners();
        this.setUpUiEventListeners();
    }
    private changeCanvasState(newState: canvasState): void {
        if ( (this.canvasState === "pre-animation" || this.canvasState === "animation-running") && newState !== "pre-animation" && newState !== "animation-running" ){
            this.animation.escapeAnimation();
            makeInvisible(algorithmInformationBox);
            makeInvisible(speedBox);
            makeInvisible(playBox);
            this.startingNodeId = null;
            this.destinationNodeId = null;
            startingNodeInfo!.textContent = "start: ";
            destinationNodeInfo!.textContent = "dest: ";
            changeMessageBox( "idle mode" );
            makeInvisible(pathInfoBox!);
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
                changeMessageBox( "idle mode");
                this.network.resetToIdle();
                break;
            case "pre-animation":
                changeMessageBox("select starting node");
                makeVisible(pathInfoBox!);
                this.network.resetToIdle();
                break;
            case "animation-running":
                makeVisible(playBox);
                makeVisible(pauseButton);
                makeVisible(speedBox);
                makeVisible(algorithmInformationBox);
                makeInvisible(playButton);
                this.network.fitGraphIntoAnimationSpace();
                this.network.disableEverything();
                this.animation.start();
                break;
        }
        this.canvasState = newState;

    }
    private selectNodeHandle = (id: number): void => {
        if (this.canvasState !== "pre-animation") return;
        if (this.startingNodeId === null) {
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
        const states = this.algorithm.run( this.startingNodeId!, this.destinationNodeId! );
        this.animation.setAnimationStates(states);
        this.changeCanvasState("animation-running");
    }
    private setUpNetworkEventListeners(): void {
        this.network.onSelectNode(this.selectNodeHandle);
    }
    private setUpUiEventListeners(): void {
        uploadGraphInput.addEventListener("change", async () => {
            if(this.canvasState === "pre-animation" || this.canvasState === "animation-running")return;
            const file = uploadGraphInput!.files![0];
            if(!file || file.type !== "application/json")return;
            try{
                const text = await file.text();
                const json = await JSON.parse(text);
                if(!isPreset(json))throw new Error("wrong graph format");
                if(!json.info.edgesTwoWay || !json.info.weighted)throw new Error("the graph is not suitable for the algorithm")
                this.network.loadPreset(json);
            }catch(e:any){
                alert(e.message)
            }
        })
        downloadGraphButton.addEventListener("click", () => {
            if(this.canvasState !== "pre-animation" && this.canvasState !== "animation-running"){
                this.network.saveGraphToJSON();
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
            this.animation.resetAnimation();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        pauseButton.addEventListener("click", () => {
            this.animation.pause();
            makeInvisible(pauseButton);
            makeVisible(playButton);
        });
        forwardButton.addEventListener("click", () => {
            this.animation.setAnimationStateForward();
            this.animation.animateCurrentState();
        });
        backButton.addEventListener("click", () => {
            this.animation.setAnimationStateBackward();
            this.animation.animateCurrentState();
        });
        playButton.addEventListener("click", () => {
            this.animation.continueAnimation();
            makeInvisible(playButton);
            makeVisible(pauseButton);
        });
        speedRangeInput.addEventListener("input", () => {
            const newspeed = Number.parseInt(speedRangeInput!.value);
            speedInfo.textContent = `speed: ${newspeed}x`;
            this.animation.setAnimationSpeedChange(1000 / newspeed);
        });
        presetInput.addEventListener("input", () => {
            if(presetInput!.value !== "load a graph"){
                if(this.canvasState === "pre-animation" || this.canvasState === "animation-running"){
                    this.changeCanvasState("idle");
                }
                const request = new Request(`./graph_presets/a_star/${presetInput!.value}.json`);
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
