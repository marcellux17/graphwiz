export const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;

export const editingPanel = document.querySelector<HTMLDivElement>("#modify-graph")!;

export const addEdgeButton = document.querySelector<HTMLButtonElement>("#add-edge")!;
export const addNodeButton = document.querySelector<HTMLButtonElement>("#add-node")!;
export const deleteModeButton = document.querySelector<HTMLButtonElement>("#delete-mode")!;
export const escapeModeButton = document.querySelector<HTMLButtonElement>("#escape-mode")!;
export const presetInput = document.querySelector<HTMLSelectElement>("#presets")!;

export const downloadGraphButton = document.querySelector<HTMLButtonElement>("#download-graph")!;
export const uploadGraphInput = document.querySelector<HTMLInputElement>("#graph-upload input")!;


export const playBox = document.querySelector<HTMLDivElement>("#play-box")!;
export const backButton = document.querySelector<HTMLButtonElement>("#back")!;
export const forwardButton = document.querySelector<HTMLButtonElement>("#forward")!;
export const pauseButton = document.querySelector<HTMLButtonElement>("#pause")!;
export const playButton = document.querySelector<HTMLButtonElement>("#play")!;
export const resetButton = document.querySelector<HTMLButtonElement>("#reset")!;
export const runAnimationButton = document.querySelector<HTMLButtonElement>("#run-animation")!;

export const messageBox = document.querySelector<HTMLDivElement>("#message-box")!;
export const label = document.querySelector<HTMLLabelElement>("#label-message")!;
export const weightInput = document.querySelector<HTMLInputElement>("#change-weight");
export const inputGroup = document.querySelector<HTMLDivElement>("#change-data")!;


export const toggleButtons = document.querySelectorAll<HTMLButtonElement>(".toggle");
export const toggleOpenButtons = document.querySelectorAll<HTMLElement>(".toggle-open");
export const toggleCloseButtons = document.querySelectorAll<HTMLElement>(".toggle-close");

export const speedRangeInput = document.querySelector<HTMLInputElement>("#speed-input")!;
export const speedInfo = document.querySelector<HTMLDivElement>("#speed-info")!;


export const pathInfoBox = document.querySelector<HTMLDivElement>("#path-info");
export const destinationNodeInfo = document.querySelector<HTMLDivElement>("#dest");
export const startingNodeInfo = document.querySelector<HTMLDivElement>("#start");
export const algorithmInfoBox = document.querySelector<HTMLDivElement>("#algorithm-info")!;

export const speedBox = document.querySelector<HTMLDivElement>("#speed-box")!;
export const algorithmInformationBox = document.querySelector<HTMLDivElement>("#algorithm-information-box")!;
