# Deep Link Hosting

Static files to host on an HTTPS domain so Android App Links (and later iOS Universal Links) can verify the app and so users without the app installed get redirected to the store.

## What gets hosted

```
/.well-known/assetlinks.json              -> Android verification
/.well-known/apple-app-site-association   -> iOS verification (no .json extension)
/receive-invite/index.html                -> fallback page when app not installed
```

## Placeholders to replace

Search-and-replace across this folder AND `app.json`:

| Placeholder                                  | Example value                              | Where                                    |
| -------------------------------------------- | ------------------------------------------ | ---------------------------------------- |
| `com.YOUR_ORG.parking`                       | `com.psys.parking`                         | `app.json` (android.package, ios.bundleIdentifier), `assetlinks.json`, `index.html` |
| `YOUR_DOMAIN.com`                            | `link.parking.com`                         | `app.json` (intentFilters.host, associatedDomains) |
| `REPLACE_WITH_SHA256_FINGERPRINT_OF_SIGNING_KEY` | `AA:BB:CC:...` (64 hex pairs)          | `assetlinks.json`                        |
| `YOUR_TEAM_ID`                               | `ABCDE12345`                               | `apple-app-site-association` (iOS only — skip for now) |
| `idXXXXXXXXX`                                | `id1234567890`                             | `index.html` (after App Store publish)   |

## How to get the SHA256 fingerprint

### If using debug APK (`npx expo run:android` or local Gradle)
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
Look for `SHA256:` and copy the colon-separated hex string.

### If using EAS Build
```bash
eas credentials
```
Choose Android > select profile > view fingerprint.

### Multiple keys (debug + release)
List all of them in `sha256_cert_fingerprints` array — Android accepts any matching one:
```json
"sha256_cert_fingerprints": [
  "AA:BB:...",
  "CC:DD:..."
]
```

## Hosting

1. Point an HTTPS domain at any static host (Vercel, Netlify, Cloudflare Pages, your VPS with nginx).
2. Upload the contents of this folder so the URLs become:
   - `https://YOUR_DOMAIN.com/.well-known/assetlinks.json`
   - `https://YOUR_DOMAIN.com/.well-known/apple-app-site-association`
   - `https://YOUR_DOMAIN.com/receive-invite` (serves `index.html`)
3. Verify in browser: each URL must return 200 directly (no redirect, no 404).
4. `Content-Type: application/json` recommended for the `.well-known` files.

## Build & test the app

After editing `app.json`, rebuild the APK (intent filters live in `AndroidManifest.xml`, generated at build time):

```bash
# EAS preview build
eas build -p android --profile preview

# OR local build
npx expo run:android
```

Install the APK on a device, then verify Android registered the App Link:

```bash
adb shell pm get-app-links com.YOUR_ORG.parking
```

Should show your domain with status `verified`.

Test opening the app via deep link:

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "https://YOUR_DOMAIN.com/receive-invite?inviterName=P-SYS&expireDate=2024.12.31"
```

App should open straight into `ReceiveInviteScreen` with params populated.

## Mapping URL path to Expo Router screen

The fallback page lives at `/receive-invite/index.html`, but the Expo Router screen file is `app/(auth)/receive-invite.tsx`. Group folders like `(auth)` are stripped from URLs, so the URL path `/receive-invite` correctly resolves to that screen — no extra config needed.

Query params (`?inviterName=...&expireDate=...`) are read inside the screen via `useLocalSearchParams()`.

## Troubleshooting

- **App not opening from link** — check `adb shell pm get-app-links com.YOUR_ORG.parking`. If status is not `verified`, the SHA256 fingerprint or domain config is wrong.
- **Stuck on cached verification** — `adb shell pm verify-app-links --re-verify com.YOUR_ORG.parking`, or uninstall + reinstall the APK.
- **Fallback page redirects to Play Store but app exists in store** — Play Store URL only works after the app is published (even Internal Testing track is fine).
