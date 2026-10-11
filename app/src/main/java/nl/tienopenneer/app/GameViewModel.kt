package nl.tienopenneer.app

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import nl.tienopenneer.engine.Card
import nl.tienopenneer.engine.Game
import nl.tienopenneer.engine.Phase
import nl.tienopenneer.engine.Rules
import nl.tienopenneer.engine.Sound
import nl.tienopenneer.engine.describe
import kotlin.random.Random

enum class Screen { MENU, NEW_GAME, GAME, RULES, HIGHSCORES, SETTINGS }

data class SeatUi(
    val number: Int,
    val name: String,
    val bid: Int,
    val tricks: Int,
    val cardCount: Int,
    val total: Int,
    val rank: Int,
    val isLeader: Boolean,
    val isActive: Boolean,
)

/** Momentopname van het spel voor de schermen. */
data class GameUi(
    val variantName: String,
    val round: Int,
    val rounds: Int,
    val cardsThisRound: Int,
    val trump: Card,
    val phase: Phase,
    val seats: List<SeatUi>,
    val hand: List<Card>,
    val legal: Set<Card>,
    /** Kaart op tafel per speler, index 0..3 voor speler 1..4. */
    val table: List<Card>,
    val trickWinner: Int,
    val lastTrick: List<Card>,
    val lastTrickWinner: Int,
    val status: String,
    val tricksOverText: String,
    val humanBidding: Boolean,
    val humanPlaying: Boolean,
    val forbiddenBid: Int?,
    val scoreRows: List<ScoreRow>,
)

data class ScoreCell(val bid: Int, val tricks: Int, val score: Int, val crossed: Boolean, val good: Boolean)

data class ScoreRow(val round: Int, val cards: Int, val cells: List<ScoreCell?>)

class GameViewModel(app: Application) : AndroidViewModel(app) {
    private val storage = Storage(app)
    private val soundPlayer = SoundPlayer(app)

    var settings by mutableStateOf(storage.loadSettings())
        private set
    var screen by mutableStateOf(Screen.MENU)
    var ui by mutableStateOf<GameUi?>(null)
        private set
    var message by mutableStateOf<String?>(null)
        private set
    var hintCard by mutableStateOf<Card?>(null)
        private set
    var hintBid by mutableStateOf<Int?>(null)
        private set
    var showLastTrick by mutableStateOf(false)
    var showScores by mutableStateOf(false)
    var highScorePlace by mutableStateOf(0)
        private set
    var newGameRules by mutableStateOf(Rules.TIEN_OP_EN_NEER)

    private var game: Game? = null
    private var driver: Job? = null
    private var gameOverHandled = false

    /** Welke voorspellingen al zijn uitgesproken, per ronde. */
    private var announcedRound = 0
    private val announced = BooleanArray(5)

    val hasGameInProgress: Boolean get() = ui != null && ui?.phase != Phase.GAME_OVER

    init {
        storage.loadGame()?.let { saved ->
            game = runCatching { Game.restore(saved.rules, saved.seed, saved.names, saved.actions) }
                .onFailure { storage.clearGame() }
                .getOrNull()
            refresh()
        }
    }

    fun highScores(rules: Rules) = storage.loadHighScores(rules)

    fun clearHighScores(rules: Rules) = storage.clearHighScores(rules)

    fun updateSettings(s: Settings) {
        settings = s
        storage.saveSettings(s)
        game?.player(1)?.name = s.playerName
        refresh()
    }

    fun startNewGame(rules: Rules) {
        driver?.cancel()
        val names = listOf(settings.playerName) + Game.DEFAULT_NAMES.drop(1)
        game = Game(rules, Random.nextLong(), names)
        gameOverHandled = false
        highScorePlace = 0
        showScores = false
        clearTransient()
        save()
        refresh()
        screen = Screen.GAME
        drive()
    }

    fun resumeGame() {
        if (game == null) return
        screen = Screen.GAME
        drive()
    }

    fun leaveGame() {
        driver?.cancel()
        screen = Screen.MENU
    }

    fun onBid(n: Int) {
        val g = game ?: return
        val error = g.humanBid(n)
        clearTransient()
        if (error != null) {
            message = error
        } else {
            save()
        }
        refresh()
        drive()
    }

    fun onCardTap(card: Card) {
        val g = game ?: return
        if (!g.isHumanTurn || g.phase != Phase.PLAYING) {
            message = when (g.phase) {
                Phase.BIDDING -> "Je moet eerst het aantal slagen voorspellen."
                else -> "Je bent nog niet aan de beurt."
            }
            return
        }
        val error = g.humanPlay(card)
        clearTransient()
        if (error != null) {
            message = error
        } else {
            save()
        }
        refresh()
        drive()
    }

    fun onTip() {
        val g = game ?: return
        if (!g.isHumanTurn) return
        if (g.phase == Phase.BIDDING) {
            hintBid = g.hintBid()
            message = "Tip: voorspel ${hintBid}."
        } else {
            hintCard = g.hintCard()
            hintCard?.let { message = "Tip: speel de ${it.describe()}." }
        }
    }

    /** Tik op tafel: de slag meteen binnenhalen in plaats van te wachten. */
    fun onTableTap() {
        val g = game ?: return
        if (showLastTrick) {
            showLastTrick = false
            return
        }
        if (g.phase == Phase.TRICK_COMPLETE) {
            driver?.cancel()
            g.advance()
            save()
            refresh()
            drive()
        }
    }

    fun toggleLastTrick() {
        if (game?.lastTrickWinner != 0) showLastTrick = !showLastTrick
    }

    fun continueAfterRound() {
        val g = game ?: return
        if (g.phase != Phase.ROUND_COMPLETE) return
        g.advance()
        save()
        refresh()
        if (g.phase == Phase.GAME_OVER) handleGameOver() else drive()
    }

