# Guided Exploration and Terminal Completion Audit

> Status: the embedded Explore direction was reviewed and then removed from the homepage. These screenshots and findings are retained as input for a future standalone, potentially game-like exploration experience. The Tab-completion findings remain active in the terminal.

## Scope

- Surface: ccsert.dev hero workbench at `http://localhost:3000/`
- User goal: let a first-time visitor discover projects and capabilities without knowing command-line syntax, while preserving a capable terminal for technical visitors.
- Accessibility target: semantic, keyboard-operable entry choices and autocomplete with visible state and clear instructions.

## Evidence

1. `01-current-entry.png` — previous command-first entry.
2. `02-guided-entry.png` — new Explore-first entry in the same light theme and viewport.
3. `03-tab-completion.png` — multi-level path suggestions with an active candidate.
4. `04-mobile-explore.png` — 390 × 844 guided entry and internal continuation.

## Findings and response

### Previous entry

- Strength: the terminal was authentic, functional, and visually distinctive.
- UX risk: every meaningful first action was written as a command; the Quick start block explained syntax but did not provide clickable next steps.
- Accessibility risk: a visitor could reach the terminal input, but there was no visible autocomplete state or programmatic relationship between the input and possible commands.

### Guided entry

- The default Explore tab now offers three human-language trails: featured work, builder profile, and capability map.
- Each trail is a real button that opens the existing Preview experience; the shell equivalent is secondary learning material, not a prerequisite.
- Safe command buttons provide a gradual bridge into the terminal without requiring memorized syntax.

### Terminal completion

- Typing a partial command opens a labelled listbox connected to the terminal combobox.
- Up and Down change the active candidate; Tab applies it, repeated Tab cycles the original candidate set, and Shift+Tab cycles backward.
- Command names, theme values, search ideas, and multi-level virtual paths are supported. Folder completion immediately exposes its children.
- Candidates are clickable and terminal focus is retained after execution.

### Responsive behavior

- At 390 × 844 the first two trails remain visible, the Explore panel scrolls independently for the remaining trail and safe commands, and clicking a trail moves directly to Preview.
- No horizontal overflow was observed.

## Evidence limits

- The screenshots support visual hierarchy and visible-state findings, not full WCAG compliance.
- Keyboard behavior, focus retention, ARIA state, and responsive overflow were additionally checked in the live browser.

## Result

The experience now has a clear low-friction entry for non-command-line visitors and a richer, discoverable command model for advanced visitors.
