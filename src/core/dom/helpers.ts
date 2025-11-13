import { inputGroup, label, weightInput, messageBox } from "./elements";

export function makeVisible(element: HTMLElement): void {
    element.classList.remove("hide");
}
export function makeInvisible(element: HTMLElement): void {
    element.classList.add("hide");
}
export function changeMessageBox(newMessage: string): void {
    messageBox.textContent = newMessage;
}
export function resetWeightChangeInput(): void {
    label!.textContent = "";
    weightInput!.value = "";
    makeInvisible(inputGroup);
}
