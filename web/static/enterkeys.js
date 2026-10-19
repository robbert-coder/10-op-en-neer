// Wat Enter doet in een los invulveld (zonder formulier), bijvoorbeeld je naam. Zonder dit gebeurt er niets,
// terwijl je op een computer gewend bent dat Enter je verder helpt.

/**
 * De doelen uit een data-enter-attribuut lezen: een rij van selectors, gescheiden door komma's, eventueel
 * met "click:" ervoor (dan wordt de knop ingedrukt in plaats van alleen geselecteerd).
 * Nodig zodat elk veld in index.html zelf zegt waar Enter heen gaat.
 */
export function parseEnterTargets(spec) {
  if (typeof spec !== "string") return [];
  return spec.split(",").map((part) => part.trim()).filter(Boolean).map((part) =>
    part.startsWith("click:") ? { selector: part.slice(6).trim(), click: true } : { selector: part, click: false });
}

/**
 * Het eerste doel dat bestaat en zichtbaar is, of null (dan sluit Enter alleen het veld af).
 * Nodig omdat sommige doelen alleen soms te zien zijn, zoals de naam van een openbare tafel.
 */
export function pickEnterTarget(targets, find, isVisible) {
  for (const target of targets) {
    const el = find(target.selector);
    if (el && isVisible(el)) return { el, click: target.click };
  }
  return null;
}
