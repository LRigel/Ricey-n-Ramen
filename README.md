# Ricey n Ramen

A pixel-art tag-team platformer starring Ricey (Maine Coon) and Ramen (Shiba Inu).
Built with Phaser 3, TypeScript and Vite.

Ricey and Ramen can't find Nien-Nien. They search the backyard and the bush in
Perth, find an old ticket to Taipei, fly to Taiwan (night market, Jiufen,
Elephant Mountain), where Dudu, a fat orange tabby whose human is Sunny, tells
them Nien-Nien never left Perth.
They fly home and find Nien-Nien was in the bathroom all along.

## Play

```sh
npm install
npm run dev      # http://localhost:5173 (also served on the LAN)
npm run build    # static build in dist/
npm run deploy   # build and publish to https://ricey.rigel.fyi
npm run android          # build the Android app (APK)
npm run android:install  # build, install and launch on a USB-connected device
```

The Android app wraps the web build with Capacitor 7. `scripts/android.sh` uses
JDK 21 and the Android SDK from `~/.local/android-toolchain` unless `JAVA_HOME` /
`ANDROID_HOME` are set. The APK lands in `android/app/build/outputs/apk/debug/`.

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | Arrows / A D | D-pad / left stick |
| Jump | Space / Z / W / Up | A |
| Swap pets | C / Shift / K | X / Y / bumpers |
| Ramen's dash | Jump again in mid-air | A again in mid-air |
| Drop through a ledge | Down + Jump | Down + A |
| Restart from checkpoint | R | Select |
| Pause (then quit to title) | P or Esc (then Q) | Start (then B) |

On phones and tablets, on-screen buttons appear during levels (play in landscape;
add `?touch=1` to the URL to force them on).

Ricey climbs walls (walk into one). Ramen runs faster and can dash once per jump by pressing jump again in mid-air.
The pet you aren't controlling follows along behind. Jump on enemies (or dash
through them as Ramen) to knock them out.

Playable in English or Traditional Chinese (台灣華語): switch on the title screen
(click/tap the language name, or press L), or add `?lang=zh` / `?lang=en` to the URL.

Add `?step=N` to the URL to jump to a point in the story (see `FLOW` in `src/story.ts`).

## Layout

- `src/scenes/GameScene.ts`: movement, tag-team following, enemies, pickups, checkpoints
- `src/scenes/StoryScene.ts`, `src/story.ts`: cutscene dialogue and the order of the game
- `src/levels.ts`: levels as text maps (legend at the top of the file)
- `src/art/`: pixel art as character maps (`pets.ts`, `props.ts`) and per-level themes (`themes.ts`)
- `src/pad.ts`: controller input (Gamepad API in browsers; native in the Android app via `MainActivity.java`)
- `src/i18n.ts`: interface text in both languages (story lines and level names carry their own `zh`)

## Credits

Chinese text uses [Cubic 11 (俐方體11號)](https://github.com/ACh-K/Cubic-11) by ACh-K,
licensed under the SIL Open Font License (see `public/fonts/Cubic_11-OFL.txt`).
The English font is [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) by
CodeMan38, also under the SIL Open Font License (`public/fonts/PressStart2P-OFL.txt`).
