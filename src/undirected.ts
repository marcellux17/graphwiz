import { Node, Edge } from "vis-network";
import { DataSet, Network } from "vis-network/standalone";
import { undirectedGraph } from "./datastructures/graphs";

//for vis js to inject canvas into
const container = document.querySelector<HTMLElement>("#container")!;

//editing buttons
const addEdgeButton = document.querySelector<HTMLButtonElement>("#add-edge");
const focusButton = document.querySelector<HTMLButtonElement>("#focus-view");
const addNodeButton = document.querySelector<HTMLButtonElement>("#add-node");
const deleteModeButton =
    document.querySelector<HTMLButtonElement>("#delete-mode");
const escapeModeButton =
    document.querySelector<HTMLButtonElement>("#escape-mode");

//animation related elements
const animationBox = document.querySelector<HTMLDivElement>("#animation-box")!;
const backButton = document.querySelector<HTMLButtonElement>("#back");
const forwardButton = document.querySelector<HTMLButtonElement>("#forward");
const pauseButton = document.querySelector<HTMLButtonElement>("#pause")!;
const playButton = document.querySelector<HTMLButtonElement>("#play")!;
const runAnimationButton =
    document.querySelector<HTMLButtonElement>("#run-animation");
const selectAlgorithm = document.querySelector<HTMLSelectElement>("#algorithms")!;

//displaying feedback for the user
const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;

//for changing the label of a graph
const label = document.querySelector<HTMLLabelElement>("#label-message")!;
const labelInput = document.querySelector<HTMLInputElement>("#change-label")!;
const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;

//const messageForLabel = document.querySelector<HTMLParagraphElement>("#change-data .message-box")!;

//speed changing elements selected from speed-box
const toggleSpeedButton = document.querySelector<HTMLButtonElement>("#toggle-speed");
const openSpeedRangeInputButton = document.querySelector<HTMLButtonElement>("#open-speed");
const hideSpeedRangeInputButton = document.querySelector<HTMLButtonElement>("#hide-speed");
const speedRangeInput = document.querySelector<HTMLInputElement>("#speed-input");
const speedInfo = document.querySelector<HTMLDivElement>("#speed-info")!;


//types
type animationMoveDirection = "forward" | "backward";
type animationState = "running" | "paused";
type canvasState =
    | "add-edge-mode"
    | "none"
    | "delete"
    | "add-node-mode"
    | "run-animation"
    | "step-by-step"
    | "animation-running";
// run-animation: to start animation vs. animation-running: animation is currently running
// none is set when we click the escape button

//GLOBAL VARIABLES
let selectedNode: string;
let canvas_state: canvasState = "none";

//animation
let interval: number;
let animationSpeed = 1000; //in ms
let animationSpeedChange = 1000; //in case the user wants to change the speed of the animation
let currentAnimationStateNumber = -1;//in the animation function it first increments so it does not point to a negative index of the states
let visitedNodeColor = "#5b63b7";
let nodeColor = "#acaeff";
let currentAnimationState: animationState = "running";
let selectedAlgorithm : string;// "dfs" or "bfs"

const graph_nodes = new DataSet<Node>([]);
const graph_edges = new DataSet<Edge>([]);
const data = {
    nodes: graph_nodes,
    edges: graph_edges,
};
const options = {
    width: "100%",
    height: "100%",
    autoResize: false,
    physics: {
        enabled: false,
    },
    interaction: {
        dragView: true,
    },
    nodes: {
        borderWidth: 2,
        shape: "circle",
        color: nodeColor,
        widthConstraint: {
            minimum: 75,
        },
        font: "15px arial white",
    },
    edges: {
        smooth: false,
        width: 2,
    },
    manipulation: {
        enabled: false,
        addEdge: function (edgeData: Edge, callback: Function) {
            const from = edgeData.from;
            const to = edgeData.to!;
            if (from !== to) {
                if (typeof from === "string" && typeof to == "string") {
                    graph.AddEdge(from, to);
                }
                callback(edgeData);
            }
            changeCanvasState("add-edge-mode");
        },
        addNode: function (nodeData: Node, callback: Function) {
            const { id, label } = graph.AddNode();
            nodeData.id = id;
            nodeData.label = label;
            callback(nodeData);
            changeCanvasState("add-node-mode");
        },
        deleteNode: function (
            { edges, nodes }: { edges: string[]; nodes: string[] },
            callback: Function
        ) {
            const id = nodes[0];
            if (typeof id === "string") {
                graph.DeleteNode(id);
            }
            const data = { edges, nodes };
            callback(data);
            resetInput();
        },
        deleteEdge: function (
            { edges, nodes }: { edges: string[]; nodes: string[] },
            callback: Function
        ) {
            const edge_to_be_deleted: Edge = graph_edges.get(edges[0])!;
            const from = edge_to_be_deleted.to;
            const to = edge_to_be_deleted.from;
            if (typeof from === "string" && typeof to == "string") {
                graph.RemoveEdge(from, to);
            }
            const data = { edges, nodes };
            callback(data);
        },
    },
};
const network = new Network(container, data, options);
const graph = new undirectedGraph();
let states: Map<string, boolean>[] | undefined;

