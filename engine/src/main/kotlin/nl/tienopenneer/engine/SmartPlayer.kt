package nl.tienopenneer.engine

import kotlin.math.abs
import kotlin.math.exp
import kotlin.random.Random

/*
 * De sterkere computerspeler ("slim"). Niet uit het origineel: deze speler rekent vooruit.
 *
 * Werkwijze (Monte Carlo met getrokken verdelingen):
 * - De kaarten die de speler niet kan zien, worden een aantal keren willekeurig over de andere
 *   spelers en de stapel verdeeld. Daarbij wordt alleen gebruikt wat iedereen weet: de eigen hand,
 *   de troefkaart, de gespeelde kaarten, het aantal kaarten per speler en wie welke kleur niet meer heeft.
 * - Verdelingen die slecht passen bij wat de anderen voorspeld hebben, worden minder vaak gekozen:
 *   per getrokken hand wordt nagerekend wat de gewone computerspeler ermee voorspeld zou hebben.
 * - Voor elke mogelijke kaart (of voorspelling) wordt de rest van de ronde in elke verdeling uitgespeeld
 *   door de gewone computerspelers ([chooseCardComputer]); de keuze met de hoogste gemiddelde eigen
 *   rondescore wint. Bij gelijke stand blijft de keuze van de gewone computerspeler staan.
 *
 * Alles is voorspelbaar: de toevalsgenerator wordt per beslissing gezaaid met het spelnummer en de
 * openbare toestand, zodat een opgeslagen spel bij het herstellen precies hetzelfde verloopt.
 */

/*
 * Afstelling. Gemeten met een paar honderd spellen tegen de gewone computerspelers; meer rekenwerk
 * helpt nog iets, maar dit past op een telefoon in de browser (ongeveer 0,1 seconde per beslissing).
 */

/** Aantal na te spelen kaartbeurten per beslissing; bepaalt de rekentijd. */
private const val PLAY_BUDGET = 6000

/** Hoogstens zoveel verdelingen per beslissing (alleen van belang als er weinig kaarten over zijn). */
private const val MAX_WORLDS = 120

/** Verdelingen worden in groepjes van deze grootte getrokken; daarna kan de helft van de keuzes afvallen. */
private const val CHUNK = 8

/** Aantal voorspellingen dat naast die van de gewone computerspeler volledig wordt doorgerekend. */
private const val EXTRA_BIDS = 3

/** Er worden zoveel keer meer verdelingen getrokken als er worden uitgespeeld; de best passende blijven over. */
private const val OVERSAMPLE = 6

/** Hoe ver een voorspelling van de schatting bij een getrokken hand af mag liggen (standaardafwijking). */
private const val BID_SPREAD = 0.7

/** Rondescore voor een voorspelling en het aantal gehaalde slagen (zoals BerekenScore). */
internal fun Rules.roundScore(bid: Int, tricks: Int): Int {
    if (tricks == bid) return 10 + pointsPerTrick * bid
    if (wrongScoresZero && penaltyPerTrick == 0) return 0
    var s = if (wrongScoresZero) 0 else 10
    s -= penaltyPerTrick * abs(tricks - bid)
    if (!negativeScores && s < 0) s = 0
    return s
}

/** Levert elk aantal slagen van [tricks] tot en met [tricks] + [remaining] dezelfde score op? */
private fun Rules.scoreIsFixed(bid: Int, tricks: Int, remaining: Int): Boolean {
    val s = roundScore(bid, tricks)
    for (t in tricks + 1..tricks + remaining) if (roundScore(bid, t) != s) return false
    return true
}

