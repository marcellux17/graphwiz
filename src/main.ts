import { Node, Edge } from "vis-network";
import { DataSet, Network } from "vis-network/standalone";

const container = document.querySelector<HTMLElement>("#container")!;
const addEdgeButton = document.querySelector<HTMLButtonElement>("#add-edge");
const focusButton = document.querySelector<HTMLButtonElement>("#focus-view");
const addNodeButton = document.querySelector<HTMLButtonElement>("#add-node");
const deleteModeButton = document.querySelector<HTMLButtonElement>("#delete-mode");
const escapeModeButton = document.querySelector<HTMLButtonElement>("#escape-mode");
let messageBox = document.querySelector<HTMLDivElement>("#message-box")!;
let canvas: HTMLCanvasElement;

//types
type editMode = "add-edge-mode" | "none" | "delete" | "add-node-mode"

//GLOBAL FLAGS
let edit_mode: editMode = "none";

const nodes = new DataSet<Node>([
    { id: 1, label: "N 1" },
    { id: 2, label: "N 2" },
    { id: 3, label: "N 3" },
    { id: 4, label: "N 4" },
]);

const edges = new DataSet<Edge>([
    { from: 1, to: 3, id: 123 },
    { from: 1, to: 2 },
    { from: 2, to: 4 },
    { from: 2, to: 4 },
]);
const data = {
    nodes: nodes,
    edges: edges,
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
            if (edgeData.from !== edgeData.to) {
                callback(edgeData);
            }
            changeMode('add-edge-mode')
        },
        addNode: function (nodeData: Node, callback: Function) {
            callback(nodeData);
            changeMode('add-node-mode')
        },
    },
};

const network = new Network(container, data, options);

let selectNode: number | undefined;
//events on the network
network.on("selectNode", (e) => {
    selectNode = e.nodes[0];
});

edges.add({
    from: 1,
    to: 10,
});
addEdgeButton?.addEventListener("click", () => {
    changeMode('add-edge-mode')
});
addNodeButton?.addEventListener("click", () => {
    changeMode('add-node-mode')
});
focusButton?.addEventListener("click", () => {
    network.fit();
});
deleteModeButton?.addEventListener("click", () => {
    changeMode('delete')
});
escapeModeButton?.addEventListener("click", () => {
  changeMode('none')
})

//mutation observer for displaying editing modes and messages on canvas
const observer = new MutationObserver((mutations, obs) => {
    const c = container.querySelector("canvas");
    if (c) {
        canvas = c;
        obs.disconnect();
    }
});
observer.observe(container, {
    childList: true,
    subtree: true,
});

function changeMode(mode:editMode){
  edit_mode = mode
  let additionalmessage
  switch(mode){
    case 'add-edge-mode':
      additionalmessage = 'to create an edge click and drag from one node to the other'
      network.addEdgeMode();
      break;
    case 'add-node-mode':
      additionalmessage = 'click on a blank position to add node'
      network.addNodeMode();
      break;
    case 'delete':
      additionalmessage = 'click on an edge or a node to delete it'
      network.deleteSelected();
      break;
    case 'none':
      additionalmessage = `messages will appear here`
      network.disableEditMode();
      break;
  }
  messageBox.textContent = additionalmessage;
}