//events on the network
network.on("selectNode", (e) => {
    //so that we don't do anything while animation is running
    if (canvas_state === "animation-running") {
        return;
    }
    if (!(canvas_state === "none" || canvas_state === "run-animation")) {
        return;
    }
    selectedNode = e.nodes[0];
    //if a node was selected in run-animation state we run the algorithm and then return
    if (canvas_state == "run-animation") {
        states = selectedAlgorithm === "dfs" ? graph.DFS(selectedNode):graph.BFS(selectedNode);
        console.log("selected algorithm", selectedAlgorithm)
        //changing canvas_state to animation-running happens only here
        MakeInvisible(selectAlgorithm);
        changeAnimationState("running");
        changeCanvasState("animation-running");
        return;
    }
    const node = graph_nodes.get(selectedNode);
    MakeVisible(inputGroup);
    label.textContent = `Change label of the selected node`;
    labelInput.value = node?.label == undefined ? "" : node.label;
});
//speed changing related events
toggleSpeedButton?.addEventListener("mouseover", () => {
  const tooltip = toggleSpeedButton.parentElement?.querySelector<HTMLElement>(".tooltip");
  MakeVisible(tooltip)
});
toggleSpeedButton?.addEventListener("mouseleave", () => {
  const tooltip = toggleSpeedButton.parentElement?.querySelector<HTMLElement>(".tooltip");
  MakeInvisible(tooltip)
});
speedRangeInput?.addEventListener("input", () => {
    let newspeed = Number.parseInt(speedRangeInput.value);
    speedInfo.textContent = `speed: ${newspeed}x`;
    animationSpeedChange = 1000/newspeed;
})
//

openSpeedRangeInputButton?.addEventListener("click", () => {
  MakeVisible(speedRangeInput);
  MakeVisible(speedInfo);
  MakeVisible(hideSpeedRangeInputButton);
  MakeInvisible(openSpeedRangeInputButton);
});

hideSpeedRangeInputButton?.addEventListener("click", () => {
  MakeInvisible(speedRangeInput);
  MakeInvisible(speedInfo);
  MakeVisible(openSpeedRangeInputButton);
  MakeInvisible(hideSpeedRangeInputButton);
});

//
network.on("deselectNode", () => {
    resetInput();
});

addEdgeButton?.addEventListener("click", () => {
    changeCanvasState("add-edge-mode");
});

addNodeButton?.addEventListener("click", () => {
    changeCanvasState("add-node-mode");
});

focusButton?.addEventListener("click", () => {
    network.fit();
});

deleteModeButton?.addEventListener("click", () => {
    changeCanvasState("delete");
});

escapeModeButton?.addEventListener("click", () => {
    changeCanvasState("none");
});

runAnimationButton?.addEventListener("click", () => {
    changeCanvasState("run-animation");
});

