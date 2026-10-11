package nl.tienopenneer.app

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import nl.tienopenneer.engine.Sound

/** Speelt de originele geluiden van "10 op en neer" af. */
class SoundPlayer(context: Context) {
    private val pool = SoundPool.Builder()
        .setMaxStreams(2)
        .setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build(),
        )
        .build()

    private val ids: Map<Sound, Int> = mapOf(
        Sound.SLAG_TE_VEEL to R.raw.slag_te_veel,
        Sound.SLAG_TE_WEINIG to R.raw.slag_te_weinig,
        Sound.ONVOORKOMBARE_ONDERGANG to R.raw.onvoorkombare_ondergang,
        Sound.GOED_VOORSPELD to R.raw.goed_voorspeld,
        Sound.MEDESPELER_NAT to R.raw.medespeler_nat,
        Sound.GOED_GESPEELD to R.raw.goed_gespeeld,
        Sound.ZEER_GOED_GESPEELD to R.raw.zeer_goed_gespeeld,
    ).mapValues { (_, res) -> pool.load(context, res, 1) }

    /** Uitgesproken voorspellingen per speler (1..4) en aantal (0..13), elke speler met een eigen stem. */
    private val bidIds: Map<Pair<Int, Int>, Int> = buildMap {
        val voices = listOf("speler", "henk", "truus", "kees")
        voices.forEachIndexed { i, voice ->
            for (n in 0..13) {
                val res = context.resources.getIdentifier("bod_${voice}_$n", "raw", context.packageName)
                if (res != 0) put((i + 1) to n, pool.load(context, res, 1))
            }
        }
    }

    private var lastStream = 0

    /**
     * Speelt het laatste geluid uit de lijst. In het origineel onderbrak een nieuw geluid het vorige,
     * dus bij twee gebeurtenissen tegelijk was alleen de laatste te horen.
     */
    fun play(sounds: List<Sound>) {
        val sound = sounds.lastOrNull() ?: return
        val id = ids[sound] ?: return
        if (lastStream != 0) pool.stop(lastStream)
        lastStream = pool.play(id, 1f, 1f, 1, 0, 1f)
    }

    /** Laat speler [player] zijn voorspelling [bid] hardop zeggen. */
    fun playBid(player: Int, bid: Int) {
        val id = bidIds[player to bid] ?: return
        if (lastStream != 0) pool.stop(lastStream)
        lastStream = pool.play(id, 1f, 1f, 1, 0, 1f)
    }

    fun release() = pool.release()
}
