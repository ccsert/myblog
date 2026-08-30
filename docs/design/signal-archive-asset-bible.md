# Signal Archive Asset Bible

## Experience loop

1. A visitor enters the archive as the player character.
2. They inspect the current room and discover fragments of the owner's story and work.
3. Environmental problems block the room's server from starting.
4. The player diagnoses and repairs those problems through short interactions.
5. The server boots successfully and the room monitor becomes a transition surface.
6. The camera moves into the monitor and hands control to the existing terminal interface.

The exact stories, repair tasks, and progression order remain deliberately open until the content pass.

## Rendering contract

- Logical tile: `32 x 32 px`.
- Display scale: integer scaling only, starting at `2x`.
- Filtering: nearest-neighbor; no antialiasing.
- Character logical frame: `48 x 80 px` on a `64 x 96 px` transparent cell.
- Character anchor: bottom center, between the boots.
- Object anchor: bottom center unless the manifest overrides it.
- Camera: three-quarter top-down, matching the approved concept.
- Runtime text: rendered as real HTML text, never baked into bitmap assets.

## Character set

The archivist keeps the approved mature proportions, brown hair, dark olive utility coat, dark trousers, and black boots.

Required directions:

- front
- back
- left
- right

Required states:

- idle: one stable frame per direction
- walk: four frames per direction; the first production batch may begin with two opposing stride keys
- inspect: one short interaction pose per direction as needed
- repair: a later task-specific animation set

All character outputs must be separate transparent PNG files with the same canvas, baseline, palette, pixel density, and silhouette.

## Atomic scene layers

1. Environment tiles: floor, walls, rug, windows, thresholds.
2. Static props: shelves, boxes, lamps, tables, cables, plants, door.
3. Interactive objects: engineering console, agent workstation, product bench, field-notes desk, server monitor.
4. State overlays: idle, hover, active, repaired, completed.
5. Effects: rain, dust, warm lamp light, green signal glow, boot/contact shadows.
6. UI chrome: nine-slice frames and pixel icons; labels and paragraphs remain HTML.

Lighting and interaction states must remain separate from base props so that the room can respond without replacing a full background image.

## Initial palette

- void: `#070908`
- charcoal: `#111512`
- deep olive: `#243026`
- signal green: `#68d86b`
- dim cyan: `#31545c`
- tobacco: `#7b4e2e`
- brass: `#b67a3d`
- paper: `#d6ccb2`

Minor ramps may be added, but every asset must reuse the same master palette.

## File layout

```text
public/game/signal-archive/
  characters/archivist/source/
  objects/source/
  effects/source/
```

Runtime-normalized atlases will be generated from these atomic source files after the first batch passes consistency review.

## Manifest fields

Every runtime asset will eventually declare:

- `id`
- `src`
- `logicalSize`
- `anchor`
- `zIndex`
- `collisionBox`
- `interactionBox`
- `state`
- `animationFrames`
- `frameDuration`