labelInput.addEventListener("input", () => {
    const new_label = labelInput.value;
    graph.ModifyLabel(selectedNode, new_label);
    graph_nodes.update({
        id: selectedNode,
        label: new_label,
    });
});
//animation box state changes
pauseButton?.addEventListener("click", () => {
    changeAnimationState("paused");
    clearInterval(interval);
    MakeInvisible(pauseButton);
    MakeVisible(playButton);
});
forwardButton?.addEventListener("click", () => {
    if (currentAnimationState === "paused") {
        clearInterval(interval);
        changeCurrentAnimationStateNumber("forward");
        ColorNodes(states![currentAnimationStateNumber]);
    }
});
backButton?.addEventListener("click", () => {
    if (currentAnimationState === "paused") {
        clearInterval(interval);
        changeCurrentAnimationStateNumber("backward");
        ColorNodes(states![currentAnimationStateNumber]);
    }
});
playButton?.addEventListener("click", () => {
    changeAnimationState("running");
    runAnimation();
    MakeInvisible(playButton);
    MakeVisible(pauseButton);
});
selectAlgorithm?.addEventListener("input", () => {
    selectedAlgorithm = selectAlgorithm.value;
    console.log(selectedAlgorithm)
})
function changeAnimationState(state: animationState): void {
    currentAnimationState = state;
    ChangeMessageBox(currentAnimationState);
}
function changeCanvasState(mode: canvasState): void {
    if ((canvas_state === "run-animation" ||canvas_state === "animation-running") 
        &&
        mode !== "none" &&
        mode !== "animation-running"
    ) {
        //checks if we are currently in run-animation mode and we try to modify the graph
        return;
    }
    const prev_canvas_state = canvas_state;
    canvas_state = mode;
    switch (mode) {
        case "add-edge-mode":
            ChangeMessageBox(
                "to create an edge click and drag from one node to the other"
            );
            network.addEdgeMode();
            break;
        case "add-node-mode":
            ChangeMessageBox("click on a blank position to add a node");
            network.addNodeMode();
            break;
        case "delete":
            ChangeMessageBox("select an element and click delete");
            network.deleteSelected();
            break;
        case "none":
            if (prev_canvas_state === "run-animation" || prev_canvas_state === "animation-running")
                ResetNodes();
                MakeVisible(selectAlgorithm);
            ChangeMessageBox("select mode on the toolbar");
            network.disableEditMode();
            MakeInvisible(animationBox);
            break;
        case "run-animation":
            network.unselectAll();
            ChangeMessageBox("select a node to run animation");
            resetInput();
            network.disableEditMode();
            break;
        case "animation-running":
            changeAnimationState("running");
            MakeVisible(animationBox);
            MakeInvisible(playButton);
            MakeVisible(pauseButton);
            runAnimation();
            network.disableEditMode();
            break;
    }
}
function resetInput(): void {
    selectedNode = "";
    label.textContent = "";
    labelInput.value = "";
    MakeInvisible(inputGroup);
    //   messageForLabel.classList.add('hidden')
}
//runs animation on the return value of the selected graph algorithm
//checks for userinput changes to change speed (have not yet been added)
function runAnimation(): void {
    if (states) {
        interval = setInterval(() => {
            //if animation speed has been altered by the user
            if (animationSpeed !== animationSpeedChange) {
                animationSpeed = animationSpeedChange;
                clearInterval(interval);
                runAnimation();
            } else {
                changeCurrentAnimationStateNumber("forward");
                const currentState = states![currentAnimationStateNumber];
                ColorNodes(currentState);
                //if animation finished running
                if (currentAnimationStateNumber === states!.length - 1) {
                    clearInterval(interval);
                    changeAnimationState("paused");
                    MakeInvisible(pauseButton);
                    MakeVisible(playButton);
                    return;
                }
            }
        }, animationSpeed);
    }
}
//IT MAY LOOK INEFFICIENT TO ITERATE OVER A MAP BUT IT DOES NOT REQUIRE US TO ITERATE OVER EACH BUCKET
//SINCE V8 MAINTAINS AN INTERNAL LIST OF KEYS
//colores nodes based on state
function ColorNodes(state: Map<string, boolean>): void {
    for (const [nodeId, visited] of state) {
        graph_nodes.update({
            id: nodeId,
            color: visited ? visitedNodeColor : nodeColor,
        });
    }
}
function ResetNodes(): void {
    states = undefined;
    currentAnimationStateNumber = -1;
    graph_nodes.forEach((node, id) => {
        graph_nodes.update({
            id,
            color: nodeColor,
        });
    });
}
function MakeVisible(element: HTMLElement|undefined|null): void {
    if(element)element.classList.remove("hide");
}
function MakeInvisible(element: HTMLElement|undefined|null): void {
    if(element)element.classList.add("hide");
}

function ChangeMessageBox(new_message: string): void {
    messageBox.textContent = new_message;
}
function changeCurrentAnimationStateNumber(
    direction: animationMoveDirection
): void {
    switch (direction) {
        case "forward":
            //ha az utolso state-ben vagyunk nem megyünk már előre
            if (currentAnimationStateNumber === states!.length - 1) {
                return;
            }
            currentAnimationStateNumber++;
            break;
        case "backward":
            if (currentAnimationStateNumber === 0) {
                return;
            }
            currentAnimationStateNumber--;
            break;
    }
}