/** Voorspelling van de sterkere computerspeler [pl]. */
internal fun Game.smartBid(pl: Int): Int {
    val n = cardsThisRound
    val usual = legalBid(estimate(pl))
    val forbidden = if (!rules.roundingAllowed && nextPlayer(pl) == leader) tricksOver else -1
    val search = Search(this, pl, 0, isBid = true)

    // Eerst met de gewone voorspelling: hoeveel slagen haalt deze hand ongeveer?
    val tricksSeen = IntArray(n + 1)
    for (holders in search.drawWorlds()) {
        search.rollout(holders, usual)
        tricksSeen[simulator.p[pl].tricks]++
    }

    // De voorspellingen die volgens die verdeling het meest opleveren, worden daarna echt doorgerekend.
    val others = (0..n)
        .filter { it != usual && it != forbidden }
        .map { b -> b to (0..n).sumOf { t -> tricksSeen[t] * rules.roundScore(b, t) } }
        .sortedByDescending { it.second }
        .take(EXTRA_BIDS)
        .map { it.first }
    return search.best(listOf(usual) + others)
}

/** Kaartkeuze van de sterkere computerspeler [pl]: de plaats van de kaart in de hand. */
internal fun Game.smartCard(pl: Int): Int {
    val usual = chooseCardComputer(pl)
    findPossibleCards(pl)
    if (possibleCount == 1) return usual
    // Al nat (of al zeker goed): dan maakt de kaart voor de eigen score niets meer uit.
    val me = p[pl]
    if (rules.scoreIsFixed(me.bid, me.tricks, cardsRemaining)) return usual

    // Kaarten die even goed zijn (bijvoorbeeld vrouw en heer als de boer al weg is) maar één keer proberen.
    val hand = p[pl].hand
    val candidates = ArrayList<Int>()
    candidates.add(usual)
    for (i in 1..possibleCount) {
        val slot = possible[i]
        if (candidates.none { equivalent(pl, hand[it], hand[slot]) }) candidates.add(slot)
    }
    if (candidates.size == 1) return usual
    return Search(this, pl, 1, isBid = false).best(candidates)
}

/**
 * Eén beslissing van speler [pl]: trekt verdelingen en speelt de keuzes daarin uit.
 * Een keuze is een voorspelling ([isBid]) of de plaats van een kaart in de hand.
 */
private class Search(private val game: Game, private val pl: Int, kind: Int, private val isBid: Boolean) {
    private val rng = Random(game.decisionSeed(pl, kind))
    private val worlds = WorldSampler(game, pl)
    private val sim = game.simulator

    /** Aantal nagespeelde kaartbeurten tot nu toe. */
    private var plays = 0

    fun drawWorlds(): List<IntArray> = worlds.plausible(sim, rng, CHUNK)

    /** Speelt keuze [option] uit in de verdeling [holders] en geeft de rondescore van [pl]. */
    fun rollout(holders: IntArray, option: Int): Int {
        worlds.load(sim, holders)
        if (isBid) return playOut(option)
        sim.playCard(option)
        plays++
        return playOut(-1)
    }

    /**
     * Kiest de keuze met de hoogste totale score; de eerste in [options] is die van de gewone
     * computerspeler en wint bij gelijke stand. Na elk groepje verdelingen valt de slechtste helft af,
     * zodat de rekentijd vooral naar de moeilijke keuzes gaat.
     */
    fun best(options: List<Int>): Int {
        val sums = IntArray(options.size)
        var live = options.indices.toList()
        var count = 0
        while (count < MAX_WORLDS && (count == 0 || plays < PLAY_BUDGET)) {
            for (holders in drawWorlds()) {
                for (i in live) sums[i] += rollout(holders, options[i])
                count++
            }
            if (live.size > 2) {
                live = live.sortedWith(compareByDescending<Int> { sums[it] }.thenBy { it }).take((live.size + 1) / 2)
            }
            if (live.size == 1) break
        }
        var best = live.first()
        for (i in live) {
            if (sums[i] > sums[best] || (sums[i] == sums[best] && i < best)) best = i
        }
        return options[best]
    }

