# Sticky Edges Architecture

## Purpose

Sticky Edges is a Windows-first Electron utility. Its primary interface is a collection of small, frameless windows attached to the left or right edge of a display. It is deliberately not a conventional notes application with a main workspace.

## First milestone: interaction prototype

The first build validates one right-edge sticky note: it can be created, edited, dragged vertically, tucked partly off-screen, and revealed smoothly on hover. This isolates the core product risk before adding note management, tray controls, and multi-monitor behavior.

## Runtime model

```text
Electron main process
  |-- owns StickyWindow instances and their native bounds
  |-- registers global shortcuts and app lifecycle handlers
  |-- persists note records to a local JSON store
  |-- exposes narrow IPC commands to renderers
  |
  +-- one transparent, frameless BrowserWindow per note
          |
          +-- React renderer: paper UI, editing, checklist, visual state
```

This one-window-per-note design is intentional: the operating system controls the real desktop edge, cursor interaction, stacking, work area, and multi-monitor coordinates. A renderer must never be trusted as the source of screen/window geometry.

## Process responsibilities

### Main process

- Creates and destroys native note windows.
- Calculates visible/tucked bounds from the display work area, keeping taskbars clear.
- Owns drag movement and edge transfers.
- Serializes `NoteRecord` values at user-data scope using atomic writes.
- Registers `Ctrl+Shift+N`, tray commands, startup behavior, and display-change recovery.
- Suppresses always-on-top behavior in fullscreen or other user-configured visibility modes in later milestones.

### Preload bridge

- Exposes a small, typed API under `window.sticky`.
- Uses `contextIsolation: true` and does not expose Node/Electron globals to React.
- Validates incoming IPC payloads in the main process before mutating state.

### Renderer

- Renders a paper-like note and keeps transient UI state only (hover, editor focus, drag feedback).
- Sends intent to the main process: update content, set color, change tuck state, start/move/end drag, delete.
- Does not read/write local files or position windows directly.

## Data model

```ts
type NoteRecord = {
  id: string;
  content: string;
  type: 'text' | 'checklist';
  checklist: Array<{ id: string; text: string; checked: boolean }>;
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
  edge: 'left' | 'right';
  displayId: number;
  y: number;
  tucked: boolean;
  createdAt: string;
  updatedAt: string;
};
```

For the prototype, only one `text` note uses a fixed right edge. The complete model is documented now so persistence does not need a breaking migration later.

## Window geometry

Every note has a full window width. In revealed state, it sits fully within `display.workArea`. In tucked state, only the configured `peekWidth` is inside the work area. The window remains interactable because the visible strip remains inside the display.

```text
right work-area boundary
             |
revealed: [ sticky note ]|
tucked:                 [peek]|
```

The main process clamps the vertical coordinate to the display work area. A later layout service will add collision avoidance and natural ordering among notes on an edge.

## Security and reliability

- `contextIsolation` enabled; `nodeIntegration` disabled.
- IPC allow-list with schema validation.
- Local-only storage; no network capability is needed.
- Persist after every meaningful mutation and restore records at app launch.
- On missing displays, relocate the note to the primary display and retain its record.

## Milestone roadmap

1. **Interaction prototype (current):** one right-edge note, edit, drag, tuck/reveal, native geometry.
2. **MVP note system:** multiple persisted notes, colors, checklists, left/right edges, delete, global new-note shortcut.
3. **Desktop integration:** tray menu, launch on startup, settings, display-change recovery, fullscreen-friendly visibility.
4. **Polish:** collision handling, motion tuning, paper themes, accessibility, packaging, and automated tests.

## Test strategy

- Unit-test geometry and persistence adapters without Electron.
- Smoke-test IPC handling and note restoration with Electron test tooling.
- Manually validate on Windows at 100% and 125% scaling, with taskbar placements and two-monitor disconnect/reconnect.
- Treat interaction quality as an acceptance criterion: tuck must retain a discoverable strip; hover must reveal immediately; and dragging must feel continuous.
