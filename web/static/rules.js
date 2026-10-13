// Spelregels aan de kant van de webpagina: de standaardregels, een spel maken in de spelmotor en de naam van
// een spelsoort. De regels zelf staan in de spelcode (Kotlin, Rules.kt); hier alleen wat het scherm nodig heeft.
import { WebGame, variantName as engineVariantName } from "./tienopenneer.mjs";

/** Standaardregels voor het scherm Nieuw spel; gelijk aan Rules.TIEN_OP_EN_NEER in de spelcode. */
export const TIEN_OP_EN_NEER = Object.freeze({
  maxCards: 10, pointsPerTrick: 1, wrongScoresZero: true, penaltyPerTrick: 0,
  negativeScores: false, roundingAllowed: true, mustTrump: false,
});
/** Gelijk aan Rules.BOERENBRIDGE in de spelcode. */
export const BOERENBRIDGE = Object.freeze({
  maxCards: 13, pointsPerTrick: 3, wrongScoresZero: false, penaltyPerTrick: 3,
  negativeScores: false, roundingAllowed: false, mustTrump: false,
});

/**
 * Een spel maken in de spelmotor (Kotlin, via WebGame). Met namen in plaats van veertien losse waarden op
 * volgorde, zodat er niet per ongeluk twee worden verwisseld.
 * - rules: de regels (met players, 2 tot 5); smart: sterke computerspelers
 * - seed: beginwaarde van het schudden; names: namen per stoel; actions: biedingen en kaarten van mensen tot nu toe
 * - humanSeats: stoelen waar een mens zit; viewSeat: de stoel van dit apparaat (komt onderaan in beeld)
 */
export function createGame({ rules, smart, seed, names, actions = [], humanSeats = [1], viewSeat = 1 }) {
  return new WebGame(
    rules.maxCards, rules.pointsPerTrick, rules.wrongScoresZero, rules.penaltyPerTrick,
    rules.negativeScores, rules.roundingAllowed, rules.mustTrump, smart,
    seed, names, actions, humanSeats, viewSeat, rules.players ?? 4,
  );
}

/** Naam van de spelsoort ("10 op en neer", "Boerenbridge tot 7"), zoals de spelcode die ook geeft. */
export const variantName = (rules) => engineVariantName(
  rules.maxCards, rules.pointsPerTrick, rules.wrongScoresZero, rules.penaltyPerTrick, rules.roundingAllowed, rules.mustTrump,
);

/** Hoogste aantal kaarten dat kan: 52 kaarten moeten genoeg zijn voor iedereen. */
export const maxCardsFor = (base, players) => Math.min(base.maxCards, Math.floor(52 / players));
