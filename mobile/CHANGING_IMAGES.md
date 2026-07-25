# 🎨 How to change the app's images (icon, splash logo, etc.)

All the app's brand images live in **`mobile/assets/`**. To change any of them,
just replace the file with your own PNG **using the same file name**, then
rebuild/reload. Here's exactly what each file is and the size to use.

| What you see | File to replace | Recommended size | Notes |
|---|---|---|---|
| **App icon** (home screen) | `assets/icon.png` | **1024 × 1024** px, square | No transparency for iOS. |
| **Starting / splash logo** | `assets/splash-icon.png` | ~**1024 × 1024** px, transparent PNG | Shown on the black launch screen. |
| **Android icon (foreground)** | `assets/android-icon-foreground.png` | **1024 × 1024** px, transparent | The logo layer of the Android adaptive icon. |
| **Android icon (background)** | `assets/android-icon-background.png` | **1024 × 1024** px | Solid colour/pattern behind the logo. |
| **Android monochrome** | `assets/android-icon-monochrome.png` | **1024 × 1024** px, white on transparent | Used for themed icons. |
| **Web favicon** | `assets/favicon.png` | **48 × 48** px | Only used for the web build. |

## Steps

1. Put your new image in `mobile/assets/` with the **exact same name** as the file
   you're replacing (e.g. overwrite `icon.png`).
2. If you're running in Expo Go, stop the server and restart with a cleared cache:
   ```bash
   npx expo start -c
   ```
3. For a real installed app (dev build / store build), you must **rebuild**:
   ```bash
   eas build --profile preview --platform android
   ```
   (Icons and splash are baked into the native build, so they only change after a rebuild.)

## Colours (splash & icon background)

The launch-screen background and Android icon background colour are set in
**`app.json`**:

```json
"backgroundColor": "#0a0a0c",
["expo-splash-screen", { "backgroundColor": "#0a0a0c", "imageWidth": 200 }]
"android": { "adaptiveIcon": { "backgroundColor": "#0a0a0c" } }
```

Change `#0a0a0c` to any hex colour you like.

## Don't want to make 5 separate icon files?

Easiest option: create **one** 1024×1024 icon, then let a generator produce all
the sizes/variants for you:

- Use the free tool at **<https://icon.kitchen>** or **<https://www.appicon.co>** — upload one square image, download the icon set, and drop the files into `assets/`.
- Or keep it simple: just replace **`icon.png`** and **`splash-icon.png`** — those two cover the app icon and the starting logo, which is what most people care about.

## Team & player pictures (inside the app)

These are **not** files you edit — users add them in the app:
- On the **New match** screen, tap a team's badge to upload a **team logo**, and
  tap a player's circle to add a **player photo**.
- If no image is chosen, the app automatically shows a colourful **avatar with
  initials** (a different colour per name), so it always looks complete.