    /**
     * Speelt de ronde in de rekenkopie uit met de gewone computerspelers en geeft de rondescore van [pl].
     * Is [bid] niet -1, dan voorspelt [pl] dat aantal in plaats van de gewone voorspelling.
     * Er wordt gestopt zodra de score van [pl] niet meer kan veranderen.
     */
    private fun playOut(bid: Int): Int {
        val me = sim.p[pl]
        while (true) {
            when (sim.phase) {
                Phase.BIDDING -> {
                    val nr = sim.toBid
                    val q = sim.p[nr]
                    q.estimate = sim.estimate(nr)
                    q.bid = if (nr == pl && bid >= 0) bid else sim.legalBid(q.estimate)
                    sim.bidPlaced()
                }
                Phase.PLAYING -> {
                    sim.playCard(sim.chooseCardComputer(sim.toPlay))
                    plays++
                }
                Phase.TRICK_COMPLETE -> {
                    sim.collectTrick()
                    if (sim.phase == Phase.PLAYING && game.rules.scoreIsFixed(me.bid, me.tricks, sim.cardsRemaining)) break
                }
                else -> break
            }
        }
        return game.rules.roundScore(me.bid, me.tricks)
    }
}

/**
 * Zijn twee kaarten van dezelfde kleur voor [pl] uitwisselbaar? Dat is zo als elke kaart daartussen
 * in de eigen hand zit, al is weggelegd of de troefkaart is (kaarten op tafel tellen wel mee).
 */
private fun Game.equivalent(pl: Int, a: Card, b: Card): Boolean {
    if (a.suit != b.suit) return false
    val lo = minOf(a.rank, b.rank)
    val hi = maxOf(a.rank, b.rank)
    for (r in lo + 1 until hi) {
        val w = whereIsCard[a.suit][r]
        if (w != pl && w != -3 && w != -1) return false
    }
    return true
}

/** Zaadje voor de toevalsgenerator van één beslissing, alleen uit openbare gegevens. */
private fun Game.decisionSeed(pl: Int, kind: Int): Long {
    var h = seed xor 0x2545F4914F6CDD1DL
    fun mix(v: Int) {
        h = (h xor v.toLong()) * -7046029254386353131L
        h = h xor (h ushr 31)
    }
    mix(round)
    mix(trickNumber)
    mix(pl)
    mix(kind)
    mix(numberBid)
    for (nr in 1..4) mix(table[nr].code)
    for (s in 1..4) {
        for (r in 2..14) {
            if (whereIsCard[s][r] == -3) mix(100 * s + r)
        }
    }
    return h
}

/**
 * Trekt verdelingen van de kaarten die speler [pl] niet kan zien. Een verdeling is per onbekende kaart
 * de houder: 0 = stapel, anders een speler. Spelers krijgen nooit een kleur waarvan bekend is dat ze die niet hebben.
 */
private class WorldSampler(private val game: Game, private val pl: Int) {
    /** De onbekende kaarten, de meest beperkte kleuren eerst. */
    private val pool: Array<Card>
    private val need = IntArray(5)
    private val excluded = Array(5) { BooleanArray(5) }

    init {
        val unknown = ArrayList<Card>()
        for (s in 1..4) {
            for (r in 2..14) {
                val w = game.whereIsCard[s][r]
                // Openbaar: troefkaart (-1), tafel (-2) en weg (-3). De rest is onbekend, op de eigen hand na.
                if (w >= 0 && w != pl) unknown.add(Card(s, r))
            }
        }
        var dealt = 0
        for (nr in 1..4) {
            if (nr == pl) continue
            need[nr] = game.p[nr].cardCount
            dealt += need[nr]
            for (s in 1..4) excluded[nr][s] = game.p[nr].hasNoSuit[s]
        }
        need[0] = unknown.size - dealt
        check(need[0] >= 0) { "Te weinig onbekende kaarten" }
        pool = unknown.sortedByDescending { c -> (1..4).count { excluded[it][c.suit] } }.toTypedArray()
    }

    private val left = IntArray(5)

