import { Node, Edge } from "vis-network";
import { DataSet, Network } from "vis-network/standalone";
import { undirectedGraph, stateType, EdgeSelectState } from "./datastructures/graphs";

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
const animationBox = document.querySelector<HTMLDivElement>("#animation-box");
const backButton = document.querySelector<HTMLButtonElement>("#back");
const forwardButton = document.querySelector<HTMLButtonElement>("#forward");
const pauseButton = document.querySelector<HTMLButtonElement>("#pause");
const playButton = document.querySelector<HTMLButtonElement>("#play");
const resetButton = document.querySelector<HTMLButtonElement>("#reset");
const RunAnimationButton =
    document.querySelector<HTMLButtonElement>("#run-animation");
//displaying feedback for the user
const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;

//for changing the label of a graph
const label = document.querySelector<HTMLLabelElement>("#label-message")!;
const labelInput = document.querySelector<HTMLInputElement>("#change-label")!;
const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;

//const messageForLabel = document.querySelector<HTMLParagraphElement>("#change-data .message-box")!;

//speed changing elements selected from speed-box
const toggleSpeedButton =
    document.querySelector<HTMLButtonElement>("#toggle-speed");
const openSpeedRangeInputButton =
    document.querySelector<HTMLButtonElement>("#open-speed");
const hideSpeedRangeInputButton =
    document.querySelector<HTMLButtonElement>("#hide-speed");
const speedRangeInput =
    document.querySelector<HTMLInputElement>("#speed-input");
const speedInfo = document.querySelector<HTMLDivElement>("#speed-info")!;

//source destination box for displaying starting node and destination node
const pathInfoBox = document.querySelector<HTMLDivElement>("#path-info");
const destinationNodeInfo = document.querySelector<HTMLDivElement>("#dest");
const startingNodeInfo = document.querySelector<HTMLDivElement>("#start");

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
type selectionTye = "node" | "edge";
// run-animation: to start animation vs. animation-running: animation is currently running
// none is set when we click the escape button

//GLOBAL VARIABLES
let selectedElementId: string;
let canvas_state: canvasState = "none";
let selectedElement: selectionTye;
let startingNode: string | undefined;
let destinationNode: string | undefined;

//animation
let interval: number;
let animationSpeed = 1000; //in ms
let animationSpeedChange = 1000; //in case the user wants to change the speed of the animation
let currentAnimationStateNumber = -1; //in the animation function it first increments so it does not point to a negative index of the states
let nodeColor = "white";
let pathColor = "#2ade51";
let currentAnimationState: animationState = "running";
let prevState:stateType;

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
        selectConnectedEdges: false,
    },
    nodes: {
        borderWidth: 3,
        shape: "circle",
        color: {
            border: "black",
            background: nodeColor,
            highlight: {
                border: "black",
                background: nodeColor,
            },
        },
        widthConstraint: {
            minimum: 50,
        },
        font: "20px arial black",
    },
    edges: {
        smooth: false,
        width: 2,
        selectionWidth: 3,
        font: {
            size: 20,
            color: "#000",
            align: "top",
        },
    },
    manipulation: {
        enabled: false,
        addEdge: function (edgeData: Edge, callback: Function) {
            const from = edgeData.from as string;
            const to = edgeData.to as string;
            if (from !== to) {
                let id: string;
                let weight = Math.floor(Math.random() * 5) + 1;
                id = graph.AddEdge(from, to, weight);
                edgeData.id = id;
                edgeData.label = `${weight}`;
                callback(edgeData);
            }
            ChangeCanvasState("add-edge-mode");
        },
        addNode: function (nodeData: Node, callback: Function) {
            const { id, label } = graph.AddNode();
            nodeData.id = id;
            nodeData.label = label;
            callback(nodeData);
            ChangeCanvasState("add-node-mode");
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
            ResetInput();
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
let states: stateType[] | undefined;

//events on the network
network.on("selectNode", (e) => {
    //we don't do anything while animation is running
    if (canvas_state === "animation-running") {
        return;
    }
    if (!(canvas_state === "none" || canvas_state === "run-animation")) {
        return;
    }
    selectedElement = "node";
    selectedElementId = e.nodes[0];
    //if a node was selected in run-animation state we run the algorithm and then return
    if (canvas_state == "run-animation") {
        //changing canvas_state to animation-running happens only here
        if (!startingNode) {
            startingNode = selectedElementId;
            ChangeMessageBox("choose destination node");
            startingNodeInfo!.textContent = `start: ${graph.GetLabelOfNode(
                startingNode
            )}`;
            network.unselectAll();
        } else {
            destinationNode = selectedElementId;
            if(destinationNode == startingNode){
                ChangeMessageBox("choose destination node");
                return;
            }
            const connected = graph.AreConnected(startingNode, destinationNode);
            if (connected) {
                destinationNodeInfo!.textContent = `dest: ${graph.GetLabelOfNode(
                    destinationNode
                )}`;
                states = graph.Dijkstra(startingNode, destinationNode);
                ChangeCanvasState("animation-running");
            } else {
                ChangeMessageBox(
                    "no path from starting node to destination node, choose another destination node"
                );
            }
        }
        return;
    }
    const node = graph_nodes.get(selectedElementId);
    MakeVisible(inputGroup);
    label.textContent = `Change label of the selected node`;
    labelInput.value = node?.label == undefined ? "" : node.label;
});
network.on("selectEdge", (e) => {
    //so that we don't do anything while animation is running
    if (canvas_state === "animation-running") {
        return;
    }
    if (!(canvas_state === "none" || canvas_state === "run-animation")) {
        return;
    }
    selectedElement = "edge";
    selectedElementId = e.edges[0];
    MakeVisible(inputGroup);
    label.textContent = `Change weight of the selected edge`;
    labelInput.value = `${graph.GetEdgeWeight(selectedElementId)}`;
});
//speed changing related events
toggleSpeedButton?.addEventListener("mouseover", () => {
    const tooltip =
        toggleSpeedButton.parentElement?.querySelector<HTMLElement>(".tooltip");
    MakeVisible(tooltip);
});
toggleSpeedButton?.addEventListener("mouseleave", () => {
    const tooltip =
        toggleSpeedButton.parentElement?.querySelector<HTMLElement>(".tooltip");
    MakeInvisible(tooltip);
});
speedRangeInput?.addEventListener("input", () => {
    let newspeed = Number.parseInt(speedRangeInput.value);
    speedInfo.textContent = `speed: ${newspeed}x`;
    animationSpeedChange = 1000 / newspeed;
});
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
    ResetInput();
});
network.on("deselectEdge", () => {
    ResetInput();
});

