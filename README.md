# Custom Completion Sound for Hermes Desktop

A [Hermes Desktop](https://hermes-agent.nousresearch.com/docs/) plugin that plays **your own audio file** when the agent finishes thinking and delivers its answer — instead of the standard completion sound.

Single ESM file, no build step, no fork of Hermes. Drop it in `desktop-plugins/` and it works.

## Features

- **Your sound** — MP3, WAV, OGG, M4A or FLAC (up to 1.5 MB), played on `message.complete`
- **Volume slider** — 0–100%, applies to both autoplay and preview
- **Settings page** — file picker, preview ("Прослушать"), and remove, under Settings → Plugins → Completion Sound
- **Persists** — the audio and volume survive app restarts (stored in plugin-local storage)
- **Hot reload** — edit the file and the app picks it up live

## Install

```bash
mkdir -p "$HOME/.hermes/desktop-plugins/custom-completion-sound"
curl -fsSL https://raw.githubusercontent.com/jackybimy/hermes-desktop-completion-sound/main/plugin.js \
  -o "$HOME/.hermes/desktop-plugins/custom-completion-sound/plugin.js"
```

(Or download `plugin.js` from this repo and place it there yourself.)

The desktop app watches the folder — the plugin loads within a few seconds, no restart needed. If it doesn't appear, run **⌘K → Reload desktop plugins**.

## Usage

1. Open **Settings → Plugins → Completion Sound**
2. Click **Выбрать файл** and pick your audio file
3. Adjust the volume, click **Прослушать** to preview
4. Chat with the agent — your sound plays when the reply completes

## How it works

The plugin uses only the official [Desktop Plugin SDK](https://hermes-agent.nousresearch.com/docs/) (`@hermes/plugin-sdk`):

- `ctx.onEvent('message.complete', …)` — the turn-end hook
- `ctx.registerSettingsPage(…)` — the Settings → Plugins page (native `ListRow` rows, themed via CSS variables)
- `ctx.storage` — plugin-local persistence for the audio (as a data URL) and volume

No Hermes source files are modified; nothing to rebuild.

> **Note:** Desktop plugins run with the app's broad authority, not a hard sandbox. Only install code you wrote or reviewed — this plugin is ~180 lines, read it before loading it.

## Compatibility

Verified against Hermes Desktop 3.2.x (macOS). `registerSettingsPage` is feature-detected (`?.`), so the plugin still loads on older builds — the settings page just won't render there.

## License

MIT
