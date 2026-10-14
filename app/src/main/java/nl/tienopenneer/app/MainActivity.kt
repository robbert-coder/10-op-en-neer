package nl.tienopenneer.app

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.res.AssetManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.IOException

/**
 * De app is de webversie van het spel, meegeleverd in de app en getoond in een WebView. Zo werken
 * alles uit de webversie (computerspelers, Tineke, stemmen, samen spelen en chatten) ook hier, en
 * kunnen app en website samen aan één tafel zitten.
 */
class MainActivity : ComponentActivity() {

    private lateinit var web: WebView

    /** Een foto kiezen voor je eigen plaatje (een <input type="file"> op de pagina). */
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(if (uri != null) arrayOf(uri) else null)
        fileCallback = null
    }

    /** Toestemming voor meldingen (nodig vanaf Android 13). */
    private val askNotify = registerForActivityResult(ActivityResultContracts.RequestPermission()) {
        if (::web.isInitialized) web.evaluateJavascript("window.tienNotifyChanged && window.tienNotifyChanged()", null)
    }

    /** Staat de app in beeld? Alleen als dat niet zo is, komt er een melding. */
    @Volatile private var inForeground = false

    override fun onStart() {
        super.onStart()
        inForeground = true
        NotificationManagerCompat.from(this).cancel(TURN_NOTIFICATION)
        if (::web.isInitialized) web.evaluateJavascript("window.tienVisible && window.tienVisible(true)", null)
    }

    override fun onStop() {
        inForeground = false
        // De pagina blijft draaien, zodat het spel doorloopt en kan melden dat je aan de beurt bent
        if (::web.isInitialized) web.evaluateJavascript("window.tienVisible && window.tienVisible(false)", null)
        super.onStop()
    }

    private fun showTurnNotification(title: String, text: String) {
        if (inForeground) return
        if (Build.VERSION.SDK_INT >= 33 &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL) == null) {
            val channel = NotificationChannel(CHANNEL, "Aan de beurt", NotificationManager.IMPORTANCE_HIGH)
            channel.description = "Een melding als je bij samen spelen aan de beurt bent"
            manager.createNotificationChannel(channel)
        }
        val open = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notification = NotificationCompat.Builder(this, CHANNEL)
            .setSmallIcon(R.drawable.ic_notify)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        manager.notify(TURN_NOTIFICATION, notification)
    }

    private var insetCss = ""

    private fun pushInsets() {
        if (!::web.isInitialized || insetCss.isEmpty()) return
        web.evaluateJavascript(
            "(function(v){var s=document.documentElement.style;for(var k in v)s.setProperty(k,v[k])})($insetCss)", null
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(Color.TRANSPARENT),
        )
        super.onCreate(savedInstanceState)

        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) {
            WebView.setWebContentsDebuggingEnabled(true)
        }

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/web/", SiteHandler(assets))
            .build()

        web = WebView(this).apply {
            setBackgroundColor(CAFE)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.userAgentString = settings.userAgentString + " TienOpEnNeerApp"
            webViewClient = object : WebViewClientCompat() {
                // Alle bestanden van het spel komen uit de app zelf (https://appassets.androidplatform.net/web/)
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

                override fun onPageFinished(view: WebView, url: String) = pushInsets()

                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (request.url.host == WebViewAssetLoader.DEFAULT_DOMAIN) return false
                    openExternal(request.url)
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    view: WebView,
                    callback: ValueCallback<Array<Uri>>,
                    params: FileChooserParams,
                ): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    return try {
                        pickImage.launch("image/*")
                        true
                    } catch (_: ActivityNotFoundException) {
                        fileCallback = null
                        false
                    }
                }
            }
            addJavascriptInterface(Bridge(), "TienApp")
        }

        // De achtergrond loopt door onder de statusbalk en de systeemknoppen; de pagina krijgt de vrije randen
        // als CSS-variabelen. Alleen voor het toetsenbord schuift de pagina zelf omhoog.
        val root = FrameLayout(this).apply {
            setBackgroundColor(CAFE)
            addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val d = resources.displayMetrics.density
            val bottom = if (ime > bars.bottom) 0 else bars.bottom
            v.setPadding(0, 0, 0, if (ime > bars.bottom) ime else 0)
            insetCss = "{\"--sat\":\"${bars.top / d}px\",\"--sar\":\"${bars.right / d}px\"," +
                "\"--sab\":\"${bottom / d}px\",\"--sal\":\"${bars.left / d}px\"}"
            pushInsets()
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)

        // Meteen bij de eerste start om toestemming voor meldingen vragen (wens van Robbert); daarna niet meer uit zichzelf
        if (Build.VERSION.SDK_INT >= 33 && savedInstanceState == null &&
            checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED &&
            !getPreferences(MODE_PRIVATE).getBoolean(ASKED_NOTIFY, false)
        ) {
            getPreferences(MODE_PRIVATE).edit().putBoolean(ASKED_NOTIFY, true).apply()
            askNotify.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                web.evaluateJavascript("window.tienBack ? window.tienBack() : false") { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })

        if (savedInstanceState == null || !restoreWeb(savedInstanceState)) web.loadUrl(startUrl(intent))
        UpdateCheck.schedule(this)
    }

    /** Na het draaien van het scherm of terugkomen in de app: de pagina zoals hij was, zonder opnieuw te laden. */
    private fun restoreWeb(state: Bundle): Boolean = web.restoreState(state) != null

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Een gedeelde link terwijl de app al open is: aanschuiven bij die tafel
        if (tableCode(intent) != null) web.loadUrl(startUrl(intent))
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }

    private fun tableCode(intent: Intent?): String? =
        intent?.data?.getQueryParameter("spel")?.filter { it.isLetterOrDigit() }?.take(5)?.ifEmpty { null }

    /** Het nummer van de gastheer uit een gedeelde link (zie tableLink in app.js); alleen tekens die erin horen. */
    private fun hostId(intent: Intent?): String? =
        intent?.data?.getQueryParameter("h")?.takeIf { Regex("^[A-Za-z0-9_-]{22}$").matches(it) }

    private fun startUrl(intent: Intent?): String {
        val code = tableCode(intent) ?: return START_URL
        val host = hostId(intent)
        return if (host != null) "$START_URL?spel=$code&h=$host" else "$START_URL?spel=$code"
    }

    /**
     * Een link buiten het spel (zoals de website of een e-mailadres) in een andere app openen. Alleen
     * https en mailto: andere soorten links kunnen apps starten die niets met het spel te maken hebben.
     */
    private fun openExternal(uri: Uri) {
        if (uri.scheme !in setOf("https", "mailto")) return
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: ActivityNotFoundException) {
            // Geen app om de link te openen
        }
    }

    /** Wat de webpagina via window.TienApp aan de app kan vragen. */
    private inner class Bridge {
        @JavascriptInterface
        fun share(text: String) {
            runOnUiThread {
                val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, text)
                startActivity(Intent.createChooser(send, "Link delen"))
            }
        }

        /** Vraagt toestemming voor meldingen, als dat nog moet. */
        @JavascriptInterface
        fun askNotifications() {
            runOnUiThread {
                if (Build.VERSION.SDK_INT >= 33 &&
                    checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                ) {
                    getPreferences(MODE_PRIVATE).edit().putBoolean(ASKED_NOTIFY, true).apply()
                    askNotify.launch(Manifest.permission.POST_NOTIFICATIONS)
                }
            }
        }

        /** "granted", "default" (we mogen nog vragen) of "denied" (alleen via de instellingen aan te zetten). */
        @JavascriptInterface
        fun notificationState(): String {
            if (NotificationManagerCompat.from(this@MainActivity).areNotificationsEnabled()) return "granted"
            if (Build.VERSION.SDK_INT < 33) return "denied"
            val asked = getPreferences(MODE_PRIVATE).getBoolean(ASKED_NOTIFY, false)
            return if (!asked || shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) "default" else "denied"
        }

        @JavascriptInterface
        fun openNotificationSettings() {
            runOnUiThread {
                try {
                    startActivity(
                        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, packageName),
                    )
                } catch (_: ActivityNotFoundException) {
                    // Geen instellingenscherm gevonden
                }
            }
        }

        /** Een melding, alleen als de app niet in beeld is. */
        @JavascriptInterface
        fun notify(title: String, text: String) {
            runOnUiThread { showTurnNotification(title.take(60), text.take(200)) }
        }

        @JavascriptInterface
        fun clearNotification() {
            runOnUiThread { NotificationManagerCompat.from(this@MainActivity).cancel(TURN_NOTIFICATION) }
        }

        /** De geïnstalleerde versie van de app, bv. "2.15". */
        @JavascriptInterface
        fun appVersion(): String = UpdateCheck.installedVersion(this@MainActivity)

        @JavascriptInterface
        fun copy(text: String) {
            runOnUiThread {
                val clipboard = getSystemService(ClipboardManager::class.java)
                clipboard.setPrimaryClip(ClipData.newPlainText("10 op en neer", text))
                Toast.makeText(this@MainActivity, "Link gekopieerd", Toast.LENGTH_SHORT).show()
            }
        }
    }

    /** Levert de bestanden van de website uit de assets van de app, met het juiste type. */
    private class SiteHandler(private val assets: AssetManager) : WebViewAssetLoader.PathHandler {
        /** Een bestand van de website uit de app leveren, met het juiste type (zie MIME_TYPES). */
        override fun handle(path: String): WebResourceResponse {
            val file = path.substringBefore('?').ifEmpty { "index.html" }
            val type = MIME_TYPES[file.substringAfterLast('.', "").lowercase()] ?: "application/octet-stream"
            val encoding = if (type.startsWith("text/") || type.endsWith("json")) "utf-8" else null
            return try {
                WebResourceResponse(type, encoding, assets.open("web/$file"))
            } catch (_: IOException) {
                WebResourceResponse("text/plain", "utf-8", 404, "Not Found", emptyMap(), "".byteInputStream())
            }
        }
    }

    private companion object {
        const val START_URL = "https://${WebViewAssetLoader.DEFAULT_DOMAIN}/web/index.html"
        const val CHANNEL = "beurt"
        const val TURN_NOTIFICATION = 1
        const val ASKED_NOTIFY = "askedNotify"
        val CAFE = Color.rgb(0x2C, 0x1B, 0x11)
        val MIME_TYPES = mapOf(
            "html" to "text/html",
            "js" to "text/javascript",
            "mjs" to "text/javascript",
            "css" to "text/css",
            "svg" to "image/svg+xml",
            "png" to "image/png",
            "mp3" to "audio/mpeg",
            "ogg" to "audio/ogg",
            "json" to "application/json",
            "webmanifest" to "application/manifest+json",
            "txt" to "text/plain",
        )
    }
}