addEdgeButton?.addEventListener("click", () => {
    ChangeCanvasState("add-edge-mode");
});

addNodeButton?.addEventListener("click", () => {
    ChangeCanvasState("add-node-mode");
});

focusButton?.addEventListener("click", () => {
    network.fit();
});

deleteModeButton?.addEventListener("click", () => {
    ChangeCanvasState("delete");
});

escapeModeButton?.addEventListener("click", () => {
    ChangeCanvasState("none");
});

RunAnimationButton?.addEventListener("click", () => {
    ChangeCanvasState("run-animation");
});

labelInput.addEventListener("input", () => {
    const new_label = labelInput.value;
    if (selectedElement == "node") {
        graph.ModifyLabelOfNode(selectedElementId, new_label);
        graph_nodes.update({
            id: selectedElementId,
            label: new_label,
        });
    } else {
        graph.ModifyWeight(selectedElementId, Number.parseInt(new_label));
        graph_edges.update({
            id: selectedElementId,
            label: new_label,
        });
    }
});
//animation box state changes
resetButton?.addEventListener("click", () => {
    ChangeAnimationState("paused");
    clearInterval(interval);
    MakeInvisible(pauseButton);
    MakeVisible(playButton);
    ResetNodes();
});
pauseButton?.addEventListener("click", () => {
    ChangeAnimationState("paused");
    clearInterval(interval);
    MakeInvisible(pauseButton);
    MakeVisible(playButton);
});
forwardButton?.addEventListener("click", () => {
    if (currentAnimationState === "paused") {
        clearInterval(interval);
        ChangeCurrentAnimationStateNumber("forward");
    }
});
backButton?.addEventListener("click", () => {
    if (currentAnimationState === "paused") {
        clearInterval(interval);
        ChangeCurrentAnimationStateNumber("backward");
    }
});
playButton?.addEventListener("click", () => {
    ChangeAnimationState("running");
    RunAnimation();
    MakeInvisible(playButton);
    MakeVisible(pauseButton);
});
function ColorNode(id: string, color: string):void {
    graph_nodes.update({
        id: id,
        color: {
            border: "black",
            background: color,
            highlight: {
                border: "black",
                background: color,
            },
        },
    });
}
function ColorEdge(edgeId: string, color: string, width: number|undefined):void{
    graph_edges.update({
        id: edgeId,
        color: {
            color: color,
            highlight: "black"
        },
        width: width ? width : 1
    })
}
function ChangeAnimationState(state: animationState): void {
    currentAnimationState = state;
    ChangeMessageBox(currentAnimationState);
}
function ChangeCanvasState(mode: canvasState): void {
    if (
        (canvas_state === "run-animation" ||
            canvas_state === "animation-running") &&
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
            if (
                prev_canvas_state === "run-animation" ||
                prev_canvas_state === "animation-running"
            ) {
                startingNode = undefined;
                destinationNode = undefined;
                ResetNodes();
                ChangeLabelsBack();
            }
            ChangeMessageBox("select mode on the toolbar");
            network.disableEditMode();
            MakeInvisible(animationBox);
            MakeInvisible(pathInfoBox);
            startingNodeInfo!.textContent = "start: ";
            destinationNodeInfo!.textContent = "dest: ";
            break;
        case "run-animation":
            network.unselectAll();
            ChangeMessageBox("select a starting node");
            MakeVisible(pathInfoBox);
            ResetInput();
            network.disableEditMode();
            break;
        case "animation-running":
            ChangeLabels();
            ChangeAnimationState("running");
            network.unselectAll();
            MakeVisible(animationBox);
            MakeInvisible(playButton);
            MakeVisible(pauseButton);
            RunAnimation();
            network.disableEditMode();
            break;
    }
}
function ResetInput(): void {
    selectedElementId = "";
    label.textContent = "";
    labelInput.value = "";
    MakeInvisible(inputGroup);
    //   messageForLabel.classList.add('hidden')
}
//runs animation on the return value of the selected graph algorithm
//checks for userinput changes to change speed (have not yet been added)
function RunAnimation(): void {
    if (states) {
        interval = setInterval(() => {
            //if animation speed has been altered by the user
            if (animationSpeed !== animationSpeedChange) {
                animationSpeed = animationSpeedChange;
                clearInterval(interval);
                RunAnimation();
            } else {
                ChangeCurrentAnimationStateNumber("forward");
                const currentState = states![currentAnimationStateNumber];
                AnimateState(currentState);
                //if animation finished running
                if (currentAnimationStateNumber === states!.length - 1) {
                    clearInterval(interval);
                    ChangeAnimationState("paused");
                    MakeInvisible(pauseButton);
                    MakeVisible(playButton);
                    return;
                }
            }
        }, animationSpeed);
    }
}
function ChangeLabelsBack(): void {
    graph_nodes.forEach((node, id) => {
        if (id !== startingNode) {
            const label = graph.GetLabelOfNode(id as string);
            graph_nodes.update({
                id,
                label: label,
            });
        }
    });
}
function ChangeLabels(): void {
    graph_nodes.forEach((node, id) => {
        if (id !== startingNode) {
            const label = graph.GetLabelOfNode(id as string);
            ChangeLabel(id as string, label + " " + "(∞)")
        }
    });
}
function ChangeLabel(id: string, label: string):void{
    graph_nodes.update({
        id,
        label: label,
    });
}
//for reverting back to state 0 of animation states
function ResetNodes(): void {
    currentAnimationStateNumber = -1;
    graph_nodes.forEach((node, id) => {
        ColorNode(id as string, nodeColor);
    });
    graph_edges.forEach((edge, id) => {
        ColorEdge(id as string, "black", 2);
    })
    ChangeLabels();
}
function MakeVisible(element: HTMLElement | undefined | null): void {
    if (element) element.classList.remove("hide");
}
function MakeInvisible(element: HTMLElement | undefined | null): void {
    if (element) element.classList.add("hide");
}

