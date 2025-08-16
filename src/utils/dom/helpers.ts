import { inputGroup, label, weightInput, messageBox } from "./elements";

export function makeVisible(element: HTMLElement | undefined | null): void {
    if (element) element.classList.remove("hide");
}
export function makeInvisible(element: HTMLElement | undefined | null): void {
    if (element) element.classList.add("hide");
}

export function changeMessageBox(newMessage: string): void {
    messageBox.textContent = newMessage;
}
export function resetInput(): void {
    label.textContent = "";
    weightInput.value = "";
    makeInvisible(inputGroup);
}
