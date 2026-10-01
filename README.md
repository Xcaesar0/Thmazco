# طهماز — Digital Experience Proposal (UpToMedia)

An interactive, scene-by-scene web presentation of UpToMedia's proposal to Tahmaz.
This is a presentation, not the Tahmaz website.

## Run

Serve the folder over HTTP (fonts don't load over `file://`):

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Structure

```
index.html            Stage, persistent HUD, scenes
css/fonts.css         Self-hosted Alexandria / Cairo / IBM Plex Mono (OFL)
css/foundation.css    Tokens, Arabic type scale, stage + reveal primitives, HUD
css/s01-opening.css   Scene 01 — Opening
css/chapters.css      Chapters 02–14
js/stage.js           Scene controller: wheel / keys / swipe, rail, parallax, boot
js/s01-opening.js     Gauge drawing (opening + closing)
js/chapters.js        Current-site screenshot slots
assets/               Images and fonts (UI screens, photo + logo exported from the Tahmaz Figma)
```

## Adding a scene

1. Add `<section class="scene sNN" id="sNN" data-scene="name">` inside `.stage`.
2. Use the reveal primitives (`.r-line`, `.r-fade`, `.r-draw`, stagger with `--d`);
   they resolve when the scene receives `.is-in`.
3. Wrap parallax layers in `.layer[data-depth]`; keep reveal transforms on children.
4. Optional hooks: `Stage.register("name", { enter(el) {}, leave(el) {} })`.

`data-total` on `.stage` is the planned scene count shown in the rail.

## Arabic typography rules

- Never apply `letter-spacing` to Arabic (it breaks joining). Tracking is for `.mono` only.
- Never split Arabic into per-letter spans; reveal whole lines with masks.
- Display line-height ≥ 1.3, statements 1.6, body 1.8–1.9.

## Current-site screenshots

Chapters 02 and 13 show a schematic of the current tahmazco.com until real
screenshots are added. Save them as:

```
assets/img/current/home.jpg
assets/img/current/products.jpg
assets/img/current/projects.jpg
```

They replace the schematics automatically (16:10 crops work best).

## Navigation

Wheel / ↑ ↓ / Page Up–Down / Space / swipe. `Home` and `End` jump to the first
and last scene; `#01`…`#14` in the URL opens a specific scene.
