package nl.tienopenneer.engine

import kotlin.math.max
import kotlin.math.pow
import kotlin.math.round
import kotlin.math.sqrt

/*
 * De computerspelers, overgezet uit Kaarten.bas en 10opneer.frm van het origineel.
 * De constanten en wegingen zijn door de oorspronkelijke auteur afgesteld en ongewijzigd overgenomen.
 */

private const val MARGE_HWG = 0.09 // Hoge weggooien
private const val MARGE_OMLT = 0.35 // Opkomen met lage troef
private const val MARGE_SNN = 0.09 // Slag niet nemen

/** KaartWaarde(2..14) */
private val CARD_VALUE = DoubleArray(15) { i -> if (i < 2) 0.0 else 0.7 * (i / 14.0).pow(2.8) }

/** Positief */
private fun positive(x: Double) = max(0.0, x)

/** VB's CInt rondt af naar het dichtstbijzijnde even getal bij .5 */
internal fun vbRound(x: Double): Int = round(x).toInt()

/** KaartenOverVoorDezeSpeler */
internal fun Game.cardsLeftForThisPlayer(): Double =
    if (numberBid < 4) (cardsThisRound - totalBid).toDouble() / (4 - numberBid) else 0.0

/** SamenSlagenNodig / TotaalSlagenNodig: hoeveel slagen willen de spelers samen nog. */
internal fun Game.totalTricksNeeded(): Int =
    (1..4).sumOf { val n = p[it].bid - p[it].tricks; if (n > 0) n else 0 }

/** TaxeerKaarten: schatting van het aantal slagen dat de speler zal halen. */
internal fun Game.estimate(pl: Int): Double {
    var sum = 0.0
    for (k in 1..cardsThisRound) {
        if (!p[pl].hand[k].isNone) sum += positive(cardValue(pl, k, true))
    }
    var t = sum
    if (numberBid < 4) {
        // Voorspellen
        val w = 0.07 * numberBid
        t = w * cardsLeftForThisPlayer() + (1 - w) * t
    } else {
        // In het spel
        t += 0.08 * (p[1].cardCount - totalTricksNeeded())
    }
    if (trump.suit == 0) t *= 2 // Geen troef -> alles is mogelijk
    if (t > cardsRemaining) t = cardsRemaining.toDouble()
    return positive(t)
}

/** BerekenKaartWaarde */
internal fun Game.cardValue(pl: Int, slot: Int, trumpIsHigh: Boolean): Double {
    val mustLead = pl == leader
    val card = p[pl].hand[slot]
    val suit = card.suit

    var w = CARD_VALUE[card.rank]
    if (suit == trump.suit && trumpIsHigh) w += 0.41
    w = if (suit != trump.suit && !mustLead) {
        w * (1 - 0.2 * suitTimesLed[suit])
    } else if (suit != trump.suit && mustLead && trump.suit != 0) {
        w * (1 + 0.2 * suitTimesLed[trump.suit])
    } else {
        w * sqrt(suitTimesLed[suit] + 1.0)
    }

    var lowestRank = 15
    var lowestSlot = 0
    for (k in 1..cardsThisRound) {
        val c = p[pl].hand[k]
        if (c.suit == suit && c.rank < lowestRank) {
            lowestRank = c.rank
            lowestSlot = k
        }
    }

    w *= if (suit == trump.suit) {
        1 + 0.08 * positive(4.0 - cardsRemaining)
    } else {
        1 - 0.18 * positive(4.0 - cardsRemaining)
    }

    if (lowestSlot != slot && suit != trump.suit && lowestRank < 10) {
        val lowestValue = cardValue(pl, lowestSlot, true)
        w = 0.8 * lowestValue + 0.2 * w
    }
    return w
}

