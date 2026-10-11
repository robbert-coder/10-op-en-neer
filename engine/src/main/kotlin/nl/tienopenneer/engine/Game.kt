package nl.tienopenneer.engine

import kotlin.random.Random

/** De geluiden uit het origineel, met de gebeurtenis waarbij ze klonken. */
enum class Sound {
    SLAG_TE_VEEL,
    SLAG_TE_WEINIG,
    ONVOORKOMBARE_ONDERGANG,
    GOED_VOORSPELD,
    MEDESPELER_NAT,
    GOED_GESPEELD,
    ZEER_GOED_GESPEELD,
}

enum class Phase {
    /** Een speler moet het aantal slagen voorspellen ([Game.toBid]). */
    BIDDING,

    /** Een speler moet een kaart opleggen ([Game.toPlay]). */
    PLAYING,

    /** Alle vier kaarten liggen op tafel; [Game.advance] geeft de slag aan de winnaar. */
    TRICK_COMPLETE,

    /** De ronde is gespeeld en de score is berekend; [Game.advance] start de volgende ronde. */
    ROUND_COMPLETE,

    GAME_OVER,
}

class Player internal constructor(val number: Int, var name: String, val isHuman: Boolean) {
    /** Kaarten in de hand, plaats 1..13 (plaats 0 is ongebruikt). Opgelegde kaarten worden [Card.NONE]. */
    internal val hand = Array(14) { Card.NONE }
    internal val legal = BooleanArray(14)

    var cardCount = 0
        internal set
    var tricks = 0
        internal set

    /** Voorspelling in deze ronde, -1 = nog niet voorspeld. */
    var bid = -1
        internal set
    internal var estimate = 0.0

    var total = 0
        internal set
    var rank = 0
        internal set

    /** Per ronde (1..25): de punten, -1 = nog niet gespeeld. */
    internal val roundScore = IntArray(26) { -1 }

    /** Per ronde: true als de voorspelling fout was en de score doorgestreept getoond wordt. */
    internal val roundCrossed = BooleanArray(26)
    internal val roundBid = IntArray(26) { -1 }
    internal val roundTricks = IntArray(26) { -1 }
    internal val roundGood = BooleanArray(26)

    /** Weet iedereen dat deze speler deze kleur niet meer heeft? */
    internal val hasNoSuit = BooleanArray(5)

    fun handCards(): List<Card> = (1..13).map { hand[it] }.filter { !it.isNone }
    fun scoreForRound(round: Int): Int = roundScore[round]
    fun bidForRound(round: Int): Int = roundBid[round]
    fun tricksForRound(round: Int): Int = roundTricks[round]
    fun crossedForRound(round: Int): Boolean = roundCrossed[round]
    fun goodForRound(round: Int): Boolean = roundGood[round]
}

/**
 * Het spel "10 op en neer" / Boerenbridge voor vier spelers.
 * Speler 1 is de mens (onderaan), daarna met de klok mee 2 (links), 3 (boven) en 4 (rechts).
 *
 * De logica en de computerspelers zijn overgezet uit het Visual Basic-programma
 * "10 op en neer" van A.A. Brink (GPLv3).
 */
