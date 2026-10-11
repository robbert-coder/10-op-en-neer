package nl.tienopenneer.app

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.res.AssetManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
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
            setBackgroundColor(FELT)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.userAgentString = settings.userAgentString + " TienOpEnNeerApp"
            webViewClient = object : WebViewClientCompat() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)

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

        // De spelpagina blijft binnen de statusbalk, de navigatiebalk en het toetsenbord
        val root = FrameLayout(this).apply {
            setBackgroundColor(FELT)
            addView(web, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        }
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.ime()
            )
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            WindowInsetsCompat.CONSUMED
        }
        setContentView(root)

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
    }

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

    private fun startUrl(intent: Intent?): String {
        val code = tableCode(intent)
        return if (code != null) "$START_URL?spel=$code" else START_URL
    }

    private fun openExternal(uri: Uri) {
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
        val FELT = Color.rgb(0x06, 0x30, 0x1C)
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
