import { Node, Edge } from "vis-network";
import { DataSet, Network } from "vis-network/standalone";
import { undirectedGraph } from "./datastructures/graphs";

const container = document.querySelector<HTMLElement>("#container")!;
const addEdgeButton = document.querySelector<HTMLButtonElement>("#add-edge");
const focusButton = document.querySelector<HTMLButtonElement>("#focus-view");
const addNodeButton = document.querySelector<HTMLButtonElement>("#add-node");
const deleteModeButton =
    document.querySelector<HTMLButtonElement>("#delete-mode");
const escapeModeButton =
    document.querySelector<HTMLButtonElement>("#escape-mode");
const runAnimationButton =
    document.querySelector<HTMLButtonElement>("#run-animation");
const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;

const label = document.querySelector<HTMLLabelElement>("#label-message")!;
const labelInput = document.querySelector<HTMLInputElement>("#change-label")!;
const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;

//const messageForLabel = document.querySelector<HTMLParagraphElement>("#change-data .message-box")!;

//types
type canvasState =
    | "add-edge-mode"
    | "none"
    | "delete"
    | "add-node-mode"
    | "run-animation"
    | "step-by-step"
    | "animation-running";
// run-animation: to start animation vs. animation-running: animation is currently running

//GLOBAL VARIABLES
let selectedNode: string;
let canvas_state: canvasState = "none";

//animation
let interval: number;
let animationSpeed = 1000; //in ms
let animationSpeedChange = 1000; //in case the user wants to change the speed of the animation
let currentAnimationStateNumber = 0;
let visitedNodeColor = "rgb(57, 130, 81)";
let nodeColor = "rgb(127, 241, 165)";

const graph_nodes = new DataSet<Node>([]);
const graph_edges = new DataSet<Edge>([]);
const data = {
    nodes: graph_nodes,
    edges: graph_edges,
};
const options = {
    width: "700px",
    height: "700px",
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
            minimum: 50,
        },
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
    if (canvas_state === "animation-running") {
        return;
    }
    if (!(canvas_state === "none" || canvas_state === "run-animation")) {
        return;
    }
    selectedNode = e.nodes[0];
    if (canvas_state == "run-animation") {
        states = graph.DFS(selectedNode);
        console.log(states);
        changeCanvasState("animation-running");
        return;
    }
    const node = graph_nodes.get(selectedNode);
    inputGroup.classList.remove("hide");
    label.textContent = `Change label of the selected node`;
    labelInput.value = node?.label == undefined ? "" : node.label;
});

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

runAnimationButton?.addEventListener("click", (e) => {
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

function changeCanvasState(mode: canvasState): void {
    if (
        (canvas_state === "run-animation" ||
            canvas_state === "animation-running") &&
        mode !== "none" &&
        mode !== "animation-running"
    ) {
        //checks if we are currently in run-animation mode and we try to modify the graph
        return;
    }
    canvas_state = mode;
    let additionalmessage = "";
    switch (mode) {
        case "add-edge-mode":
            additionalmessage =
                "to create an edge click and drag from one node to the other";
            network.addEdgeMode();
            break;
        case "add-node-mode":
            additionalmessage = "click on a blank position to add node";
            network.addNodeMode();
            break;
        case "delete":
            additionalmessage = "select an element and click delete";
            network.deleteSelected();
            break;
        case "none":
            additionalmessage = "select mode on the toolbar";
            network.disableEditMode();
            break;
        case "run-animation":
            network.unselectAll();
            additionalmessage = "select a node to run animation";
            resetInput();
            network.disableEditMode();
            break;
        case "animation-running":
            additionalmessage = "animation currently running";
            runAnimation();
            network.disableEditMode();
            break;
    }
    messageBox.textContent = additionalmessage;
}
function resetInput(): void {
    selectedNode = "";
    label.textContent = "";
    labelInput.value = "";
    inputGroup.classList.add("hide");
    //   messageForLabel.classList.add('hidden')
}
function runAnimation(): void {
    if (states) {
        interval = setInterval(() => {
            if(currentAnimationStateNumber === states!.length){
                currentAnimationStateNumber = 0;
                clearInterval(interval)
                return;
            }
            //if animation speed has been altered by the user
            if (animationSpeed !== animationSpeedChange) {
                animationSpeed = animationSpeedChange;
                clearInterval(interval);
                runAnimation();
            } else {
                const currentState = states![currentAnimationStateNumber];
                ColorNodes(currentState);
                currentAnimationStateNumber++;
            }
        }, animationSpeed);
    }
}
function ColorNodes(state: Map<string, boolean>): void {
    for (const [nodeId, visited] of state) {
        graph_nodes.update({
            id: nodeId,
            color: visited ? visitedNodeColor : nodeColor,
        });
    }
}
