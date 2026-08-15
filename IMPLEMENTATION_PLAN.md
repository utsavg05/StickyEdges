# Implementation Plan

## Phase 0 — Prototype (in progress)

- [x] Define the process boundaries, data model, and window geometry.
- [x] Scaffold a minimal Electron, React, and TypeScript app.
- [x] Open one transparent frameless note near the right edge.
- [x] Add hover reveal/tuck and smooth renderer motion.
- [x] Add immediate text editing and vertical drag behavior.
- [x] Persist the prototype note and restore it after restart.
- [x] Verify production build. Validate live Windows interaction next.

## Phase 1 — MVP note management

- [x] Create notes through `Ctrl+Shift+N` and the system tray.
- [x] Support multiple note windows, deletion, and colors.
- [x] Add simple inline checklist items and persistence.
- [ ] Add left/right edge transfer.
- [ ] Clamp, reorder, and space notes predictably.

## Phase 2 — Desktop integration

- [ ] Add launch-on-startup preference.
- [ ] Add minimal settings for shortcut, default color/edge, auto-tuck, and animation.
- [ ] Respond safely to work-area and display changes.
- [ ] Tune always-on-top behavior around fullscreen applications.

## Phase 3 — Release quality

- [ ] Add geometry, persistence, and IPC tests.
- [ ] Test scaling, taskbar locations, multiple monitors, sleep/restart, and accidental close.
- [ ] Package and sign a Windows installer.
- [ ] Publish contributor setup and theming documentation.