class Game(
    val rules: Rules,
    val seed: Long,
    names: List<String> = DEFAULT_NAMES,
) {
    internal val p: Array<Player> = Array(5) { i ->
        Player(i, if (i == 0) "" else names.getOrElse(i - 1) { DEFAULT_NAMES[i - 1] }, i == 1)
    }

    val players: List<Player> get() = p.drop(1)
    fun player(nr: Int): Player = p[nr]

    var phase = Phase.BIDDING
        private set

    /** Ronde 1..rules.rounds */
    var round = 0
        private set

    var trump: Card = Card.NONE
        internal set

    /** Kaarten op tafel per speler (index 1..4). */
    internal val table = Array(5) { Card.NONE }
    internal val lastTrickCards = Array(5) { Card.NONE }

    /** Speler die de laatste (afgeronde) slag kreeg, 0 = nog geen. */
    var lastTrickWinner = 0
        private set
    var lastTrickLeader = 0
        private set

    internal var highestOnTable = 0

    /** De speler die de slag krijgt zodra alle vier kaarten op tafel liggen, anders 0. */
    val trickWinner: Int get() = if (phase == Phase.TRICK_COMPLETE) highestOnTable else 0

    /** -3 = weg, -2 = tafel, -1 = troef, 0 = stapel, 1..4 = in handen van speler. */
    internal val whereIsCard = Array(5) { IntArray(15) }

    /** Speler die moet uitkomen. */
    var leader = 1
        internal set

    /** Speler die nu een kaart moet opleggen. */
    var toPlay = 1
        internal set

    /** Speler die nu moet voorspellen. */
    var toBid = 1
        internal set

    internal val suitTimesLed = IntArray(5)
    internal var totalBid = 0
    internal var numberBid = 0
    var trickNumber = 0
        private set

    /** Aantal kaarten min het totaal van de voorspellingen tot nu toe. */
    var tricksOver = 0
        private set

    /** Aantal slagen dat in deze ronde nog gespeeld moet worden. */
    internal var cardsRemaining = 0

    /** Statusregel zoals in de statusbalk van het origineel. */
    var status: String = ""
        private set

    /** Logboek van de handelingen van de mens; daarmee kan een spel worden hersteld. */
    private val humanLog = mutableListOf<Int>()
    val humanActions: List<Int> get() = humanLog

    private val sounds = mutableListOf<Sound>()
    private var doomSoundPlayed = false

    /** Geeft de geluiden die sinds de vorige aanroep zijn ontstaan, en leegt de lijst. */
    fun takeSounds(): List<Sound> = sounds.toList().also { sounds.clear() }

    private val dealtHands = Array(26) { Array(5) { Array(14) { Card.NONE } } }
    private val dealtTrumps = Array(26) { Card.NONE }
    private var whoStarts = 1

    // Werkvariabelen van de computerspelers
    internal val possible = IntArray(14)
    internal var possibleCount = 0
    internal val canWinWith = IntArray(14)
    internal var canWinCount = 0
    internal val cannotWinWith = IntArray(14)
    internal var cannotWinCount = 0
    internal val legalNonTrumps = IntArray(14)
    internal var legalNonTrumpCount = 0

    init {
        dealWholeGame()
        startRound()
    }

    val cardsThisRound: Int get() = rules.cardsInRound(round)

    fun tableCard(player: Int): Card = table[player]
    fun lastTrickCard(player: Int): Card = lastTrickCards[player]

    val isHumanTurn: Boolean
        get() = (phase == Phase.BIDDING && toBid == 1) || (phase == Phase.PLAYING && toPlay == 1)

    /** Kan de computer of het spel zelf verder (zonder invoer van de mens)? */
    val canAdvance: Boolean
        get() = phase != Phase.GAME_OVER && !isHumanTurn

    /** "2 over", "Rond" of "1 te weinig"; tussen haakjes zolang nog niet iedereen voorspeld heeft. */
    fun tricksOverText(): String {
        val t = when {
            tricksOver < 0 -> "${-tricksOver} te weinig"
            tricksOver == 0 -> "Rond"
            else -> "$tricksOver over"
        }
        return if (numberBid < 4) "($t)" else t
    }

    // ------------------------------------------------------------------------------------------
    // Verloop van het spel
    // ------------------------------------------------------------------------------------------

    /** Voert één stap uit die niet van de mens afhangt. Geeft false als er niets te doen was. */
    fun advance(): Boolean {
        when (phase) {
            Phase.BIDDING -> {
                if (toBid == 1) return false
                val pl = p[toBid]
                pl.estimate = estimate(toBid)
                pl.bid = legalBid(pl.estimate)
                bidPlaced()
            }
            Phase.PLAYING -> {
                if (toPlay == 1) return false
                status = "${p[toPlay].name} is aan de beurt."
                playCard(chooseCardComputer(toPlay))
            }
            Phase.TRICK_COMPLETE -> collectTrick()
            Phase.ROUND_COMPLETE -> {
                if (round == rules.rounds) {
                    phase = Phase.GAME_OVER
                    status = "Het spel is afgelopen."
                } else {
                    startRound()
                }
            }
            Phase.GAME_OVER -> return false
        }
        return true
    }

    /** Is [n] een toegestane voorspelling voor de mens? Geeft een foutmelding of null. */
    fun checkHumanBid(n: Int): String? {
        if (phase != Phase.BIDDING || toBid != 1) return "Je bent nu niet aan de beurt om te voorspellen."
        if (n < 0 || n > cardsThisRound) return "Je kunt 0 t/m $cardsThisRound slagen voorspellen."
        if (!rules.roundingAllowed && isLastBidder(1) && n == tricksOver) {
            return "Rondmaken is niet toegestaan: je mag geen $n zeggen."
        }
        return null
    }

    /** De voorspelling die volgens de rondmaakregel verboden is voor de mens, of null. */
    fun forbiddenHumanBid(): Int? =
        if (!rules.roundingAllowed && phase == Phase.BIDDING && toBid == 1 && isLastBidder(1) &&
            tricksOver in 0..cardsThisRound
        ) tricksOver else null

    fun humanBid(n: Int): String? {
        checkHumanBid(n)?.let { return it }
        val pl = p[1]
        pl.estimate = estimate(1)
        pl.bid = n
        humanLog.add(n)
        bidPlaced()
        return null
    }

    /** Is de kaart op plaats [slot] in de hand van de mens nu speelbaar? */
    fun isLegalForHuman(slot: Int): Boolean {
        if (phase != Phase.PLAYING || toPlay != 1) return false
        findPossibleCards(1)
        return p[1].legal[slot]
    }

    fun humanPlay(card: Card): String? {
        if (phase != Phase.PLAYING || toPlay != 1) return "Je bent nog niet aan de beurt."
        val slot = (1..13).firstOrNull { p[1].hand[it] == card } ?: return "Die kaart heb je niet."
        findPossibleCards(1)
        if (!p[1].legal[slot]) {
            val leadSuit = table[leader].suit
            return if (canFollowSuit(1) && card.suit != leadSuit) {
                "Je moet kleur bekennen. Kies een ${Card.suitName(leadSuit)}."
            } else {
                "Je moet introeven. Kies een ${Card.suitName(trump.suit)}."
            }
        }
        humanLog.add(card.code)
        playCard(slot)
        return null
    }

    /** Tip voor de mens: de voorspelling die de computer zou doen. */
    fun hintBid(): Int = legalBid(estimate(1))

    /** Tip voor de mens: de kaart die de computer zou spelen. */
    fun hintCard(): Card? =
        if (phase == Phase.PLAYING && toPlay == 1) p[1].hand[chooseCardComputer(1)] else null

    /** De kaarten van de mens die nu gespeeld mogen worden. */
    fun legalCardsForHuman(): Set<Card> {
        if (phase != Phase.PLAYING || toPlay != 1) return emptySet()
        findPossibleCards(1)
        return (1..13).filter { p[1].legal[it] }.map { p[1].hand[it] }.toSet()
    }

    private fun isLastBidder(player: Int) = nextPlayer(player) == leader

    private fun dealWholeGame() {
        // DetermineerSpel: alle kaarten voor het hele spel worden vooraf gedeeld.
        val rnd = Random(seed)
        whoStarts = rnd.nextInt(4) + 1
        for (r in 1..rules.rounds) {
            val deck = MutableList(52) { k -> Card(k / 13 + 1, k % 13 + 2) }
            for (k in 1..rules.cardsInRound(r)) {
                for (pl in 1..4) {
                    val i = rnd.nextInt(deck.size)
                    dealtHands[r][pl][k] = deck[i]
                    deck[i] = deck[deck.size - 1]
                    deck.removeAt(deck.size - 1)
                }
            }
            dealtTrumps[r] = if (deck.isEmpty()) Card.NONE else deck[rnd.nextInt(deck.size)]
        }
    }

    private fun startRound() {
        round++
        doomSoundPlayed = false
        // ResetRondeVars + KaartenWeg
        totalBid = 0
        numberBid = 0
        trickNumber = 0
        tricksOver = cardsThisRound
        cardsRemaining = cardsThisRound
        for (pl in 1..4) {
            p[pl].bid = -1
            p[pl].tricks = 0
            p[pl].hasNoSuit.fill(false)
            table[pl] = Card.NONE
            suitTimesLed[pl] = 0
        }
        for (row in whereIsCard) row.fill(0)

        // Delen
        for (pl in 1..4) {
            for (k in 1..13) {
                p[pl].hand[k] = if (k <= cardsThisRound) dealtHands[round][pl][k] else Card.NONE
                p[pl].legal[k] = false
            }
            for (k in 1..cardsThisRound) {
                val c = p[pl].hand[k]
                whereIsCard[c.suit][c.rank] = pl
            }
            p[pl].cardCount = cardsThisRound
        }
        trump = dealtTrumps[round]
        if (!trump.isNone) whereIsCard[trump.suit][trump.rank] = -1
        sortHand(1)

        leader = (whoStarts + round + 2) % 4 + 1
        toPlay = leader
        toBid = leader
        phase = Phase.BIDDING
        status = "${p[previousPlayer(leader)].name} deelt de kaarten."
    }

    /** Sorteert een hand op kleur en getal (Sorteren). */
    internal fun sortHand(pl: Int, descending: Boolean = false) {
        val cards = (1..cardsThisRound).map { p[pl].hand[it] }.sortedBy { c ->
            if (c.isNone) 999 else 13 * (c.suit - 1) + if (descending) 14 - c.rank else c.rank
        }
        for (k in 1..cardsThisRound) p[pl].hand[k] = cards[k - 1]
    }

    private fun bidPlaced() {
        // Voorspeld
        val pl = p[toBid]
        totalBid += pl.bid
        tricksOver -= pl.bid
        numberBid++
        pl.roundBid[round] = pl.bid
        status = "${pl.name} voorspelt ${pl.bid} ${if (pl.bid == 1) "slag" else "slagen"}."
        toBid = nextPlayer(toBid)
        if (toBid == leader) {
            trickNumber = 1
            toPlay = leader
            phase = Phase.PLAYING
            checkHumanDoom()
        }
    }

    /** KaartLeggen */
    private fun playCard(slot: Int) {
        val pl = p[toPlay]
        val card = pl.hand[slot]
        check(!card.isNone) { "Geen kaart op plaats $slot" }
        table[toPlay] = card
        pl.hand[slot] = Card.NONE
        whereIsCard[card.suit][card.rank] = -2
        pl.cardCount--

        val leadSuit = table[leader].suit
        if (card.suit != leadSuit) {
            pl.hasNoSuit[leadSuit] = true
            if (rules.mustTrump && card.suit != trump.suit && trump.suit != 0) {
                pl.hasNoSuit[trump.suit] = true
            }
        }
        if (toPlay == leader) {
            suitTimesLed[card.suit]++
            highestOnTable = toPlay
        } else if (higherCard(table[highestOnTable], card) == 2) {
            highestOnTable = toPlay
        }
        status = "${pl.name} legt ${card.describe()} op."

        toPlay = nextPlayer(toPlay)
        if (toPlay == leader) {
            phase = Phase.TRICK_COMPLETE
            status = "De slag is voor ${p[highestOnTable].name}."
        } else {
            checkHumanDoom()
        }
    }

    /** SlagNaarHoogste */
    private fun collectTrick() {
        cardsRemaining--
        val winner = highestOnTable
        p[winner].tricks++
        for (pl in 1..4) {
            lastTrickCards[pl] = table[pl]
            val c = table[pl]
            if (!c.isNone) whereIsCard[c.suit][c.rank] = -3
            table[pl] = Card.NONE
        }
        lastTrickLeader = leader
        lastTrickWinner = winner
        trickNumber++
        trickSounds(winner)

        if (cardsRemaining == 0) {
            computeScore()
            computeRanks()
            phase = Phase.ROUND_COMPLETE
            status = if (round == rules.rounds) "Het spel is afgelopen." else "Ronde $round is afgelopen."
        } else {
            leader = winner
            toPlay = winner
            phase = Phase.PLAYING
            status = "${p[winner].name} moet uitkomen."
            checkHumanDoom()
        }
    }

    /** KaartKiezen: geluid als de mens zijn voorspelling onmogelijk nog kan halen. */
    private fun checkHumanDoom() {
        if (phase != Phase.PLAYING || toPlay != 1) return
        findPossibleCards(1)
        testTrickWinnable(1)
        val me = p[1]
        val stillNeeded = me.bid - me.tricks
        if ((stillNeeded == me.cardCount && canWinCount == 0) ||
            (stillNeeded == 0 && cannotWinCount == 0 && leader == nextPlayer(1))
        ) {
            doomSoundPlayed = true
            sounds.add(Sound.ONVOORKOMBARE_ONDERGANG)
        }
    }

    /** SlagNaarHoogste: geluiden na een slag. */
    private fun trickSounds(winner: Int) {
        val otherWet = (2..4).any { nr ->
            val o = p[nr]
            (winner == nr && o.tricks == o.bid + 1) || (o.bid - o.tricks == o.cardCount + 1)
        }
        if (otherWet) sounds.add(Sound.MEDESPELER_NAT)
        val me = p[1]
        if (winner == 1 && me.tricks == me.bid + 1) {
            if (!doomSoundPlayed) sounds.add(Sound.SLAG_TE_VEEL)
        } else if (winner != 1 && me.bid - me.tricks == me.cardCount + 1) {
            if (!doomSoundPlayed) sounds.add(Sound.SLAG_TE_WEINIG)
        } else if (me.bid == me.tricks && me.cardCount == 0) {
            sounds.add(Sound.GOED_VOORSPELD)
        }
    }

    /** BerekenScore */
    private fun computeScore() {
        for (nr in 1..4) {
            val pl = p[nr]
            pl.roundTricks[round] = pl.tricks
            if (pl.tricks == pl.bid) {
                pl.roundScore[round] = 10 + rules.pointsPerTrick * pl.bid
                pl.roundGood[round] = true
                pl.total += pl.roundScore[round]
            } else {
                pl.roundGood[round] = false
                if (rules.wrongScoresZero && rules.penaltyPerTrick == 0) {
                    // Wordt getoond als de doorgestreepte voorspelling en levert niets op
                    pl.roundScore[round] = 0
                    pl.roundCrossed[round] = true
                } else {
                    var s = if (rules.wrongScoresZero) 0 else 10
                    s -= rules.penaltyPerTrick * kotlin.math.abs(pl.tricks - pl.bid)
                    if (!rules.negativeScores && s < 0) s = 0
                    pl.roundScore[round] = s
                    pl.roundCrossed[round] = false
                    pl.total += s
                }
            }
        }
    }

    /** BepaalRangen */
    private fun computeRanks() {
        val sorted = (1..4).sortedByDescending { p[it].total }
        p[sorted[0]].rank = 1
        for (i in 1..3) {
            p[sorted[i]].rank =
                if (p[sorted[i]].total == p[sorted[i - 1]].total) p[sorted[i - 1]].rank else i + 1
        }
    }

    // ------------------------------------------------------------------------------------------
    // Hulpfuncties uit het origineel
    // ------------------------------------------------------------------------------------------

    /** HoogsteKaart: 2 als [card2] hoger is dan [card1], anders 1. */
    internal fun higherCard(card1: Card, card2: Card): Int = when {
        card2.rank > card1.rank && card1.suit == card2.suit -> 2
        card2.suit == trump.suit && card1.suit != trump.suit -> 2
        else -> 1
    }

    /** KanKleurBekennen */
    internal fun canFollowSuit(pl: Int): Boolean {
        if (pl == leader) return false
        val leadSuit = table[leader].suit
        return (1..cardsThisRound).any { p[pl].hand[it].suit == leadSuit && !p[pl].hand[it].isNone }
    }

    /** KanIntroeven */
    internal fun canTrump(pl: Int): Boolean {
        if (pl == leader || trump.isNone) return false
        return (1..cardsThisRound).any { p[pl].hand[it].suit == trump.suit && !p[pl].hand[it].isNone }
    }

    /** ZoekMogelijkeKaarten */
    internal fun findPossibleCards(pl: Int) {
        possibleCount = 0
        legalNonTrumpCount = 0
        val follow = canFollowSuit(pl)
        val trumpIn = canTrump(pl)
        val leadSuit = table[leader].suit
        for (k in 1..cardsThisRound) {
            val c = p[pl].hand[k]
            if (c.isNone) {
                p[pl].legal[k] = false
                continue
            }
            val legal = when {
                follow -> c.suit == leadSuit
                trumpIn && rules.mustTrump -> c.suit == trump.suit
                else -> true
            }
            p[pl].legal[k] = legal
            if (legal) possible[++possibleCount] = k
            if (c.suit != trump.suit && legal) legalNonTrumps[++legalNonTrumpCount] = k
        }
    }

    /** TestSlagTeHalen */
    internal fun testTrickWinnable(pl: Int) {
        canWinCount = 0
        cannotWinCount = 0
        for (i in 1..possibleCount) {
            val k = possible[i]
            if (pl == leader) {
                if (!p[pl].hand[k].isNone) canWinWith[++canWinCount] = k
            } else if (higherCard(table[highestOnTable], p[pl].hand[k]) == 2) {
                canWinWith[++canWinCount] = k
            } else {
                cannotWinWith[++cannotWinCount] = k
            }
        }
    }

    fun nextPlayer(pl: Int): Int = pl % 4 + 1
    fun previousPlayer(pl: Int): Int = (pl + 2) % 4 + 1

    companion object {
        val DEFAULT_NAMES = listOf("Speler", "Henk", "Truus", "Kees")

        /** Herstelt een spel door de handelingen van de mens opnieuw af te spelen. */
        fun restore(rules: Rules, seed: Long, names: List<String>, humanActions: List<Int>): Game {
            val g = Game(rules, seed, names)
            for (action in humanActions) {
                while (g.canAdvance) g.advance()
                val error = if (action >= 100) g.humanPlay(Card.fromCode(action)) else g.humanBid(action)
                check(error == null) { "Opgeslagen spel kan niet hersteld worden: $error" }
            }
            g.sounds.clear()
            return g
        }
    }
}

/** "de klaver vrouw", "de harten tien" */
fun Card.describe(): String = "${Card.suitName(suit)} ${Card.rankName(rank)}"
