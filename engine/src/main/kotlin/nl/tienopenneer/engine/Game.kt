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
 * Het spel "10 op en neer" / Boerenbridge voor twee tot vijf spelers (gewoonlijk vier).
 * Speler 1 is de mens (onderaan), daarna met de klok mee 2 (links), 3 (boven) en 4 (rechts); bij vijf
 * spelers zit speler 5 ook rechts.
 *
 * De logica en de computerspelers zijn overgezet uit het Visual Basic-programma
 * "10 op en neer" van A.A. Brink (GPLv3).
 */
class Game internal constructor(
    val rules: Rules,
    val seed: Long,
    names: List<String>,
    /** Spelen de computerspelers (en de tips) met de sterkere [SmartPlayer]? */
    val smartComputers: Boolean,
    /** Een rekenkopie voor de sterkere computerspeler: er wordt niet gedeeld en er is geen status of geluid. */
    private val simulation: Boolean,
    /** Aantal spelers aan tafel: 2 tot 5 (gewoonlijk 4). */
    val playerCount: Int,
) {
    constructor(
        rules: Rules,
        seed: Long,
        names: List<String> = DEFAULT_NAMES,
        smartComputers: Boolean = false,
        playerCount: Int = 4,
    ) : this(rules, seed, names, smartComputers, false, playerCount)

    init {
        require(playerCount in MIN_PLAYERS..MAX_PLAYERS) { "Er kunnen 2 tot 5 spelers meedoen" }
        require(rules.maxCards * playerCount <= 52) { "Te veel kaarten voor $playerCount spelers" }
    }

    internal val p: Array<Player> = Array(MAX_PLAYERS + 1) { i ->
        Player(i, if (i == 0) "" else names.getOrElse(i - 1) { DEFAULT_NAMES[i - 1] }, i == 1)
    }

    val players: List<Player> get() = p.slice(1..playerCount)
    fun player(nr: Int): Player = p[nr]

    var phase = Phase.BIDDING
        private set

    /** Ronde 1..rules.rounds */
    var round = 0
        private set

    var trump: Card = Card.NONE
        internal set

    /** Kaarten op tafel per speler (index 1..playerCount). */
    internal val table = Array(MAX_PLAYERS + 1) { Card.NONE }
    internal val lastTrickCards = Array(MAX_PLAYERS + 1) { Card.NONE }

    /** Speler die de laatste (afgeronde) slag kreeg, 0 = nog geen. */
    var lastTrickWinner = 0
        private set
    var lastTrickLeader = 0
        private set

    internal var highestOnTable = 0

    /** De speler die de slag krijgt zodra alle kaarten op tafel liggen, anders 0. */
    val trickWinner: Int get() = if (phase == Phase.TRICK_COMPLETE) highestOnTable else 0

    /** -3 = weg, -2 = tafel, -1 = troef, 0 = stapel, 1..playerCount = in handen van speler. Index: [kleur][getal]. */
    internal val whereIsCard = Array(5) { IntArray(15) }

    /** Wie welke kaart in deze ronde heeft opgelegd (0 = nog niet gespeeld); dat heeft iedereen gezien. */
    internal val playedBy = Array(5) { IntArray(15) }

    /** Speler die in deze ronde als eerste voorspelde en uitkwam. */
    internal var roundStarter = 1
        private set

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

    /**
     * De stoelen waar een mens zit. Normaal alleen stoel 1; bij samen spelen via internet ook andere.
     * Zetten voordat het spel begint; daarna alleen kleiner via [computerTakesOver].
     */
    var humanSeats: Set<Int> = setOf(1)

    /** Vanuit welke stoel de geluiden bedoeld zijn (wie "ik" is op dit apparaat). */
    var viewSeat: Int = 1

    private val sounds = mutableListOf<Sound>()
    private var doomSoundPlayed = false

    /** Geeft de geluiden die sinds de vorige aanroep zijn ontstaan, en leegt de lijst. */
    fun takeSounds(): List<Sound> = sounds.toList().also { sounds.clear() }

    private val dealtHands = Array(if (simulation) 0 else 26) { Array(MAX_PLAYERS + 1) { Array(14) { Card.NONE } } }
    private val dealtTrumps = Array(if (simulation) 0 else 26) { Card.NONE }
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

    /**
     * Welke spelers de sterkere computerspeler gebruiken. Plaats 1 geldt voor de tips aan de mens.
     * Standaard volgens [smartComputers]; de tests mengen hiermee beide sterktes aan één tafel.
     */
    internal val smartSeat = BooleanArray(MAX_PLAYERS + 1) { it >= 1 && smartComputers }

    /** De rekenkopie waarin [SmartPlayer] rondes uitspeelt; pas aangemaakt als die nodig is. */
    internal val simulator: Game by lazy { Game(rules, seed, DEFAULT_NAMES, false, true, playerCount) }

    init {
        if (!simulation) {
            dealWholeGame()
            startRound()
        }
    }

    val cardsThisRound: Int get() = rules.cardsInRound(round)

    fun tableCard(player: Int): Card = table[player]
    fun lastTrickCard(player: Int): Card = lastTrickCards[player]

    val isHumanTurn: Boolean
        get() = (phase == Phase.BIDDING && toBid in humanSeats) || (phase == Phase.PLAYING && toPlay in humanSeats)

    /** De stoel van de mens die nu aan de beurt is, of 0. */
    val humanToMove: Int
        get() = when {
            phase == Phase.BIDDING && toBid in humanSeats -> toBid
            phase == Phase.PLAYING && toPlay in humanSeats -> toPlay
            else -> 0
        }

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
        return if (numberBid < playerCount) "($t)" else t
    }

    // ------------------------------------------------------------------------------------------
    // Verloop van het spel
    // ------------------------------------------------------------------------------------------

    /** Voert één stap uit die niet van de mens afhangt. Geeft false als er niets te doen was. */
    fun advance(): Boolean {
        when (phase) {
            Phase.BIDDING -> {
                if (toBid in humanSeats) return false
                val pl = p[toBid]
                pl.estimate = estimate(toBid)
                pl.bid = if (smartSeat[toBid]) smartBid(toBid) else legalBid(pl.estimate)
                bidPlaced()
            }
            Phase.PLAYING -> {
                if (toPlay in humanSeats) return false
                status = "${p[toPlay].name} is aan de beurt."
                playCard(if (smartSeat[toPlay]) smartCard(toPlay) else chooseCardComputer(toPlay))
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

    /** Is [n] een toegestane voorspelling voor de mens die aan de beurt is? Geeft een foutmelding of null. */
    fun checkHumanBid(n: Int): String? {
        if (phase != Phase.BIDDING || toBid !in humanSeats) return "Je bent nu niet aan de beurt om te voorspellen."
        if (n < 0 || n > cardsThisRound) return "Je kunt 0 t/m $cardsThisRound slagen voorspellen."
        if (!rules.roundingAllowed && isLastBidder(toBid) && n == tricksOver) {
            return "Rondmaken is niet toegestaan: je mag geen $n zeggen."
        }
        return null
    }

    /** De voorspelling die volgens de rondmaakregel verboden is voor de mens, of null. */
    fun forbiddenHumanBid(seat: Int = 1): Int? =
        if (!rules.roundingAllowed && phase == Phase.BIDDING && toBid == seat && isLastBidder(seat) &&
            tricksOver in 0..cardsThisRound
        ) tricksOver else null

    /**
     * Een mens verlaat het spel (samen spelen): vanaf nu speelt de computer op [seat]. Staat in het
     * logboek als -seat, zodat iedereen het op hetzelfde moment in het spel doet.
     */
    fun computerTakesOver(seat: Int): String? {
        if (seat !in humanSeats || seat !in 1..playerCount) return "Stoel $seat is geen mens."
        humanSeats = humanSeats - seat
        humanLog.add(-seat)
        return null
    }

    fun humanBid(n: Int): String? {
        checkHumanBid(n)?.let { return it }
        val pl = p[toBid]
        pl.estimate = estimate(toBid)
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

    /** Legt een kaart op voor de mens die aan de beurt is. Geeft een foutmelding of null. */
    fun humanPlay(card: Card): String? {
        if (phase != Phase.PLAYING || toPlay !in humanSeats) return "Je bent nog niet aan de beurt."
        val me = toPlay
        val slot = (1..13).firstOrNull { p[me].hand[it] == card } ?: return "Die kaart heb je niet."
        findPossibleCards(me)
        if (!p[me].legal[slot]) {
            val leadSuit = table[leader].suit
            return if (canFollowSuit(me) && card.suit != leadSuit) {
                "Je moet kleur bekennen. Kies een ${Card.suitName(leadSuit)}."
            } else {
                "Je moet introeven. Kies een ${Card.suitName(trump.suit)}."
            }
        }
        humanLog.add(card.code)
        playCard(slot)
        return null
    }

    /** Tip voor de mens op stoel [seat]: de voorspelling van de sterke computerspeler. */
    fun hintBid(seat: Int = 1): Int =
        if (phase == Phase.BIDDING && toBid == seat) smartBid(seat) else legalBid(estimate(seat))

    /** Tip voor de mens op stoel [seat]: de kaart die de sterke computerspeler zou spelen. */
    fun hintCard(seat: Int = 1): Card? =
        if (phase == Phase.PLAYING && toPlay == seat) {
            p[seat].hand[smartCard(seat, forHint = true)]
        } else {
            null
        }

    /** De kaarten van de mens op stoel [seat] die nu gespeeld mogen worden. */
    fun legalCardsForHuman(seat: Int = 1): Set<Card> {
        if (phase != Phase.PLAYING || toPlay != seat) return emptySet()
        findPossibleCards(seat)
        return (1..13).filter { p[seat].legal[it] }.map { p[seat].hand[it] }.toSet()
    }

    private fun isLastBidder(player: Int) = nextPlayer(player) == leader

    private fun dealWholeGame() {
        // DetermineerSpel: alle kaarten voor het hele spel worden vooraf gedeeld.
        val rnd = Random(seed)
        whoStarts = rnd.nextInt(playerCount) + 1
        for (r in 1..rules.rounds) {
            val deck = MutableList(52) { k -> Card(k / 13 + 1, k % 13 + 2) }
            for (k in 1..rules.cardsInRound(r)) {
                for (pl in 1..playerCount) {
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
        for (pl in 1..playerCount) {
            p[pl].bid = -1
            p[pl].tricks = 0
            p[pl].hasNoSuit.fill(false)
            table[pl] = Card.NONE
        }
        suitTimesLed.fill(0)
        for (row in whereIsCard) row.fill(0)
        for (row in playedBy) row.fill(0)

        // Delen
        for (pl in 1..playerCount) {
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

        leader = (whoStarts + round + playerCount - 2) % playerCount + 1
        roundStarter = leader
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

    internal fun bidPlaced() {
        // Voorspeld
        val pl = p[toBid]
        totalBid += pl.bid
        tricksOver -= pl.bid
        numberBid++
        pl.roundBid[round] = pl.bid
        if (!simulation) status = "${pl.name} voorspelt ${pl.bid} ${if (pl.bid == 1) "slag" else "slagen"}."
        toBid = nextPlayer(toBid)
        if (toBid == leader) {
            trickNumber = 1
            toPlay = leader
            phase = Phase.PLAYING
            checkHumanDoom()
        }
    }

    /** KaartLeggen */
    internal fun playCard(slot: Int) {
        val pl = p[toPlay]
        val card = pl.hand[slot]
        check(!card.isNone) { "Geen kaart op plaats $slot" }
        table[toPlay] = card
        pl.hand[slot] = Card.NONE
        whereIsCard[card.suit][card.rank] = -2
        if (!simulation) playedBy[card.suit][card.rank] = toPlay
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
        if (!simulation) status = "${pl.name} legt ${card.describe()} op."

        toPlay = nextPlayer(toPlay)
        if (toPlay == leader) {
            phase = Phase.TRICK_COMPLETE
            if (!simulation) status = "De slag is voor ${p[highestOnTable].name}."
        } else {
            checkHumanDoom()
        }
    }

    /** SlagNaarHoogste */
    internal fun collectTrick() {
        cardsRemaining--
        val winner = highestOnTable
        p[winner].tricks++
        for (pl in 1..playerCount) {
            lastTrickCards[pl] = table[pl]
            val c = table[pl]
            if (!c.isNone) whereIsCard[c.suit][c.rank] = -3
            table[pl] = Card.NONE
        }
        lastTrickLeader = leader
        lastTrickWinner = winner
        trickNumber++
        if (simulation) {
            // In de rekenkopie telt alleen wie welke slagen haalt.
            if (cardsRemaining == 0) {
                phase = Phase.ROUND_COMPLETE
            } else {
                leader = winner
                toPlay = winner
                phase = Phase.PLAYING
            }
            return
        }
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
        if (simulation || phase != Phase.PLAYING || toPlay != viewSeat) return
        findPossibleCards(viewSeat)
        testTrickWinnable(viewSeat)
        val me = p[viewSeat]
        val stillNeeded = me.bid - me.tricks
        if ((stillNeeded == me.cardCount && canWinCount == 0) ||
            (stillNeeded == 0 && cannotWinCount == 0 && leader == nextPlayer(viewSeat))
        ) {
            doomSoundPlayed = true
            sounds.add(Sound.ONVOORKOMBARE_ONDERGANG)
        }
    }

    /** SlagNaarHoogste: geluiden na een slag. */
    private fun trickSounds(winner: Int) {
        val otherWet = (1..playerCount).filter { it != viewSeat }.any { nr ->
            val o = p[nr]
            (winner == nr && o.tricks == o.bid + 1) || (o.bid - o.tricks == o.cardCount + 1)
        }
        if (otherWet) sounds.add(Sound.MEDESPELER_NAT)
        val me = p[viewSeat]
        if (winner == viewSeat && me.tricks == me.bid + 1) {
            if (!doomSoundPlayed) sounds.add(Sound.SLAG_TE_VEEL)
        } else if (winner != viewSeat && me.bid - me.tricks == me.cardCount + 1) {
            if (!doomSoundPlayed) sounds.add(Sound.SLAG_TE_WEINIG)
        } else if (me.bid == me.tricks && me.cardCount == 0) {
            sounds.add(Sound.GOED_VOORSPELD)
        }
    }

    /** BerekenScore */
    private fun computeScore() {
        for (nr in 1..playerCount) {
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
        val sorted = (1..playerCount).sortedByDescending { p[it].total }
        p[sorted[0]].rank = 1
        for (i in 1 until playerCount) {
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

    /**
     * Neemt de openbare toestand van de lopende ronde van [src] over in deze rekenkopie.
     * De handen worden leeggemaakt; [SmartPlayer] vult ze met de eigen hand en een getrokken verdeling.
     */
    internal fun loadPublicState(src: Game) {
        check(simulation)
        phase = src.phase
        round = src.round
        trump = src.trump
        leader = src.leader
        toPlay = src.toPlay
        toBid = src.toBid
        highestOnTable = src.highestOnTable
        totalBid = src.totalBid
        numberBid = src.numberBid
        trickNumber = src.trickNumber
        tricksOver = src.tricksOver
        cardsRemaining = src.cardsRemaining
        for (s in 0..4) suitTimesLed[s] = src.suitTimesLed[s]
        for (nr in 1..playerCount) {
            val a = src.p[nr]
            val b = p[nr]
            table[nr] = src.table[nr]
            b.hand.fill(Card.NONE)
            b.cardCount = a.cardCount
            b.tricks = a.tricks
            b.bid = a.bid
            b.estimate = a.estimate
            for (s in 0..4) b.hasNoSuit[s] = a.hasNoSuit[s]
        }
        // Alleen wat iedereen ziet: troefkaart, tafel en weggelegde kaarten. De rest heet "op de stapel".
        for (s in 0..4) {
            for (r in 0..14) {
                val w = src.whereIsCard[s][r]
                whereIsCard[s][r] = if (w < 0) w else 0
            }
        }
    }

    fun nextPlayer(pl: Int): Int = pl % playerCount + 1
    fun previousPlayer(pl: Int): Int = (pl + playerCount - 2) % playerCount + 1

    companion object {
        const val MIN_PLAYERS = 2
        const val MAX_PLAYERS = 5
        val DEFAULT_NAMES = listOf("Speler", "Henk", "Truus", "Kees", "Ria")

        /** Herstelt een spel door de handelingen van de mens opnieuw af te spelen. */
        fun restore(
            rules: Rules,
            seed: Long,
            names: List<String>,
            humanActions: List<Int>,
            smartComputers: Boolean = false,
            humanSeats: Set<Int> = setOf(1),
            viewSeat: Int = 1,
            playerCount: Int = 4,
        ): Game {
            val g = Game(rules, seed, names, smartComputers, playerCount)
            g.humanSeats = humanSeats
            g.viewSeat = viewSeat
            for (action in humanActions) {
                while (g.canAdvance) g.advance()
                val error = when {
                    action < 0 -> g.computerTakesOver(-action)
                    action >= 100 -> g.humanPlay(Card.fromCode(action))
                    else -> g.humanBid(action)
                }
                check(error == null) { "Opgeslagen spel kan niet hersteld worden: $error" }
            }
            g.sounds.clear()
            return g
        }
    }
}

/** "de klaver vrouw", "de harten tien" */
fun Card.describe(): String = "${Card.suitName(suit)} ${Card.rankName(rank)}"