    private fun clearTransient() {
        message = null
        hintCard = null
        hintBid = null
        showLastTrick = false
    }

    private fun drive() {
        if (driver?.isActive == true) return
        if (screen != Screen.GAME) return
        driver = viewModelScope.launch {
            while (true) {
                val g = game ?: break
                if (!g.canAdvance || g.phase == Phase.ROUND_COMPLETE) break
                delay(stepDelay(g.phase))
                g.advance()
                if (g.phase == Phase.PLAYING && g.toPlay == 1 || g.phase == Phase.BIDDING && g.toBid == 1) {
                    showLastTrick = false
                }
                save()
                refresh()
            }
        }
    }

    private fun announceBids(g: Game) {
        if (announcedRound != g.round) {
            announcedRound = g.round
            // Bij een hersteld spel de al gedane voorspellingen niet opnieuw zeggen
            for (nr in 1..4) announced[nr] = g.player(nr).bid >= 0
            return
        }
        for (nr in 1..4) {
            val bid = g.player(nr).bid
            if (bid >= 0 && !announced[nr]) {
                announced[nr] = true
                if (settings.sound && settings.speakBids) soundPlayer.playBid(nr, bid)
            }
        }
    }

    private fun stepDelay(phase: Phase): Long {
        val factor = when (settings.speed) {
            1 -> 2.0
            2 -> 1.4
            3 -> 1.0
            4 -> 0.65
            else -> 0.35
        }
        val base = when (phase) {
            Phase.BIDDING -> 550
            Phase.PLAYING -> 700
            Phase.TRICK_COMPLETE -> 1400
            else -> 300
        }
        // Tijd om de uitgesproken voorspelling af te laten maken
        val minimum = if (phase == Phase.BIDDING && settings.sound && settings.speakBids) (2800 * minOf(factor, 1.0)).toLong() else 0L
        return maxOf((base * factor).toLong(), minimum)
    }

    private fun handleGameOver() {
        val g = game ?: return
        if (gameOverHandled) return
        gameOverHandled = true
        highScorePlace = storage.addHighScore(g.rules, g.player(1).name, g.player(1).total)
        // AfgelopenCommentaar: applaus bij een goed resultaat
        val me = g.player(1)
        val aloneFirst = me.rank == 1 && g.players.count { it.rank == 1 } == 1
        val applause = when {
            highScorePlace > 0 || aloneFirst -> Sound.ZEER_GOED_GESPEELD
            me.rank == 1 -> Sound.GOED_GESPEELD
            g.rules.isTienOpEnNeer && me.total >= 190 -> Sound.ZEER_GOED_GESPEELD
            g.rules.isTienOpEnNeer && me.total >= 180 -> Sound.GOED_GESPEELD
            else -> null
        }
        if (applause != null && settings.sound) soundPlayer.play(listOf(applause))
        storage.clearGame()
    }

    private fun save() {
        val g = game ?: return
        if (g.phase == Phase.GAME_OVER) return
        storage.saveGame(SavedGame(g.rules, g.seed, g.players.map { it.name }, g.humanActions))
    }

    private fun refresh() {
        val g = game
        if (g == null) {
            ui = null
            return
        }
        val sounds = g.takeSounds()
        if (settings.sound) soundPlayer.play(sounds)
        announceBids(g)
        val hand = g.player(1).handCards().let { cards ->
            if (settings.sortDescending) cards.sortedWith(compareBy({ it.suit }, { -it.rank })) else cards
        }
        ui = GameUi(
            variantName = g.rules.variantName,
            round = g.round,
            rounds = g.rules.rounds,
            cardsThisRound = g.cardsThisRound,
            trump = g.trump,
            phase = g.phase,
            seats = (1..4).map { nr ->
                val pl = g.player(nr)
                SeatUi(
                    number = nr,
                    name = pl.name,
                    bid = pl.bid,
                    tricks = pl.tricks,
                    cardCount = pl.cardCount,
                    total = pl.total,
                    rank = pl.rank,
                    isLeader = nr == g.leader,
                    isActive = (g.phase == Phase.BIDDING && g.toBid == nr) || (g.phase == Phase.PLAYING && g.toPlay == nr),
                )
            },
            hand = hand,
            legal = g.legalCardsForHuman(),
            table = (1..4).map { g.tableCard(it) },
            trickWinner = g.trickWinner,
            lastTrick = (1..4).map { g.lastTrickCard(it) },
            lastTrickWinner = g.lastTrickWinner,
            status = g.status,
            tricksOverText = g.tricksOverText(),
            humanBidding = g.phase == Phase.BIDDING && g.toBid == 1,
            humanPlaying = g.phase == Phase.PLAYING && g.toPlay == 1,
            forbiddenBid = g.forbiddenHumanBid(),
            scoreRows = (1..g.rules.rounds).map { r ->
                ScoreRow(
                    round = r,
                    cards = g.rules.cardsInRound(r),
                    cells = (1..4).map { nr ->
                        val pl = g.player(nr)
                        when {
                            pl.scoreForRound(r) >= 0 -> ScoreCell(
                                bid = pl.bidForRound(r),
                                tricks = pl.tricksForRound(r),
                                score = pl.scoreForRound(r),
                                crossed = pl.crossedForRound(r),
                                good = pl.goodForRound(r),
                            )
                            r == g.round && pl.bidForRound(r) >= 0 ->
                                ScoreCell(pl.bidForRound(r), -1, -1, crossed = false, good = false)
                            else -> null
                        }
                    },
                )
            },
        )
        if (g.phase == Phase.GAME_OVER) handleGameOver()
    }

    override fun onCleared() {
        driver?.cancel()
        soundPlayer.release()
        super.onCleared()
    }
}
