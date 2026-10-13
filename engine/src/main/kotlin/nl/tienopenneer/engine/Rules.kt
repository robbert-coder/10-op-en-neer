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

    /** Spelregels van 10 op en neer, los van tot hoeveel kaarten er gespeeld wordt. */
    private val tienRules: Boolean
        get() = wrongScoresZero && penaltyPerTrick == 0 && roundingAllowed && !mustTrump && pointsPerTrick == 1

    private val boerenRules: Boolean
        get() = penaltyPerTrick > 0 && !roundingAllowed && !mustTrump

    val isTienOpEnNeer: Boolean
        get() = maxCards == 10 && tienRules

    val isBoerenbridge: Boolean
        get() = maxCards == 13 && boerenRules

    /**
     * Soort spel, los van het aantal kaarten: "10openneer", "boerenbridge" of "hybride". De highscores en de
     * Hall of Fame hebben per soort een eigen lijst; zo hoeft de webpagina dat niet uit de naam af te leiden.
     */
    val variantKey: String
        get() = when {
            tienRules -> "10openneer"
            boerenRules -> "boerenbridge"
            else -> "hybride"
        }

    /**
     * Gaat het spel tot het hoogste aantal kaarten? Bij vijf spelers is dat 10 (52 kaarten), ook bij Boerenbridge.
     * Alleen volledige spellen tellen mee voor de sterren en de gewone highscorelijsten.
     */
    fun isFullGame(players: Int): Boolean {
        val most = 52 / players
        return when {
            tienRules -> maxCards == minOf(10, most)
            boerenRules -> maxCards == minOf(13, most)
            else -> maxCards == 10 || maxCards == 13 || maxCards == most
        }
    }

    /** Een korter spel (of bij vijf spelers bij Boerenbridge: tot 10) krijgt "tot ..." achter de naam. */
    val variantName: String
        get() = when {
            tienRules -> if (maxCards == 10) "10 op en neer" else "10 op en neer tot $maxCards"
            boerenRules -> if (maxCards == 13) "Boerenbridge" else "Boerenbridge tot $maxCards"
            else -> buildString {
                append("Hybride (")
                append(if (roundingAllowed) "r" else "nr")
                if (mustTrump) append(", iv")
                append(")")
                if (maxCards != 10 && maxCards != 13) append(" tot $maxCards")
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
