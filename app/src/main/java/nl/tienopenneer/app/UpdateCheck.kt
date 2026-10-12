package nl.tienopenneer.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

/**
 * Kijkt eens per dag op GitHub of er een nieuwere app is en geeft dan een melding. Zo hoor je het
 * ook als de app als losse APK is geïnstalleerd en niet via een winkel bijgewerkt wordt.
 */
class UpdateCheck(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val latest = latestRelease() ?: return@withContext Result.retry()
        val (tag, url) = latest
        val prefs = applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (isNewer(tag, installedVersion(applicationContext)) && prefs.getString(NOTIFIED, null) != tag) {
            notifyUpdate(tag, url)
            prefs.edit().putString(NOTIFIED, tag).apply()
        }
        Result.success()
    }

    private fun notifyUpdate(tag: String, url: String) {
        val context = applicationContext
        if (Build.VERSION.SDK_INT >= 33 &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        val manager = context.getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL) == null) {
            val channel = NotificationChannel(CHANNEL, "Nieuwe versie", NotificationManager.IMPORTANCE_DEFAULT)
            channel.description = "Een melding als er een nieuwe versie van de app is"
            manager.createNotificationChannel(channel)
        }
        val open = PendingIntent.getActivity(
            context, 1,
            Intent(Intent.ACTION_VIEW, Uri.parse(url)),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val version = tag.removePrefix("v")
        val notification = NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle("Nieuwe versie $version")
            .setContentText("Tik om 10 op en neer $version te downloaden en te installeren.")
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        manager.notify(UPDATE_NOTIFICATION, notification)
    }

    companion object {
        const val RELEASE_API = "https://api.github.com/repos/robbert-coder/10-op-en-neer/releases/latest"
        private const val CHANNEL = "update"
        private const val UPDATE_NOTIFICATION = 2
        private const val PREFS = "update"
        private const val NOTIFIED = "notified"

        /** Plant de dagelijkse controle in (doet niets als die al gepland staat). */
        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<UpdateCheck>(1, TimeUnit.DAYS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .setInitialDelay(1, TimeUnit.HOURS)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork("update-check", ExistingPeriodicWorkPolicy.KEEP, request)
        }

        fun installedVersion(context: Context): String =
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "0"

        /** De nieuwste uitgave op GitHub: (versie, downloadlink van de APK), of null bij geen verbinding. */
        fun latestRelease(): Pair<String, String>? = try {
            val conn = URL(RELEASE_API).openConnection() as HttpURLConnection
            conn.connectTimeout = 15000
            conn.readTimeout = 15000
            conn.setRequestProperty("Accept", "application/vnd.github+json")
            val json = JSONObject(conn.inputStream.bufferedReader().use { it.readText() })
            val tag = json.getString("tag_name")
            val assets = json.optJSONArray("assets")
            var url = json.optString("html_url")
            if (assets != null) for (i in 0 until assets.length()) {
                val asset = assets.getJSONObject(i)
                if (asset.optString("name").endsWith(".apk")) url = asset.getString("browser_download_url")
            }
            tag to url
        } catch (_: Exception) {
            null
        }

        /** "v2.16" tegenover "2.15": is de eerste nieuwer? */
        fun isNewer(tag: String, installed: String): Boolean {
            fun parts(v: String) = v.removePrefix("v").split('.').map { it.toIntOrNull() ?: 0 }
            val a = parts(tag)
            val b = parts(installed)
            for (i in 0 until maxOf(a.size, b.size)) {
                val x = a.getOrElse(i) { 0 }
                val y = b.getOrElse(i) { 0 }
                if (x != y) return x > y
            }
            return false
        }
    }
}
