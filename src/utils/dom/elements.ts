export const canvas:HTMLCanvasElement = document.querySelector<HTMLCanvasElement>("#canvas")!;
//editing buttons
export const addEdgeButton = document.querySelector<HTMLButtonElement>("#add-edge");
export const addNodeButton = document.querySelector<HTMLButtonElement>("#add-node");
export const deleteModeButton = document.querySelector<HTMLButtonElement>("#delete-mode");
export const escapeModeButton = document.querySelector<HTMLButtonElement>("#escape-mode");
export const presetInput = document.querySelector<HTMLSelectElement>("#presets");

//animation related elements
export const playBox = document.querySelector<HTMLDivElement>("#play-box");
export const backButton = document.querySelector<HTMLButtonElement>("#back");
export const forwardButton = document.querySelector<HTMLButtonElement>("#forward");
export const pauseButton = document.querySelector<HTMLButtonElement>("#pause");
export const playButton = document.querySelector<HTMLButtonElement>("#play");
export const resetButton = document.querySelector<HTMLButtonElement>("#reset");
export const runAnimationButton = document.querySelector<HTMLButtonElement>("#run-animation");
//displaying feedback for the user
export const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;

//for changing the label of a graph: either the weight or the label of a node
export const label = document.querySelector<HTMLLabelElement>("#label-message")!;
export const weightInput = document.querySelector<HTMLInputElement>("#change-weight")!;
export const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;

//toggle
export const toggleButtons = document.querySelectorAll<HTMLButtonElement>(".toggle");
export const toggleOpenButtons = document.querySelectorAll<HTMLElement>(".toggle-open");
export const toggleCloseButtons = document.querySelectorAll<HTMLElement>(".toggle-close");

//speed changing elements selected from speed-box
export const speedRangeInput = document.querySelector<HTMLInputElement>("#speed-input");
export const speedInfo = document.querySelector<HTMLDivElement>("#speed-info")!;

//source destination box for displaying starting node and destination node
export const pathInfoBox = document.querySelector<HTMLDivElement>("#path-info");
export const destinationNodeInfo = document.querySelector<HTMLDivElement>("#dest");
export const startingNodeInfo = document.querySelector<HTMLDivElement>("#start");
export const algorithmInfoBox = document.querySelector<HTMLDivElement>("#algorithm-info")!;