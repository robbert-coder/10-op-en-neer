package nl.tienopenneer.engine

import kotlin.math.abs

/**
 * Spelregels en puntentelling (in het origineel: OptiesType).
 */
data class Rules(
    /** Hoogste aantal kaarten per speler; het spel gaat van 1 op naar dit aantal en weer neer. */
    val maxCards: Int = 10,
    /** Punten per gehaalde slag bij een goede voorspelling (bovenop de 10). */
    val pointsPerTrick: Int = 1,
    /** Fout voorspeld levert 0 punten op (anders 10 min strafpunten). */
    val wrongScoresZero: Boolean = true,
    /** Strafpunten per slag verschil bij een foute voorspelling. */
    val penaltyPerTrick: Int = 0,
    /** Mag een rondescore negatief worden? */
    val negativeScores: Boolean = false,
    /** Mag de laatste voorspeller het totaal gelijk maken aan het aantal slagen? */
    val roundingAllowed: Boolean = true,
    /** Moet je introeven als je geen kleur kunt bekennen? */
    val mustTrump: Boolean = false,
) {
    init {
        require(maxCards in 1..13) { "maxCards moet tussen 1 en 13 liggen" }
    }

    val rounds: Int get() = 2 * maxCards - 1

    fun cardsInRound(round: Int): Int = -abs(round - maxCards) + maxCards

    val isTienOpEnNeer: Boolean
        get() = maxCards == 10 && wrongScoresZero && penaltyPerTrick == 0 &&
            roundingAllowed && !mustTrump && pointsPerTrick == 1

    val isBoerenbridge: Boolean
        get() = maxCards == 13 && penaltyPerTrick > 0 && !roundingAllowed && !mustTrump

    val variantName: String
        get() = when {
            isTienOpEnNeer -> "10 op en neer"
            isBoerenbridge -> "Boerenbridge"
            else -> buildString {
                append("Hybride (")
                append(if (roundingAllowed) "r" else "nr")
                if (mustTrump) append(", iv")
                append(")")
            }
        }

    companion object {
        val TIEN_OP_EN_NEER = Rules(
            maxCards = 10,
            pointsPerTrick = 1,
            wrongScoresZero = true,
            penaltyPerTrick = 0,
            negativeScores = false,
            roundingAllowed = true,
            mustTrump = false,
        )

        val BOERENBRIDGE = Rules(
            maxCards = 13,
            pointsPerTrick = 3,
            wrongScoresZero = false,
            penaltyPerTrick = 3,
            negativeScores = false,
            roundingAllowed = false,
            mustTrump = false,
        )
    }
}