/** LegaleVoorspelling: rondt de schatting af en houdt rekening met "rondmaken niet toegestaan". */
internal fun Game.legalBid(estimate: Double): Int {
    val wanted = vbRound(estimate)
    if (!rules.roundingAllowed && wanted == tricksOver && nextPlayer(toBid) == leader) {
        return if (estimate > wanted) {
            if (wanted + 1 <= cardsThisRound) wanted + 1 else wanted - 1
        } else {
            if (wanted - 1 >= 0) wanted - 1 else wanted + 1
        }
    }
    return wanted
}

/** KaartenErboven: hoeveel kaarten van anderen kunnen deze kaart nog overnemen. */
internal fun Game.cardsAbove(pl: Int, slot: Int): Int {
    val card = p[pl].hand[slot]
    var above = 0
    for (r in card.rank + 1..14) {
        val w = whereIsCard[card.suit][r]
        if (w in 0..4 && w != pl) above++
    }
    if (card.suit != trump.suit && trump.suit != 0) {
        for (r in 2..14) {
            val w = whereIsCard[trump.suit][r]
            if (w in 0..4 && w != pl) above++
        }
    }
    var surelyNotHigher = 0
    for (other in 1..4) {
        if (other == pl) continue
        if (card.suit == trump.suit) {
            if (p[other].hasNoSuit[card.suit]) surelyNotHigher++
        } else if (trump.suit != 0) {
            if (p[other].hasNoSuit[card.suit] && p[other].hasNoSuit[trump.suit]) surelyNotHigher++
        }
    }
    if (surelyNotHigher == 3) above = 0
    return above
}

/** VolgendeKaartVanKleur: de plaats van de volgende kaart in de hand als die dezelfde kleur heeft. */
internal fun Game.nextCardOfSuit(pl: Int, slot: Int): Int {
    for (i in slot + 1..rules.maxCards) {
        val c = p[pl].hand[i]
        if (c.rank >= 2) return if (c.suit == p[pl].hand[slot].suit) i else -1
    }
    return 0
}

/** NuSlagenOverVoorAnderen */
internal fun Game.tricksOverForOthers(pl: Int): Int {
    val asked = totalBid - p[pl].bid
    var won = 0
    var other = nextPlayer(pl)
    while (other != pl) {
        won += p[other].tricks
        other = nextPlayer(other)
    }
    return cardsRemaining - (asked - won)
}

/** VolgendeSpelerMoetNuIntroeven */
internal fun Game.nextPlayerMustTrumpNow(pl: Int): Boolean {
    if (trump.suit == 0) return false
    var other = nextPlayer(pl)
    while (other != leader) {
        val o = p[other]
        if (o.tricks == o.bid - o.cardCount && !o.hasNoSuit[trump.suit]) return true
        other = nextPlayer(other)
    }
    return false
}

/** VolgendeSpelerWilMeer */
internal fun Game.nextPlayerWantsMore(pl: Int): Boolean {
    var other = nextPlayer(pl)
    while (other != leader) {
        val o = p[other]
        if (o.tricks < o.bid && o.tricks >= o.bid - o.cardCount) {
            if (!o.hasNoSuit[table[leader].suit]) return true
            if (trump.suit != 0 && !o.hasNoSuit[trump.suit]) return true
        }
        other = nextPlayer(other)
    }
    return false
}

/** Sorteert plaatsen oplopend op waarde, zoals de invoegsortering van het origineel. */
private fun insertSorted(entries: List<Pair<Double, Int>>): List<Int> {
    val values = ArrayList<Double>()
    val slots = ArrayList<Int>()
    for ((value, slot) in entries) {
        var idx = values.indexOfFirst { value <= it }
        if (idx < 0) idx = values.size
        values.add(idx, value)
        slots.add(idx, slot)
    }
    return slots
}

private fun Game.playValue(pl: Int, slot: Int, trumpIsHigh: Boolean): Double {
    val w1 = cardValue(pl, slot, trumpIsHigh)
    val w2 = (25 - cardsAbove(pl, slot)) / 25.0
    return 0.05 * w1 + 0.95 * w2
}

