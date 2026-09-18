# lofivan

An illustrated lofi room with a working terminal on the CRT screen.

This export contains the editable HTML, CSS, JavaScript, artwork, and music used by the site. There is no build step, backend, package installation, or API key requirement. Files in `dist/` are the source files; edit them directly.

## Run locally

Unzip this archive, open a terminal in the `lofivan` folder, and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

On Windows, use `py` instead of `python3` if that is your Python launcher.

Open <http://localhost:8000>. Keep the terminal open while using the site; press Ctrl+C to stop the server. Refresh the browser after editing a file.

Music attempts to start automatically. If your browser blocks autoplay, click or type once to start it. Google Fonts loads over the internet; system font fallbacks work offline. The `about` command opens an external Twitter profile.

## Continue in Codex

With Codex CLI installed, open a second terminal in this `lofivan` folder and run:

```sh
codex
```

Ask it to read `AGENTS.md` and continue working on the site. That file carries the design decisions and implementation notes into the new session. The ZIP transfers the project and this written handoff, not the original chat session.

Official setup instructions: <https://learn.chatgpt.com/docs/codex/cli>.

## Files

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Scene layers and terminal markup |
| `dist/style.css` | Layout, animation, CRT placement, and typography |
| `dist/app.js` | Terminal commands, input, sound, and responsive scene positioning |
| `dist/assets/` | Layered PNG artwork and the MP3 music loop |
| `AGENTS.md` | Context for continued development |
| `render_music.py` | Optional source for regenerating the music as a WAV; requires NumPy |

## Hosting elsewhere

Upload the contents of `dist/` to a static web host. The entrypoint is `index.html`; no build command is needed. This export is independent of the currently published site: local edits do not update that publication automatically.

Current publication: <https://late-afternoon-desk.brhydon.chatgpt.site>.

