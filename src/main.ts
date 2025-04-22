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
const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;

const label = document.querySelector<HTMLLabelElement>("#label-message")!;
const labelInput = document.querySelector<HTMLInputElement>("#change-label")!;
const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;
//const messageForLabel = document.querySelector<HTMLParagraphElement>("#change-data .message-box")!;
const visualizeGraph =
    document.querySelector<HTMLButtonElement>("#visualize-graph");
visualizeGraph?.addEventListener("click", () => {
    graph.PrintGraph();
});
//types
type editMode = "add-edge-mode" | "none" | "delete" | "add-node-mode";

//GLOBAL VARIABLES
let selectedNode: string;
let edit_mode: editMode = "none";

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
        color: "rgb(127, 241, 165)",
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
            changeMode("add-edge-mode");
        },
        addNode: function (nodeData: Node, callback: Function) {
            const { id, label } = graph.AddNode();
            nodeData.id = id;
            nodeData.label = label;
            callback(nodeData);
            changeMode("add-node-mode");
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
//events on the network
network.on("selectNode", (e) => {
    if (edit_mode !== "none") {
        return;
    }
    selectedNode = e.graph_nodes[0];
    const node = graph_nodes.get(selectedNode);
    inputGroup.classList.remove("hide");
    label.textContent = `Change label of the selected node`;
    labelInput.value = node?.label == undefined ? "" : node.label;
});
network.on("deselectNode", () => {
    resetInput();
});
addEdgeButton?.addEventListener("click", () => {
    changeMode("add-edge-mode");
});
addNodeButton?.addEventListener("click", () => {
    changeMode("add-node-mode");
});
focusButton?.addEventListener("click", () => {
    network.fit();
});
deleteModeButton?.addEventListener("click", () => {
    changeMode("delete");
});
escapeModeButton?.addEventListener("click", () => {
    changeMode("none");
});
labelInput.addEventListener("input", () => {
    const new_label = labelInput.value;
    graph.ModifyLabel(selectedNode, new_label);
    graph_nodes.update({
        id: selectedNode,
        label: new_label,
    });
});

function changeMode(mode: editMode) {
    edit_mode = mode;
    let additionalmessage;
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
            additionalmessage = "click on an edge or a node to delete it";
            network.deleteSelected();
            break;
        case "none":
            additionalmessage = `select mode on the toolbar`;
            network.disableEditMode();
            break;
    }
    messageBox.textContent = additionalmessage;
}
function resetInput() {
    selectedNode = "";
    label.textContent = "";
    labelInput.value = "";
    inputGroup.classList.add("hide");
    //   messageForLabel.classList.add('hidden')
}