/**
 * GooiWeg: kies een kaart waarmee de slag niet gehaald wordt.
 * [rank]: 1 = laagste, 2 = één na laagste, -1 = hoogste, -2 = één na hoogste, enz.
 */
internal fun Game.throwAway(pl: Int, rank: Int): Int {
    val order = insertSorted(
        (1..cardsThisRound).filter { !p[pl].hand[it].isNone }.map { playValue(pl, it, true) to it },
    )
    val n = order.size
    fun ok(pos: Int): Boolean {
        val slot = order[pos - 1]
        return higherCard(table[highestOnTable], p[pl].hand[slot]) == 1 && p[pl].legal[slot]
    }

    var pos: Int
    var step: Int
    if (rank > 0) {
        pos = rank
        step = 1
    } else {
        pos = n + rank + 1
        step = -1
    }
    pos = pos.coerceIn(1, n)
    var guard = 0
    while (!ok(pos)) {
        pos += step
        if (pos > n) {
            pos = rank - 1
            step = -1
        }
        if (pos < 1) {
            pos = n + rank + 2
            step = 1
        }
        if (pos !in 1..n || ++guard > 4 * n + 4) {
            // Kwam in het origineel niet voor; kies dan de laagste speelbare kaart die de slag niet haalt.
            return order.firstOrNull { p[pl].legal[it] && higherCard(table[highestOnTable], p[pl].hand[it]) == 1 }
                ?: order.first { p[pl].legal[it] }
        }
    }
    return order[pos - 1]
}

/**
 * NeemSlag: kies een kaart waarmee de slag waarschijnlijk gehaald wordt.
 * [rank]: 1 = laagste, -1 = hoogste, enz.
 */
internal fun Game.takeTrick(pl: Int, rank: Int, trumpIsAlsoGood: Boolean): Int {
    var choices = if (trumpIsAlsoGood || legalNonTrumpCount == 0) {
        (1..canWinCount).map { canWinWith[it] }
    } else {
        (1..legalNonTrumpCount).map { legalNonTrumps[it] }
    }
    if (choices.isEmpty()) choices = (1..possibleCount).map { possible[it] }

    val order = insertSorted(
        choices.map { slot ->
            var value = playValue(pl, slot, trumpIsAlsoGood)
            if (rank == 1) {
                // Liefst een kale lage kaart opgooien
                val next = nextCardOfSuit(pl, slot)
                if (next >= 1) {
                    val nextValue = (25 - cardsAbove(pl, next)) / 25.0
                    value = 0.65 * value + 0.35 * nextValue
                }
            }
            value to slot
        },
    )
    val n = order.size
    val pos = (if (rank > 0) rank else n + rank + 1).coerceIn(1, n)
    return order[pos - 1]
}

/** KomOpMetLageTroef */
internal fun Game.leadLowTrump(pl: Int, highIsAlsoGood: Boolean): Int {
    val trumps = (1..canWinCount).map { canWinWith[it] }.filter { p[pl].hand[it].suit == trump.suit }
    if (trumps.isNotEmpty()) {
        val entries = trumps.map { cardValue(pl, it, true) to it }
        val order = insertSorted(entries)
        val lowestValue = entries.first { it.second == order[0] }.first
        if (lowestValue < 0.6 || highIsAlsoGood) return order[0]
    }
    return takeTrick(pl, 1, false)
}

