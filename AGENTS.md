# lofivan development handoff

## Project

This is a buildless static website. `dist/index.html`, `dist/style.css`, and `dist/app.js` are editable source, not generated output. Artwork and audio live in `dist/assets/`. There is no dependency manifest or backend.

Serve locally with `python3 -m http.server 8000 --bind 127.0.0.1 --directory dist`, then open http://localhost:8000. JavaScript syntax can be checked with `node --check dist/app.js` when Node is available.

## User's established direction

- Site title: `lofivan`. Character: Ivan. Terminal username: `1vnzh`.
- Minimal interface: the animated room and the CRT terminal, without captions, slogans, clock labels, badges, playback controls, or extra buttons.
- The live terminal stays directly on the CRT glass. Click the CRT to focus it; click away or press Escape to blur it. No zoom, popup, desktop, or visible close button.
- Typed input appears inline immediately after the `$` prompt, using matching typography.
- `help` lists command names only, without descriptions or hints.
- There is no `music` command. Keep the hidden funny commands out of both help and autocomplete; discover their implementations in the command switch.
- Keep the terminal commands, including `cowsay`, `north` returning `strong and free`, and `north2` returning `coming soon`.
- `about` opens https://twitter.com/1vnzh in a new tab.
- Music tries to autoplay, with a first-interaction fallback when required by the browser. Soft typing clicks and a faint CRT hum are part of the experience. No play/pause controls.
- A white "click to listen" hint gently floats and pulses at the center of the screen until the first click or tap, then disappears for the rest of that page visit. Typing and playback starting do not dismiss it. Respect reduced-motion preferences.
- Preserve the sunny brick-and-plants scene. Ivan faces left and wears headphones while using his heavily stickered laptop. The CRT is a separate computer.
- The small NVIDIA DGX Spark beside the CRT should stand vertically.
- Preserve readable sticker and book lettering; do not mirror their text. Keep the keyboard numpad on the right.

## Implementation notes

- `placeRoom()` uses the original 1672 x 941 world on desktop. On portrait screens up to 900px wide, it arranges Ivan above the CRT against a cropped room background; small landscape screens get a larger CRT.
- `.computer-rig` groups the CRT, keyboard, Spark, screen glow, and live terminal. It uses `display: contents` on desktop and shared transforms on compact layouts. Compact rig coordinates are 625 x 417, with the terminal at (240, 75), sized 222 x 194. Preserve glass alignment after artwork or layout edits.
- Compact layouts use a shorter `1vnzh:~ $` prompt and larger text; ASCII-art output retains its fixed-width layout. The terminal does not automatically focus on phone-sized screens.
- Keyboard resizing preserves the scene's original height and scale, moving the room upward only as needed to keep the CRT above the keyboard. Use the visual viewport for keyboard visibility and account for its closing animation.
- The park sticker is a separate overlay within the character layer; preserve its position and readable caption.
- The terminal uses a small simulated in-memory filesystem. It does not execute a real system shell.
- `commandNames` is used by both help output and tab completion.
- Commands and output use text content, not HTML injection.
- Styling includes earlier unused desktop/app rules. Preserve the working minimal interface when changing relevant selectors; a framework rewrite or broad cleanup is not needed for a focused edit.
- The optional WebMCP registration is feature-detected; the site works without it.
- Google Fonts is the only externally loaded visual dependency. Artwork and the MP3 loop are bundled locally.

## Export scope

This is a portable source snapshot with a written handoff. It does not include the original conversation, Git history, or hosting credentials. Local edits do not automatically change the existing published site.
