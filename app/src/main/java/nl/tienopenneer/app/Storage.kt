package nl.tienopenneer.app

import android.content.Context
import nl.tienopenneer.engine.Rules
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class SavedGame(
    val rules: Rules,
    val seed: Long,
    val names: List<String>,
    val actions: List<Int>,
)

data class HighScore(val name: String, val score: Int, val date: String)

data class Settings(
    val playerName: String = "Speler",
    /** 1 (langzaam) .. 5 (snel) */
    val speed: Int = 3,
    val sortDescending: Boolean = false,
)

/** Bewaart het lopende spel, de instellingen en de highscores in SharedPreferences. */
class Storage(context: Context) {
    private val prefs = context.getSharedPreferences("tienopenneer", Context.MODE_PRIVATE)

    fun loadSettings() = Settings(
        playerName = prefs.getString("naam", null) ?: "Speler",
        speed = prefs.getInt("snelheid", 3),
        sortDescending = prefs.getBoolean("aflopend", false),
    )

    fun saveSettings(s: Settings) {
        prefs.edit()
            .putString("naam", s.playerName)
            .putInt("snelheid", s.speed)
            .putBoolean("aflopend", s.sortDescending)
            .apply()
    }

    fun saveGame(g: SavedGame) {
        prefs.edit()
            .putString("spel.regels", encodeRules(g.rules))
            .putLong("spel.seed", g.seed)
            .putString("spel.namen", g.names.joinToString("\n"))
            .putString("spel.acties", g.actions.joinToString(","))
            .apply()
    }

    fun loadGame(): SavedGame? {
        val rules = prefs.getString("spel.regels", null)?.let { decodeRules(it) } ?: return null
        val names = prefs.getString("spel.namen", null)?.split("\n") ?: return null
        val actions = prefs.getString("spel.acties", "")!!
            .split(",").filter { it.isNotBlank() }.map { it.toInt() }
        return SavedGame(rules, prefs.getLong("spel.seed", 0), names, actions)
    }

    fun clearGame() {
        prefs.edit().remove("spel.regels").remove("spel.seed").remove("spel.namen").remove("spel.acties").apply()
    }

    fun loadHighScores(rules: Rules): List<HighScore> {
        val raw = prefs.getString("highscore.${variantKey(rules)}", null) ?: return emptyList()
        return raw.split("\n").mapNotNull { line ->
            val parts = line.split("\t")
            if (parts.size == 3) parts[1].toIntOrNull()?.let { HighScore(parts[0], it, parts[2]) } else null
        }
    }

    /** Voegt een score toe en geeft de plaats (1..10) terug, of 0 als de score de lijst niet haalt. */
    fun addHighScore(rules: Rules, name: String, score: Int): Int {
        val list = loadHighScores(rules).toMutableList()
        val date = SimpleDateFormat("dd-MM-yyyy", Locale("nl", "NL")).format(Date())
        var pos = list.indexOfFirst { score > it.score }
        if (pos < 0) pos = list.size
        if (pos >= MAX_HIGHSCORES) return 0
        list.add(pos, HighScore(name.replace("\t", " ").replace("\n", " "), score, date))
        val trimmed = list.take(MAX_HIGHSCORES)
        prefs.edit()
            .putString("highscore.${variantKey(rules)}", trimmed.joinToString("\n") { "${it.name}\t${it.score}\t${it.date}" })
            .apply()
        return pos + 1
    }

    fun clearHighScores(rules: Rules) {
        prefs.edit().remove("highscore.${variantKey(rules)}").apply()
    }

    companion object {
        const val MAX_HIGHSCORES = 10

        fun variantKey(rules: Rules) = when {
            rules.isTienOpEnNeer -> "10openneer"
            rules.isBoerenbridge -> "boerenbridge"
            else -> "hybride"
        }

        private fun encodeRules(r: Rules) = listOf(
            r.maxCards, r.pointsPerTrick, if (r.wrongScoresZero) 1 else 0, r.penaltyPerTrick,
            if (r.negativeScores) 1 else 0, if (r.roundingAllowed) 1 else 0, if (r.mustTrump) 1 else 0,
        ).joinToString(",")

        private fun decodeRules(s: String): Rules? = runCatching {
            val v = s.split(",").map { it.toInt() }
            Rules(
                maxCards = v[0],
                pointsPerTrick = v[1],
                wrongScoresZero = v[2] == 1,
                penaltyPerTrick = v[3],
                negativeScores = v[4] == 1,
                roundingAllowed = v[5] == 1,
                mustTrump = v[6] == 1,
            )
        }.getOrNull()
    }
}