function ChangeMessageBox(new_message: string): void {
    messageBox.textContent = new_message;
}
function ChangeCurrentAnimationStateNumber(direction: animationMoveDirection): void {
    switch (direction) {
        case "forward":
            //ha az utolso state-ben vagyunk nem megyünk már előre
            if (currentAnimationStateNumber === states!.length - 1) {
                return;
            }
            currentAnimationStateNumber++;
            break;
        case "backward":
            if (currentAnimationStateNumber <= 0) {
                return;
            }
            currentAnimationStateNumber--;
            break;
    }
}
function AnimateState(currentState: stateType):void {
    if(prevState && prevState.type === "EdgeSelect"){
        //setting previously visited edge color back
        ColorEdge((prevState as EdgeSelectState).id, "black", 2)
    }
    switch(currentState.type){
        case "EdgeSelect":
            ColorEdge(currentState.id, "blue", 3)
            break;
        case "EstimatedDistanceUpdate":
            UpdateDistance(currentState.nodeId, currentState.newDistance)
            break;
        case "VisitNode":
            ColorNode(currentState.id, "orange");
            break;
        case "PathHighlight":
            currentState.nodesInPath.forEach((nodeId) => {
                ColorNode(nodeId, pathColor);
            })
            currentState.edgesInPath.forEach((edgeId) => {
                ColorEdge(edgeId, pathColor, 3);
            })
            break;
    }
    prevState = states![currentAnimationStateNumber];
}

function UpdateDistance(nodeId: string, distance: number):void {
    let labelOfNode = graph.GetLabelOfNode(nodeId);
    let newLabel = `${labelOfNode} (${distance})`
    ChangeLabel(nodeId, newLabel)
}

