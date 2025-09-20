import { toggleButtons, toggleCloseButtons, toggleOpenButtons, } from "./elements";
import { makeInvisible, makeVisible } from "./helpers";

toggleCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const toggleOpenPair = button.parentElement!.querySelector<HTMLElement>(".toggle-open");
        const infoBox = button.parentElement!.parentElement!.querySelector<HTMLElement>( ".box-information" );
        makeVisible(toggleOpenPair);
        makeInvisible(button);
        makeInvisible(infoBox);
    });
});
toggleOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const toggleClosePair = button.parentElement!.querySelector<HTMLElement>(".toggle-close");
        const infoBox = button.parentElement!.parentElement!.querySelector<HTMLElement>( ".box-information" );
        makeVisible(toggleClosePair);
        makeInvisible(button);
        makeVisible(infoBox);
    });
});
toggleButtons.forEach((button) => {
    button.addEventListener("mouseover", () => {
        const tooltip = button.parentElement?.querySelector<HTMLElement>(".tooltip");
        makeVisible(tooltip);
    });
    button.addEventListener("mouseleave", () => {
        const tooltip = button.parentElement?.querySelector<HTMLElement>(".tooltip");
        makeInvisible(tooltip);
    });
});
