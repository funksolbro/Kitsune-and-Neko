# Kitsune & Neko: Japanese Playland

A kid-friendly, browser-based Japanese learning app with a fox/cat/unicorn theme. Includes:
- **Flash Cards** with clear Japanese text-to-speech (TTS)
- **Match Game** (drag the Japanese to the correct English)
- **Listening Quiz** (hear a word, pick the meaning)
- **Sticker Book** rewards
- Adjustable **voice** (if your browser has multiple Japanese voices) and **speech speed**
- Big-text mode for readability
- Progress (stickers) saved to your browser (localStorage)

## How to run
1. Download the zip and unzip it.
2. Open `index.html` in a modern browser (Chrome/Edge/Safari). No server needed.
3. If voices don't appear right away, wait a second: browsers load TTS voices asynchronously.

## Notes on speech clarity
- The app uses the **Web Speech API** (`speechSynthesis`). Set `Voice` and `Speed` in the Flash Cards screen.
- Make sure your device has a **Japanese voice** installed. Most modern browsers include at least one (e.g., "Kyoko" on macOS, "Microsoft Haruka" on Windows).

## Customize content
Open `app.js` and add to the `PACKS` object. Each item looks like:
```js
{ jp: "こんにちは", romaji: "konnichiwa", en: "hello", type: "phrase" }
```

Have fun!  🦊🐱🦄
