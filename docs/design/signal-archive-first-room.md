# Signal Archive — First Room

> This focused room brief is subordinate to the complete logic in [`signal-archive-game-logic.md`](./signal-archive-game-logic.md).

## Experience promise

The first room should feel like entering a dormant personal archive, not opening a portfolio menu. A visitor learns how the owner thinks by restoring one small system. No command-line knowledge is required; the terminal is the reward and the next layer of the experience.

Target first-session length: **3–5 minutes with direct guidance, 5–7 minutes naturally, and 8–12 minutes for broad exploration**.

## Core loop

```text
arrival -> explore -> diagnose -> repair -> boot -> terminal
```

1. **Arrival** — the room is dim, the server is offline, and a restrained green signal leads toward the first inspectable object.
2. **Explore** — three nearby objects reveal short story fragments and teach movement and inspection without a tutorial modal.
3. **Diagnose** — inspecting the server exposes three visible faults in the room itself.
4. **Repair** — the visitor resolves each fault through a short spatial interaction; there is no command input, inventory grid, timer, or fail state.
5. **Boot** — lights, equipment, and ambient sound respond in sequence so the whole room feels restored.
6. **Terminal** — the camera pushes into the now-active monitor; the existing terminal experience takes over without a route-like hard cut.

## The three repairs

Each repair doubles as a small statement about engineering practice.

### 1. Power link

- Visible problem: a detached cable and an amber status light beside the server rack.
- Interaction: inspect the connector, then reconnect the highlighted line.
- Meaning: connect the system before trying to operate it.
- Completion feedback: cable pulse travels toward the rack and the first bank of LEDs wakes.

### 2. Health loop

- Visible problem: cooling airflow or a health sensor is blocked and reports stale data.
- Interaction: clear the obstruction, reseat the sensor, then watch the reading stabilize.
- Meaning: observe the system before changing it.
- Completion feedback: the fan starts, the amber warning fades, and a second signal segment turns green.

### 3. Boot order

- Visible problem: three services are waiting in the wrong dependency order.
- Interaction: arrange three physical service tokens using a nearby field note as the clue.
- Meaning: make dependencies explicit and keep recovery understandable.
- Completion feedback: the monitor runs a short boot sequence and the room transitions to its online lighting state.

## Interaction language

- Movement supports `WASD`, arrow keys, and click-to-move.
- Every important object gains a soft outline only when it is reachable.
- A single contextual prompt appears beside the current object: one primary action and, at most, one supporting action.
- The current objective is environmental first and textual second; the interface should never become a quest dashboard.
- After roughly 20 seconds without progress, a subtle signal pulse points toward the relevant object.
- After roughly 60 seconds, `Show signal path` becomes available.
- `Return to Terminal` remains visible but quiet, so returning visitors can bypass the room.
- Reduced-motion mode replaces the camera push and light sweeps with a brief crossfade.

## Interaction density

The room should contain three depths of interaction so it feels alive without turning every prop into a labeled hotspot.

### Core interactions

These change progression and each produces a visible room-wide consequence.

- diagnose and repair the server;
- operate the engineering console to trace the broken signal path;
- run a small agent simulation at the central workstation;
- reconstruct a product decision on the blueprint table;
- decode a boot clue from the field-notes desk.

### Ambient interactions

These are optional, instant, and mostly discovered by proximity.

- tune the radio and catch fragments of old transmissions;
- switch task lamps and change local lighting;
- open one drawer or archive box for a short personal artifact;
- inspect the rainy window and alter the room ambience;
- wake a dormant side monitor and reveal a system snapshot;
- examine small desk objects for one-line observations.

### Hidden interactions

These reward curiosity rather than block progression.

- a repeated radio frequency reveals a concealed message;
- inspecting three related artifacts unlocks a private field note;
- restoring devices in an unusual order triggers an alternate boot line.

Only the nearest core interaction receives a text label. Other reachable objects use a tiny signal pip, a lighting change, a sound cue, or a character glance. Ambient and hidden interactions should never appear as a checklist.

The target density for the first room is **five core interactions, six ambient interactions, and three hidden responses**, with only one contextual action panel visible at a time.

The `14` total is an internal content budget. It must not appear as a permanent completion counter during the first visit; a signal index may become available only after the server is online.

## Story slots

The exact biography content remains open. The first room reserves three short story slots rather than inventing achievements now:

- **Engineering Systems** — a system, incident, or infrastructure lesson.
- **Agent Systems** — an AI or automation idea expressed through a working artifact.
- **Field Notes** — a personal principle, turning point, or unfinished question.

Each fragment should fit in 45–90 seconds and end with a useful clue for one repair, so story discovery and gameplay stay connected.

## Repair-state screen

The first production mock shows the `diagnose` state with **Power link** selected:

- the character stands beside the offline server;
- the detached cable is the brightest local affordance;
- the other two faults are visible but subdued;
- a compact console prompt explains the failure and offers `Repair` / `Inspect`;
- progress reads `RESTORE 0 / 3`;
- the room remains fully visible behind the prompt.

## Transition to the terminal

Boot completion should be a room-wide event:

1. rack LEDs rise from bottom to top;
2. the green signal travels across previously inspected objects;
3. the workstation monitor illuminates;
4. the camera eases toward the screen while room audio narrows into terminal ambience;
5. the terminal UI becomes sharp inside the display, then expands to fill the viewport.

The visitor should understand that the terminal is inside the archive world, not a separate website pasted after the game.

## Next atomic assets

- cable connector: detached, hover, connected;
- health sensor/filter: blocked, active, stable;
- service tokens: three neutral tiles plus selected and ordered states;
- status lights: amber warning, green online;
- signal path pulse and repair spark effects;
- server boot frames and monitor transition mask;
- inspect and repair poses for the archivist.
