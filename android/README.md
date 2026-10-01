# RadioTune Android

This is the native Android client for RadioTune. The existing Next.js app remains at the repository root and is deployed separately by AWS Amplify.

The app now includes a Media3 foreground playback service and media session. Start playback with a direct, licensed MP3 or HLS URL and Android can continue playing while the screen is locked, with notification and Bluetooth controls.

## Build locally

```bash
./gradlew assembleDebug -PwebAppUrl=http://10.0.2.2:3000
```

The APK is created at `app/build/outputs/apk/debug/app-debug.apk`.

`WEB_APP_URL` is generated from the `webAppUrl` Gradle property. The default is
the documented placeholder `https://YOUR-RADIOTUNE-DOMAIN.com` because the
deployed Amplify host is not stored in this repository. Set `-PwebAppUrl` to the
deployed HTTPS URL for a production APK. The emulator development value above
uses `10.0.2.2`; do not use `localhost` from Android.

The GitHub Actions workflow builds this module from the `android/` directory and uploads the debug APK as an artifact. The search, queue, and API screens still need to be migrated from the webapp. YouTube video IDs are not direct audio URLs and cannot provide unrestricted background playback in this service.