/** KaartKiezenComputer: "de computer" onderscheidt 27 situaties. Geeft de plaats van de kaart in de hand. */
internal fun Game.chooseCardComputer(pl: Int): Int {
    val me = p[pl]
    val stillNeeded = me.bid - me.tricks
    findPossibleCards(pl)

    val chosen: Int
    if (possibleCount == 1) {
        chosen = possible[1]
    } else {
        testTrickWinnable(pl)
        var surplusInHand = estimate(pl) - stillNeeded
        val tricksSurplusNow = me.cardCount - totalTricksNeeded()
        if (surplusInHand > 0) {
            surplusInHand *= (1 + tricksSurplusNow.toDouble() / cardsThisRound)
        }

        val isWet = when {
            stillNeeded < 0 -> true // Heeft er al te veel
            stillNeeded == 0 && cannotWinCount == 0 && leader == nextPlayer(pl) -> true // Krijgt er te veel
            stillNeeded == me.cardCount && canWinCount == 0 -> true // Krijgt er te weinig
            stillNeeded > me.cardCount -> true // Krijgt er te weinig
            else -> false
        }

        chosen = if (isWet && rules.penaltyPerTrick == 0) {
            // Nat: gaat dwarsliggen
            if (tricksOverForOthers(pl) > 0) {
                // Slagen over: duiken
                when {
                    cannotWinCount > 0 -> throwAway(pl, -1)
                    pl == leader -> takeTrick(pl, 1, true)
                    nextPlayer(pl) != leader -> takeTrick(pl, 1, true)
                    else -> takeTrick(pl, -1, true)
                }
            } else {
                // Slagen te weinig of rond: alles nemen
                if (canWinCount > 0) {
                    when {
                        pl == leader -> takeTrick(pl, -1, true)
                        nextPlayer(pl) != leader -> takeTrick(pl, -1, true)
                        else -> takeTrick(pl, 1, true)
                    }
                } else {
                    throwAway(pl, 1)
                }
            }
        } else if (stillNeeded > 0) {
            // Wil meer slagen
            if (canWinCount > 0) {
                if (stillNeeded == me.cardCount) {
                    // Moet de rest
                    if (pl == leader) {
                        takeTrick(pl, -1, true)
                    } else if (table[leader].suit != trump.suit && !canFollowSuit(pl)) {
                        // Kan introeven
                        if (nextPlayerMustTrumpNow(pl)) takeTrick(pl, -1, true) else takeTrick(pl, 1, true)
                    } else if (nextPlayer(pl) == leader) {
                        // In de achterhand: met lage nemen
                        takeTrick(pl, 1, true)
                    } else if (nextPlayerWantsMore(pl)) {
                        takeTrick(pl, -1, true)
                    } else {
                        takeTrick(pl, 1, true)
                    }
                } else if (surplusInHand > MARGE_SNN) {
                    // Heeft zat hoge kaarten
                    if (pl == leader) {
                        if (surplusInHand > MARGE_OMLT) leadLowTrump(pl, false) else takeTrick(pl, 1, false)
                    } else if (cannotWinCount > 0) {
                        throwAway(pl, -stillNeeded - 1)
                    } else {
                        takeTrick(pl, -stillNeeded, true)
                    }
                } else {
                    // Heeft geen overschot
                    if (me.tricks + 1 == me.bid) {
                        // Hoeft er nog maar 1
                        if (pl == leader) takeTrick(pl, -1, false) else takeTrick(pl, -1, true)
                    } else {
                        if (pl == leader) takeTrick(pl, -1, false) else takeTrick(pl, -stillNeeded, true)
                    }
                }
            } else {
                // Slag is niet te halen
                if (surplusInHand > MARGE_HWG) {
                    throwAway(pl, -stillNeeded - 1)
                } else if (me.cardCount > 4) {
                    throwAway(pl, 2)
                } else {
                    throwAway(pl, 1)
                }
            }
        } else {
            // Hoeft geen slagen meer (of is nat bij Boerenbridge)
            if (pl == leader) {
                leadLowTrump(pl, true)
            } else if (cannotWinCount == 0) {
                // Kan niet duiken: hopen dat de volgende speler nog hoger heeft
                takeTrick(pl, 1, true)
            } else {
                throwAway(pl, -1)
            }
        }
    }

    check(me.legal[chosen]) { "${me.name} speelt vals!" }
    return chosen
}
