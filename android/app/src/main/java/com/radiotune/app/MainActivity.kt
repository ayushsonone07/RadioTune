package com.radiotune.app

import android.content.ComponentName
import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.ComponentActivity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.media3.common.MediaItem
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.google.common.util.concurrent.ListenableFuture

class MainActivity : ComponentActivity() {
    private var controllerFuture: ListenableFuture<MediaController>? = null
    private val controllerState: MutableState<MediaController?> = mutableStateOf(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionToken = SessionToken(
            this,
            ComponentName(this, PlaybackService::class.java),
        )
        controllerFuture = MediaController.Builder(this, sessionToken).buildAsync().also { future ->
            future.addListener(
                {
                    controllerState.value = future.get()
                },
                ContextCompat.getMainExecutor(this),
            )
        }

        setContent {
            RadioTuneApp(controllerState)
        }
    }

    override fun onDestroy() {
        controllerFuture?.let(MediaController::releaseFuture)
        controllerFuture = null
        super.onDestroy()
    }
}

@Composable
private fun RadioTuneApp(controllerState: MutableState<MediaController?>) {
    var audioUrl by androidx.compose.runtime.remember {
        mutableStateOf("")
    }
    val controller = controllerState.value

    MaterialTheme {
        Scaffold { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
            ) {
                Text(
                    text = "RadioTune",
                    style = MaterialTheme.typography.headlineLarge,
                )
                Text(
                    text = "Use a direct, licensed audio URL for background playback.",
                )
                OutlinedTextField(
                    value = audioUrl,
                    onValueChange = { audioUrl = it },
                    label = { Text("Audio stream URL") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                Button(
                    enabled = controller != null && audioUrl.isNotBlank(),
                    onClick = {
                        controller?.setMediaItem(MediaItem.fromUri(audioUrl.trim()))
                        controller?.prepare()
                        controller?.play()
                    },
                ) {
                    Text("Play in background")
                )
            }
        }
    }
}
