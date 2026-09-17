# RadioTune Android

This is the native Android client for RadioTune. The existing Next.js app remains at the repository root and is deployed separately by AWS Amplify.

The app now includes a Media3 foreground playback service and media session. Start playback with a direct, licensed MP3 or HLS URL and Android can continue playing while the screen is locked, with notification and Bluetooth controls.

## Build locally

```bash
./gradlew assembleDebug
```

The APK is created at `app/build/outputs/apk/debug/app-debug.apk`.

The GitHub Actions workflow builds this module from the `android/` directory and uploads the debug APK as an artifact. The search, queue, and API screens still need to be migrated from the webapp. YouTube video IDs are not direct audio URLs and cannot provide unrestricted background playback in this service.
