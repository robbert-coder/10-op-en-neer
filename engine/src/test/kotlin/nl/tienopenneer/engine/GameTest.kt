package nl.tienopenneer.engine

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class GameTest {

    /** Speelt een heel spel waarbij de mens steeds de tip volgt. */
    private fun playOut(rules: Rules, seed: Long): Game {
        val g = Game(rules, seed)
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
                val round = g.round
                val phaseBefore = g.phase
                g.advance()
                if (phaseBefore == Phase.TRICK_COMPLETE && g.phase == Phase.ROUND_COMPLETE) {
                    // Precies zoveel slagen als kaarten
                    assertEquals(g.rules.cardsInRound(round), g.players.sumOf { it.tricks })
                }
            }
        }
        return g
    }

    @Test
    fun roundsGoUpAndDown() {
        val r = Rules.TIEN_OP_EN_NEER
        assertEquals(19, r.rounds)
        assertEquals((1..10).toList() + (9 downTo 1).toList(), (1..19).map { r.cardsInRound(it) })
        assertEquals(25, Rules.BOERENBRIDGE.rounds)
        assertEquals(13, Rules.BOERENBRIDGE.cardsInRound(13))
    }

    @Test
    fun noTrumpWhenAllCardsAreDealt() {
        val g = Game(Rules.BOERENBRIDGE, 7)
        while (g.round < 13) {
            if (g.isHumanTurn) {
                if (g.phase == Phase.BIDDING) g.humanBid(g.hintBid()) else g.humanPlay(g.hintCard()!!)
            } else {
                g.advance()
            }
        }
        assertTrue(g.trump.isNone)
        assertEquals(13, g.player(1).handCards().size)
    }

    @Test
    fun manyGamesPlayLegallyInBothVariants() {
        for (seed in 1L..150L) {
            for (rules in listOf(Rules.TIEN_OP_EN_NEER, Rules.BOERENBRIDGE, Rules.TIEN_OP_EN_NEER.copy(mustTrump = true, roundingAllowed = false))) {
                val g = playOut(rules, seed)
                for (pl in g.players) {
                    val sum = (1..rules.rounds).sumOf { r -> if (pl.crossedForRound(r)) 0 else pl.scoreForRound(r) }
                    assertEquals(pl.total, sum)
                }
                assertTrue(g.players.any { it.rank == 1 })
            }
        }
    }

    @Test
    fun scoringTienOpEnNeer() {
        val g = playOut(Rules.TIEN_OP_EN_NEER, 42)
        for (pl in g.players) {
            for (r in 1..19) {
                if (pl.goodForRound(r)) {
                    assertEquals(10 + pl.bidForRound(r), pl.scoreForRound(r))
                } else {
                    assertTrue(pl.crossedForRound(r))
                }
            }
        }
    }

    @Test
    fun scoringBoerenbridge() {
        val g = playOut(Rules.BOERENBRIDGE, 42)
        for (pl in g.players) {
            for (r in 1..25) {
                val expected = if (pl.goodForRound(r)) {
                    10 + 3 * pl.bidForRound(r)
                } else {
                    maxOf(0, 10 - 3 * kotlin.math.abs(pl.tricksForRound(r) - pl.bidForRound(r)))
                }
                assertEquals(expected, pl.scoreForRound(r))
            }
        }
    }

    @Test
    fun lastBidderMayNotMakeItRoundInBoerenbridge() {
        for (seed in 1L..200L) {
            val g = Game(Rules.BOERENBRIDGE, seed)
            while (g.phase != Phase.GAME_OVER) {
                if (g.phase == Phase.BIDDING && g.nextPlayer(g.toBid) == g.leader && g.toBid != 1) {
                    g.advance()
                    // Na de laatste voorspelling mag het totaal niet gelijk zijn aan het aantal kaarten
                    assertTrue(g.tricksOver != 0, "seed $seed ronde ${g.round}")
                } else if (g.isHumanTurn) {
                    if (g.phase == Phase.BIDDING) {
                        val forbidden = g.forbiddenHumanBid()
                        if (forbidden != null) {
                            assertTrue(g.checkHumanBid(forbidden) != null)
                        }
                        g.humanBid(g.hintBid())
                    } else {
                        g.humanPlay(g.hintCard()!!)
                    }
                } else {
                    g.advance()
                }
            }
        }
    }

    @Test
    fun mustFollowSuit() {
        for (seed in 1L..50L) {
            val g = Game(Rules.TIEN_OP_EN_NEER, seed)
            while (g.phase != Phase.GAME_OVER) {
                if (g.isHumanTurn) {
                    if (g.phase == Phase.BIDDING) {
                        g.humanBid(0)
                    } else {
                        val lead = g.tableCard(g.leader)
                        val hand = g.player(1).handCards()
                        if (g.leader != 1 && hand.any { it.suit == lead.suit }) {
                            val wrong = hand.firstOrNull { it.suit != lead.suit }
                            if (wrong != null) assertTrue(g.humanPlay(wrong)!!.startsWith("Je moet kleur bekennen"))
                        }
                        g.humanPlay(g.legalCardsForHuman().first())
                    }
                } else {
                    g.advance()
                }
            }
        }
    }

    @Test
    fun restoreReproducesTheGame() {
        val rules = Rules.BOERENBRIDGE
        val g = Game(rules, 1234)
        var steps = 0
        while (g.phase != Phase.GAME_OVER && (steps < 600 || !g.isHumanTurn)) {
            steps++
            if (g.isHumanTurn) {
                if (g.phase == Phase.BIDDING) g.humanBid(g.hintBid()) else g.humanPlay(g.hintCard()!!)
            } else {
                g.advance()
            }
        }
        val restored = Game.restore(rules, 1234, Game.DEFAULT_NAMES, g.humanActions)
        while (restored.canAdvance) restored.advance()
        assertEquals(g.phase, restored.phase)
        assertEquals(g.trickNumber, restored.trickNumber)
        assertEquals(g.round, restored.round)
        for (nr in 1..4) {
            assertEquals(g.player(nr).total, restored.player(nr).total)
            assertEquals(g.player(nr).handCards(), restored.player(nr).handCards())
            assertEquals(g.player(nr).tricks, restored.player(nr).tricks)
        }
    }

    @Test
    fun computerPlayersAreReasonable() {
        // Volgens de oorspronkelijke handleiding is 170 punten zeer goed bij 10 op en neer.
        var total = 0
        var games = 0
        for (seed in 1L..200L) {
            val g = playOut(Rules.TIEN_OP_EN_NEER, seed)
            total += g.players.sumOf { it.total }
            games += 4
        }
        val average = total.toDouble() / games
        println("Gemiddelde score per speler (10 op en neer): %.1f".format(average))
        assertTrue(average in 100.0..200.0, "gemiddelde $average")
    }

    @Test
    fun soundsFollowTheHumanResult() {
        val heard = mutableSetOf<Sound>()
        for (seed in 1L..40L) {
            val g = Game(Rules.TIEN_OP_EN_NEER, seed)
            while (g.phase != Phase.GAME_OVER) {
                if (g.isHumanTurn) {
                    if (g.phase == Phase.BIDDING) g.humanBid(g.hintBid()) else g.humanPlay(g.hintCard()!!)
                } else {
                    val before = g.phase
                    g.advance()
                    val sounds = g.takeSounds()
                    heard += sounds
                    if (Sound.GOED_VOORSPELD in sounds) {
                        assertEquals(Phase.TRICK_COMPLETE, before)
                        assertEquals(g.player(1).bid, g.player(1).tricks)
                    }
                }
                heard += g.takeSounds()
            }
        }
        assertTrue(heard.containsAll(listOf(Sound.GOED_VOORSPELD, Sound.MEDESPELER_NAT, Sound.SLAG_TE_VEEL, Sound.SLAG_TE_WEINIG)), "$heard")
    }

    /** Twee mensen aan tafel (stoel 1 en 3): het spel loopt, en herstellen geeft dezelfde stand. */
    @Test
    fun severalHumansAndRestore() {
        val rules = Rules(maxCards = 6, pointsPerTrick = 1, wrongScoresZero = true, penaltyPerTrick = 0,
            negativeScores = false, roundingAllowed = false, mustTrump = false)
        val seats = setOf(1, 3)
        val g = Game(rules, 4242L, smartComputers = true)
        g.humanSeats = seats
        var guard = 0
        val movers = mutableSetOf<Int>()
        while (g.phase != Phase.GAME_OVER) {
            check(++guard < 100_000) { "Spel loopt vast" }
            val seat = g.humanToMove
            if (seat != 0) {
                movers.add(seat)
                if (g.phase == Phase.BIDDING) {
                    assertNull(g.humanBid(g.hintBid(seat)))
                } else {
                    val card = g.hintCard(seat)!!
                    assertTrue(card in g.legalCardsForHuman(seat))
                    assertNull(g.humanPlay(card))
                }
            } else {
                g.advance()
            }
        }
        assertEquals(seats, movers)
        val r = Game.restore(rules, 4242L, Game.DEFAULT_NAMES, g.humanActions, true, seats, 3)
        while (r.canAdvance) r.advance()
        assertEquals(g.players.map { it.total }, r.players.map { it.total })
    }

    @Test
    fun fivePlayersPlayLegallyAndRestore() {
        val boeren10 = Rules.BOERENBRIDGE.copy(maxCards = 10)
        assertEquals("Boerenbridge tot 10", boeren10.variantName)
        assertEquals("10 op en neer tot 5", Rules.TIEN_OP_EN_NEER.copy(maxCards = 5).variantName)
        for ((k, rules) in listOf(Rules.TIEN_OP_EN_NEER, boeren10).withIndex()) {
            for (smart in listOf(false, true)) {
                val seed = 900L + k
                val seats = setOf(1, 4, 5)
                val g = Game(rules, seed, smartComputers = smart, playerCount = 5)
                g.humanSeats = seats
                assertEquals(5, g.players.size)
                var guard = 0
                while (g.phase != Phase.GAME_OVER) {
                    check(++guard < 200_000) { "Spel loopt vast" }
                    val seat = g.humanToMove
                    if (seat != 0) {
                        if (g.phase == Phase.BIDDING) {
                            assertNull(g.humanBid(g.hintBid(seat)))
                        } else {
                            val card = g.hintCard(seat)!!
                            assertNull(g.humanPlay(card))
                        }
                    } else {
                        g.advance()
                    }
                }
                // Alle slagen van een ronde zijn verdeeld
                for (round in 1..rules.rounds) {
                    assertEquals(rules.cardsInRound(round), g.players.sumOf { it.tricksForRound(round) })
                }
                val r = Game.restore(rules, seed, Game.DEFAULT_NAMES, g.humanActions, smart, seats, 4, 5)
                while (r.canAdvance) r.advance()
                assertEquals(g.players.map { it.total }, r.players.map { it.total })
            }
        }
    }

    @Test
    fun thirteenCardsDoNotFitFivePlayers() {
        assertFailsWith<IllegalArgumentException> { Game(Rules.BOERENBRIDGE, 1L, playerCount = 5) }
    }

    @Test
    fun twoAndThreePlayersWithOrWithoutComputers() {
        for (count in 2..3) {
            for (rules in listOf(Rules.TIEN_OP_EN_NEER, Rules.BOERENBRIDGE, Rules.TIEN_OP_EN_NEER.copy(maxCards = 3))) {
                for (seats in listOf((1..count).toSet(), setOf(1))) {
                    for (smart in listOf(false, true)) {
                        val seed = 700L + count
                        val g = Game(rules, seed, smartComputers = smart, playerCount = count)
                        g.humanSeats = seats
                        assertEquals(count, g.players.size)
                        var guard = 0
                        while (g.phase != Phase.GAME_OVER) {
                            check(++guard < 200_000) { "Spel loopt vast" }
                            val seat = g.humanToMove
                            if (seat != 0) {
                                if (g.phase == Phase.BIDDING) assertNull(g.humanBid(g.hintBid(seat)))
                                else assertNull(g.humanPlay(g.hintCard(seat)!!))
                            } else {
                                g.advance()
                            }
                        }
                        for (round in 1..rules.rounds) {
                            assertEquals(rules.cardsInRound(round), g.players.sumOf { it.tricksForRound(round) })
                        }
                        val r = Game.restore(rules, seed, Game.DEFAULT_NAMES, g.humanActions, smart, seats, count, count)
                        while (r.canAdvance) r.advance()
                        assertEquals(g.players.map { it.total }, r.players.map { it.total })
                    }
                }
            }
        }
        assertFailsWith<IllegalArgumentException> { Game(Rules.TIEN_OP_EN_NEER, 1L, playerCount = 1) }
    }
}
