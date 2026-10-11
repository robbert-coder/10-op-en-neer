@file:OptIn(ExperimentalJsExport::class)

package nl.tienopenneer.web

import nl.tienopenneer.engine.Card
import nl.tienopenneer.engine.Game
import nl.tienopenneer.engine.Phase
import nl.tienopenneer.engine.Rules

/**
 * Brug tussen de spelcode en de webpagina. Alle gegevens gaan als eenvoudige getallen en tekst,
 * en de toestand van het spel als JSON, zodat de pagina geen Kotlin-objecten hoeft te kennen.
 */
@JsExport
class WebGame(
    maxCards: Int,
    pointsPerTrick: Int,
    wrongScoresZero: Boolean,
    penaltyPerTrick: Int,
    negativeScores: Boolean,
    roundingAllowed: Boolean,
    mustTrump: Boolean,
    smart: Boolean,
    seed: Double,
    names: Array<String>,
    actions: Array<Int>,
) {
    private val game: Game = Game.restore(
        Rules(maxCards, pointsPerTrick, wrongScoresZero, penaltyPerTrick, negativeScores, roundingAllowed, mustTrump),
        seed.toLong(),
        names.toList(),
        actions.toList(),
        smart,
    )

    val seed: Double get() = game.seed.toDouble()

    fun actions(): Array<Int> = game.humanActions.toTypedArray()

    fun setPlayerName(name: String) {
        game.player(1).name = name
    }

    fun advance(): Boolean = game.advance()

    /** Geeft een foutmelding, of null als de voorspelling is gedaan. */
    fun bid(n: Int): String? = game.humanBid(n)

    /** Geeft een foutmelding, of null als de kaart is opgelegd. */
    fun play(code: Int): String? = game.humanPlay(Card.fromCode(code))

    fun hintBid(): Int = game.hintBid()

    /** Code van de kaart die de computer zou spelen, of 0. */
    fun hintCard(): Int = game.hintCard()?.code ?: 0

    /** Namen van de geluiden sinds de vorige aanroep, bijvoorbeeld "GOED_VOORSPELD". */
    fun takeSounds(): Array<String> = game.takeSounds().map { it.name }.toTypedArray()

    fun state(): String {
        val g = game
        val r = g.rules
        val legal = g.legalCardsForHuman().map { it.code }.toSet()
        val sb = StringBuilder()
        sb.append('{')
        sb.append("\"variant\":").append(str(r.variantName))
        sb.append(",\"isTienOpEnNeer\":").append(r.isTienOpEnNeer)
        sb.append(",\"round\":").append(g.round)
        sb.append(",\"rounds\":").append(r.rounds)
        sb.append(",\"cards\":").append(g.cardsThisRound)
        sb.append(",\"trump\":").append(g.trump.code)
        sb.append(",\"phase\":").append(str(g.phase.name))
        sb.append(",\"leader\":").append(g.leader)
        sb.append(",\"active\":").append(
            when (g.phase) {
                Phase.BIDDING -> g.toBid
                Phase.PLAYING -> g.toPlay
                else -> 0
            },
        )
        sb.append(",\"status\":").append(str(g.status))
        sb.append(",\"tricksOver\":").append(str(g.tricksOverText()))
        sb.append(",\"forbiddenBid\":").append(g.forbiddenHumanBid() ?: -1)
        sb.append(",\"trickWinner\":").append(g.trickWinner)
        sb.append(",\"lastTrickWinner\":").append(g.lastTrickWinner)
        sb.append(",\"table\":").append(list((1..4).map { g.tableCard(it).code }))
        sb.append(",\"lastTrick\":").append(list((1..4).map { g.lastTrickCard(it).code }))
        sb.append(",\"hand\":[")
        g.player(1).handCards().forEachIndexed { i, c ->
            if (i > 0) sb.append(',')
            sb.append("{\"code\":").append(c.code).append(",\"legal\":").append(c.code in legal).append('}')
        }
        sb.append(']')
        sb.append(",\"players\":[")
        for (nr in 1..4) {
            val pl = g.player(nr)
            if (nr > 1) sb.append(',')
            sb.append("{\"name\":").append(str(pl.name))
            sb.append(",\"bid\":").append(pl.bid)
            sb.append(",\"tricks\":").append(pl.tricks)
            sb.append(",\"cardCount\":").append(pl.cardCount)
            sb.append(",\"total\":").append(pl.total)
            sb.append(",\"rank\":").append(pl.rank)
            sb.append(",\"rounds\":[")
            for (rd in 1..r.rounds) {
                if (rd > 1) sb.append(',')
                sb.append('[').append(pl.bidForRound(rd)).append(',').append(pl.tricksForRound(rd))
                    .append(',').append(pl.scoreForRound(rd)).append(',').append(pl.crossedForRound(rd))
                    .append(',').append(pl.goodForRound(rd)).append(']')
            }
            sb.append("]}")
        }
        sb.append("]}")
        return sb.toString()
    }

    private fun list(values: List<Int>) = values.joinToString(",", "[", "]")

    private fun str(s: String): String {
        val sb = StringBuilder("\"")
        for (ch in s) {
            when {
                ch == '"' -> sb.append("\\\"")
                ch == '\\' -> sb.append("\\\\")
                ch < ' ' -> sb.append(' ')
                else -> sb.append(ch)
            }
        }
        return sb.append('"').toString()
    }
}

/** Kaartnamen voor de pagina, uit dezelfde bron als de app. */
@JsExport
fun describeCard(code: Int): String {
    val c = Card.fromCode(code)
    return "${Card.suitName(c.suit)} ${Card.rankName(c.rank)}"
}

@JsExport
fun defaultNames(): Array<String> = Game.DEFAULT_NAMES.toTypedArray()