    /**
     * Trekt [count] verdelingen. Als er al anderen voorspeld hebben, worden er meer getrokken en
     * blijven ze over naar rato van hoe goed ze bij die voorspellingen passen.
     */
    fun plausible(sim: Game, rng: Random, count: Int): List<IntArray> {
        val bidders = (1..4).filter { it != pl && game.p[it].bid >= 0 }
        if (bidders.isEmpty()) return List(count) { draw(rng) }
        val drawn = List(count * OVERSAMPLE) { draw(rng) }
        val weights = DoubleArray(drawn.size) { fit(sim, drawn[it], bidders) }
        val total = weights.sum()
        if (total <= 0.0) return drawn.take(count)
        // Systematisch hertrekken: verdelingen met een groot gewicht kunnen vaker voorkomen.
        val chosen = ArrayList<IntArray>(count)
        val step = total / count
        var x = rng.nextDouble() * step
        var acc = 0.0
        for (i in drawn.indices) {
            acc += weights[i]
            while (x < acc && chosen.size < count) {
                chosen.add(drawn[i])
                x += step
            }
        }
        while (chosen.size < count) chosen.add(drawn.last())
        return chosen
    }

    /** Hoe goed past deze verdeling bij de voorspellingen van [bidders]? Tussen 0 en 1. */
    private fun fit(sim: Game, holders: IntArray, bidders: List<Int>): Double {
        sim.loadPublicState(game)
        sim.suitTimesLed.fill(0)
        sim.leader = game.roundStarter
        sim.cardsRemaining = game.cardsThisRound
        var penalty = 0.0
        for (nr in bidders) {
            // De hand zoals die bij het voorspellen was: wat de speler nu heeft plus wat hij al heeft opgelegd.
            val hand = sim.p[nr].hand
            hand.fill(Card.NONE)
            var k = 0
            for (i in pool.indices) if (holders[i] == nr) hand[++k] = pool[i]
            for (s in 1..4) for (r in 2..14) if (game.playedBy[s][r] == nr) hand[++k] = Card(s, r)
            // Wie had er vóór deze speler voorspeld?
            var before = 0
            var total = 0
            var other = game.roundStarter
            while (other != nr) {
                before++
                total += game.p[other].bid
                other = game.nextPlayer(other)
            }
            sim.numberBid = before
            sim.totalBid = total
            val d = sim.estimate(nr) - game.p[nr].bid
            penalty += d * d
        }
        return exp(-penalty / (2 * BID_SPREAD * BID_SPREAD))
    }

    fun draw(rng: Random): IntArray {
        val holders = IntArray(pool.size)
        for (attempt in 0 until 40) {
            if (tryDraw(rng, holders, attempt < 30)) return holders
        }
        error("Geen verdeling gevonden")
    }

    /** Elke kaart gaat naar een toegestane houder, naar rato van het aantal kaarten dat die nog krijgt. */
    private fun tryDraw(rng: Random, holders: IntArray, respectVoids: Boolean): Boolean {
        need.copyInto(left)
        for (i in pool.indices) {
            val suit = pool[i].suit
            var total = 0
            for (h in 0..4) {
                if (respectVoids && excluded[h][suit]) continue
                total += left[h]
            }
            if (total == 0) return false
            var x = rng.nextInt(total)
            var h = 0
            while (true) {
                if (!(respectVoids && excluded[h][suit])) {
                    if (x < left[h]) break
                    x -= left[h]
                }
                h++
            }
            holders[i] = h
            left[h]--
        }
        return true
    }

    /** Zet de rekenkopie op de huidige toestand met deze verdeling. */
    fun load(sim: Game, holders: IntArray) {
        sim.loadPublicState(game)
        val own = game.p[pl].hand
        val mine = sim.p[pl].hand
        for (k in 1..13) {
            mine[k] = own[k]
            if (!own[k].isNone) sim.whereIsCard[own[k].suit][own[k].rank] = pl
        }
        val next = IntArray(5)
        for (i in pool.indices) {
            val h = holders[i]
            val c = pool[i]
            sim.whereIsCard[c.suit][c.rank] = h
            if (h > 0) sim.p[h].hand[++next[h]] = c
        }
    }
}
