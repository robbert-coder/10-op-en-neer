// Kleine hulpjes voor de pagina, door alle schermen gebruikt.

export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

/** Tekst veilig in HTML zetten: namen en chat van anderen mogen nooit als code werken. */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** De Android-app (een brug naar delen, meldingen en de versie), of null op de website. */
export const nativeApp = globalThis.window?.TienApp ?? null;
