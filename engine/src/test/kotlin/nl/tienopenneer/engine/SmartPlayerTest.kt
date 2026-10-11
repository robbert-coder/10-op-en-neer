package nl.tienopenneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertTrue

class SmartPlayerTest {

    /**
     * Speelt een heel spel waarin de spelers in [smart] de sterkere computerspeler gebruiken en de rest
     * de gewone. Speler 1 volgt steeds de tip, die bij plaats 1 dezelfde sterkte heeft.
     */
    private fun playMixed(rules: Rules, seed: Long, smart: Set<Int>): Game {
        val g = Game(rules, seed)
        for (nr in 1..4) g.smartSeat[nr] = nr in smart
        var guard = 0
        while (g.phase != Phase.GAME_OVER) {
            check(++guard < 100_000) { "Spel loopt vast" }
            if (g.isHumanTurn) {
                if (g.phase == Phase.BIDDING) {
                    assertNull(g.humanBid(g.hintBid()))
                } else {
                    val card = g.hintCard()!!
                    assertTrue(card in g.legalCardsForHuman())
                    assertNull(g.humanPlay(card))
                }
            } else {
                g.advance()
            }
        }
        return g
    }

    /**
     * Gemiddelde eindscore van de slimme en van de gewone spelers. Elk spel wordt twee keer gespeeld
     * met dezelfde kaarten en verwisselde plaatsen, zodat geluk met de kaarten tegen elkaar wegvalt.
     */
    private fun compare(rules: Rules, seeds: LongRange): Pair<Double, Double> {
        var smartTotal = 0
        var usualTotal = 0
        for (seed in seeds) {
            for (smart in listOf(setOf(1, 3), setOf(2, 4))) {
                val g = playMixed(rules, seed, smart)
                for (nr in 1..4) {
                    if (nr in smart) smartTotal += g.player(nr).total else usualTotal += g.player(nr).total
                }
            }
        }
        val players = 4.0 * seeds.count()
        return smartTotal / players to usualTotal / players
    }

    // Kortere spellen houden de tests snel.

    @Test
    fun smartPlayersScoreHigherInTienOpEnNeer() {
        val (smart, usual) = compare(Rules.TIEN_OP_EN_NEER.copy(maxCards = 7), 1L..20L)
        println("10 op en neer (7 kaarten): slim %.1f, gewoon %.1f".format(smart, usual))
        assertTrue(smart > usual * 1.05, "slim $smart, gewoon $usual")
    }

    @Test
    fun smartPlayersScoreHigherInBoerenbridge() {
        val (smart, usual) = compare(Rules.BOERENBRIDGE.copy(maxCards = 10), 1L..10L)
        println("Boerenbridge (10 kaarten): slim %.1f, gewoon %.1f".format(smart, usual))
        assertTrue(smart > usual * 1.05, "slim $smart, gewoon $usual")
    }

    @Test
    fun smartGamesPlayLegallyWithAllRules() {
        val rules = Rules.TIEN_OP_EN_NEER.copy(maxCards = 6, mustTrump = true, roundingAllowed = false)
        for (seed in 1L..10L) {
            val g = playMixed(rules, seed, setOf(1, 2, 3, 4))
            for (r in 1..rules.rounds) {
                assertEquals(rules.cardsInRound(r), g.players.sumOf { it.tricksForRound(r) })
                // De laatste voorspeller maakt het niet rond
                assertTrue(g.players.sumOf { it.bidForRound(r) } != rules.cardsInRound(r))
            }
        }
    }

    @Test
    fun smartGameIsRestoredExactly() {
        for (rules in listOf(Rules.BOERENBRIDGE, Rules.TIEN_OP_EN_NEER)) {
            val g = Game(rules, 4321, Game.DEFAULT_NAMES, smartComputers = true)
            var steps = 0
            while (g.phase != Phase.GAME_OVER && (steps < 500 || !g.isHumanTurn)) {
                steps++
                if (g.isHumanTurn) {
                    // Af en toe om een tip vragen mag het verloop niet veranderen
                    if (steps % 3 == 0) g.hintBid()
                    if (g.phase == Phase.BIDDING) g.humanBid(g.hintBid()) else g.humanPlay(g.hintCard()!!)
                } else {
                    g.advance()
                }
            }
            val restored = Game.restore(rules, 4321, Game.DEFAULT_NAMES, g.humanActions, smartComputers = true)
            while (restored.canAdvance) restored.advance()
            assertEquals(g.phase, restored.phase)
            assertEquals(g.round, restored.round)
            assertEquals(g.trickNumber, restored.trickNumber)
            for (nr in 1..4) {
                assertEquals(g.player(nr).total, restored.player(nr).total)
                assertEquals(g.player(nr).handCards(), restored.player(nr).handCards())
                assertEquals(g.player(nr).tricks, restored.player(nr).tricks)
                assertEquals(g.player(nr).bid, restored.player(nr).bid)
                for (r in 1..g.round) assertEquals(g.player(nr).scoreForRound(r), restored.player(nr).scoreForRound(r))
            }
        }
    }

    @Test
    fun smartScoreMatchesTheRules() {
        assertEquals(13, Rules.TIEN_OP_EN_NEER.roundScore(3, 3))
        assertEquals(0, Rules.TIEN_OP_EN_NEER.roundScore(3, 2))
        assertEquals(19, Rules.BOERENBRIDGE.roundScore(3, 3))
        assertEquals(4, Rules.BOERENBRIDGE.roundScore(3, 5))
        assertEquals(0, Rules.BOERENBRIDGE.roundScore(0, 6))
    }
}
