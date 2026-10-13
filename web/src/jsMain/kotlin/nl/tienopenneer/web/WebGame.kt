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
    /** Stoelen (1..playerCount) waar een mens zit; bij een gewoon spel alleen 1. */
    humanSeats: Array<Int>,
    /** De stoel van de speler op dit apparaat. De toestand wordt gedraaid zodat die stoel onderaan zit. */
    private val viewSeat: Int,
    /** 4 of 5 spelers aan tafel. */
    playerCount: Int,
) {
    private val game: Game = Game.restore(
        Rules(maxCards, pointsPerTrick, wrongScoresZero, penaltyPerTrick, negativeScores, roundingAllowed, mustTrump),
        seed.toLong(),
        names.toList(),
        actions.toList(),
        smart,
        humanSeats.toSet(),
        viewSeat,
        playerCount,
    )
    private val n = game.playerCount

    /** Stoel in het spel naar plaats op het scherm (1 = onderaan) en terug. */
    private fun toView(seat: Int) = if (seat == 0) 0 else (seat - viewSeat + n) % n + 1
    private fun toSeat(view: Int) = (view - 1 + viewSeat - 1) % n + 1

    val seed: Double get() = game.seed.toDouble()

    fun actions(): Array<Int> = game.humanActions.toTypedArray()

    fun setPlayerName(name: String) {
        game.player(viewSeat).name = name
    }

    /** Naam van een andere stoel aanpassen (bijvoorbeeld als een computer het van iemand overneemt). */
    fun setSeatName(seat: Int, name: String) {
        if (seat in 1..n) game.player(seat).name = name
    }

    /** Aantal handelingen van mensen tot nu toe (de volgorde is voor iedereen gelijk). */
    fun actionCount(): Int = game.humanActions.size

    /** De stoel van de mens die nu aan de beurt is (in het spel, niet op het scherm), of 0. */
    fun humanToMove(): Int = game.humanToMove

    /** Eén stap zonder invoer van een mens (een computerspeler, een slag ophalen); false als dat nu niet kan. */
    fun advance(): Boolean = game.advance()

    /** Geeft een foutmelding, of null als de voorspelling is gedaan. */
    fun bid(n: Int): String? =
        if (game.humanToMove != viewSeat) "Je bent nu niet aan de beurt." else game.humanBid(n)

    /** Geeft een foutmelding, of null als de kaart is opgelegd. */
    fun play(code: Int): String? =
        if (game.humanToMove != viewSeat) "Je bent nog niet aan de beurt." else game.humanPlay(Card.fromCode(code))

    /** Een handeling van een andere mens (via internet): een voorspelling (0..13) of een kaartcode (100+). */
    fun applyRemote(seat: Int, value: Int): String? {
        // Een negatieve waarde: de speler op die stoel is weg en een computer neemt het over
        if (value < 0) return game.computerTakesOver(-value)
        if (game.humanToMove != seat) return "Stoel $seat is niet aan de beurt."
        return if (value >= 100) game.humanPlay(Card.fromCode(value)) else game.humanBid(value)
    }

    fun hintBid(): Int = game.hintBid(viewSeat)

    /** Code van de kaart die de computer zou spelen, of 0. */
    fun hintCard(): Int = game.hintCard(viewSeat)?.code ?: 0

    /** Namen van de geluiden sinds de vorige aanroep, bijvoorbeeld "GOED_VOORSPELD". */
    fun takeSounds(): Array<String> = game.takeSounds().map { it.name }.toTypedArray()

    /** De hele stand als JSON, gedraaid zodat de eigen stoel onderaan staat; de webpagina tekent hieruit alles. */
    fun state(): String {
        val g = game
        val r = g.rules
        val legal = g.legalCardsForHuman(viewSeat).map { it.code }.toSet()
        val sb = StringBuilder()
        sb.append('{')
        sb.append("\"variant\":").append(str(r.variantName))
        sb.append(",\"isTienOpEnNeer\":").append(r.isTienOpEnNeer)
        sb.append(",\"playerCount\":").append(n)
        sb.append(",\"round\":").append(g.round)
        sb.append(",\"rounds\":").append(r.rounds)
        sb.append(",\"cards\":").append(g.cardsThisRound)
        sb.append(",\"trump\":").append(g.trump.code)
        sb.append(",\"phase\":").append(str(g.phase.name))
        sb.append(",\"leader\":").append(toView(g.leader))
        sb.append(",\"active\":").append(
            toView(
                when (g.phase) {
                    Phase.BIDDING -> g.toBid
                    Phase.PLAYING -> g.toPlay
                    else -> 0
                },
            ),
        )
        sb.append(",\"status\":").append(str(g.status))
        sb.append(",\"tricksOver\":").append(str(g.tricksOverText()))
        sb.append(",\"forbiddenBid\":").append(g.forbiddenHumanBid(viewSeat) ?: -1)
        sb.append(",\"trickWinner\":").append(toView(g.trickWinner))
        sb.append(",\"lastTrickWinner\":").append(toView(g.lastTrickWinner))
        sb.append(",\"table\":").append(list((1..n).map { g.tableCard(toSeat(it)).code }))
        sb.append(",\"lastTrick\":").append(list((1..n).map { g.lastTrickCard(toSeat(it)).code }))
        sb.append(",\"hand\":[")
        g.player(viewSeat).handCards().forEachIndexed { i, c ->
            if (i > 0) sb.append(',')
            sb.append("{\"code\":").append(c.code).append(",\"legal\":").append(c.code in legal).append('}')
        }
        sb.append(']')
        sb.append(",\"players\":[")
        for (view in 1..n) {
            val seat = toSeat(view)
            val pl = g.player(seat)
            if (view > 1) sb.append(',')
            sb.append("{\"name\":").append(str(pl.name))
            sb.append(",\"seat\":").append(seat)
            sb.append(",\"human\":").append(seat in g.humanSeats)
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
