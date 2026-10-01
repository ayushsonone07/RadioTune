package com.radiotune.app

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.webkit.SslError
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture

class MainActivity : ComponentActivity() {
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private val controllerState: MutableState<MediaController?> = mutableStateOf(null)
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.BLACK
        window.navigationBarColor = Color.BLACK

        val sessionToken = SessionToken(
            this,
            ComponentName(this, PlaybackService::class.java),
        )
        controllerFuture = MediaController.Builder(this, sessionToken).buildAsync().also { future ->
            future.addListener(
                { controllerState.value = future.get() },
                ContextCompat.getMainExecutor(this),
            )
        }

        setContent {
            RadioTuneApp(savedInstanceState) { createdWebView ->
                webView = createdWebView
            }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView?.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        controllerFuture?.let(MediaController::releaseFuture)
        controllerFuture = null
        webView?.apply {
            stopLoading()
            webChromeClient = null
            webViewClient = null
            destroy()
        }
        webView = null
        super.onDestroy()
    }
}

@Composable
private fun RadioTuneApp(
    savedInstanceState: Bundle?,
    onWebViewCreated: (WebView) -> Unit,
) {
    val browserState = remember { mutableStateOf<WebView?>(null) }
    val pageState = remember {
        mutableStateOf(if (savedInstanceState == null) PageState.Loading else PageState.Ready)
    }
    val browser = browserState.value

    BackHandler(enabled = browser?.canGoBack() == true) {
        browser?.goBack()
    }

    MaterialTheme {
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { context ->
                    WebView(context).also { createdWebView ->
                        browserState.value = createdWebView
                        onWebViewCreated(createdWebView)
                        configureWebView(createdWebView, pageState)
                        if (savedInstanceState != null) {
                            createdWebView.restoreState(savedInstanceState)
                        } else {
                            createdWebView.loadUrl(BuildConfig.WEB_APP_URL)
                        }
                    }
                },
                update = {},
            )

            when (pageState.value) {
                PageState.Loading -> LoadingScreen()
                PageState.Error -> ErrorScreen {
                    pageState.value = PageState.Loading
                    browser?.reload()
                }
                PageState.Ready -> Unit
            }
        }
    }
}

private enum class PageState {
    Loading,
    Ready,
    Error,
}

@SuppressLint("SetJavaScriptEnabled")
private fun configureWebView(webView: WebView, pageState: MutableState<PageState>) {
    webView.settings.apply {
        javaScriptEnabled = true
        domStorageEnabled = true
        mediaPlaybackRequiresUserGesture = false
        useWideViewPort = true
        loadWithOverviewMode = true
        builtInZoomControls = false
        displayZoomControls = false
        allowFileAccess = false
        allowContentAccess = false
    }
    webView.webChromeClient = WebChromeClient()
    webView.webViewClient = object : WebViewClient() {
        override fun onPageStarted(view: WebView?, url: String?, favicon: android.graphics.Bitmap?) {
            pageState.value = PageState.Loading
        }

        override fun onPageFinished(view: WebView?, url: String?) {
            pageState.value = PageState.Ready
        }

        override fun onReceivedError(
            view: WebView?,
            request: WebResourceRequest?,
            error: WebResourceError?,
        ) {
            if (request?.isForMainFrame == true) pageState.value = PageState.Error
        }

        override fun onReceivedHttpError(
            view: WebView?,
            request: WebResourceRequest?,
            errorResponse: WebResourceResponse?,
        ) {
            if (request?.isForMainFrame == true && errorResponse != null && errorResponse.statusCode >= 400) {
                pageState.value = PageState.Error
            }
        }

        override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
            handler?.cancel()
            pageState.value = PageState.Error
        }

        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val uri = request.url
            val appUri = Uri.parse(BuildConfig.WEB_APP_URL)
            val isInternal = uri.host == appUri.host &&
                (uri.scheme == "https" || (uri.scheme == "http" && uri.host == "10.0.2.2"))
            if (isInternal) return false

            if (uri.scheme == "https" || (uri.scheme == "http" && uri.host == "10.0.2.2")) {
                runCatching {
                    view.context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                }
            }
            return true
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Text("Loading RadioTune...", style = MaterialTheme.typography.titleLarge)
    }
}

@Composable
private fun ErrorScreen(onRetry: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Unable to load RadioTune", style = MaterialTheme.typography.titleLarge)
            Text("Check your internet connection and try again.")
            Button(
                onClick = onRetry,
                modifier = Modifier.size(width = 120.dp, height = 48.dp),
            ) {
                Text("Retry")
            }
        }
    }
}
