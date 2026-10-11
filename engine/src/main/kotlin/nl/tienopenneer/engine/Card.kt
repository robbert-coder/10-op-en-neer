package nl.tienopenneer.engine

/**
 * Een speelkaart.
 *
 * [suit]: 1 = klaver, 2 = ruiten, 3 = schoppen, 4 = harten (0 = geen kaart).
 * [rank]: 2..10, 11 = boer, 12 = vrouw, 13 = heer, 14 = aas (0 = geen kaart).
 */
data class Card(val suit: Int, val rank: Int) {
    val isNone: Boolean get() = rank == 0

    /** Compacte code, handig voor opslaan: 100 * kleur + getal. */
    val code: Int get() = 100 * suit + rank

    override fun toString(): String = if (isNone) "-" else suitName(suit) + rankName(rank)

    companion object {
        val NONE = Card(0, 0)

        const val CLUBS = 1
        const val DIAMONDS = 2
        const val SPADES = 3
        const val HEARTS = 4

        fun fromCode(code: Int) = Card(code / 100, code % 100)

        fun suitName(suit: Int): String = when (suit) {
            CLUBS -> "klaver"
            DIAMONDS -> "ruiten"
            SPADES -> "schoppen"
            HEARTS -> "harten"
            else -> ""
        }

        fun rankName(rank: Int): String = when (rank) {
            2 -> "twee"
            3 -> "drie"
            4 -> "vier"
            5 -> "vijf"
            6 -> "zes"
            7 -> "zeven"
            8 -> "acht"
            9 -> "negen"
            10 -> "tien"
            11 -> "boer"
            12 -> "vrouw"
            13 -> "heer"
            14 -> "aas"
            else -> ""
        }

        /** Korte aanduiding zoals op de kaart: 2..10, B, V, H, A. */
        fun rankLabel(rank: Int): String = when (rank) {
            11 -> "B"
            12 -> "V"
            13 -> "H"
            14 -> "A"
            else -> rank.toString()
        }

        fun suitSymbol(suit: Int): String = when (suit) {
            CLUBS -> "♣"
            DIAMONDS -> "♦"
            SPADES -> "♠"
            HEARTS -> "♥"
            else -> ""
        }

        fun isRed(suit: Int) = suit == DIAMONDS || suit == HEARTS
    }
}
