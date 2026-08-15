# Sticky Edges

A Windows-first Electron prototype for physical-feeling sticky notes that tuck behind the desktop edge.

## Run it

```powershell
npm install
npm run dev
```

The first launch creates a paper-like stack of notes inspired by the supplied reference image. Hover a note to reveal it if tucked, edit its text, drag the paper vertically, and use `•••` for color, type, and deletion controls. Notes save locally. Press `Ctrl + Shift + N` to create and focus a new sticky.

To create production assets:

```powershell
npm run build
npm run start
```

## Project map

- `src/main/index.ts` owns the native Electron window, screen-edge geometry, global shortcut, and IPC validation.
- `src/main/store.ts` persists the prototype note atomically in Electron user data.
- `src/main/preload.ts` exposes the minimal secure renderer API.
- `src/renderer/sticky-note.tsx` implements note editing, hover behavior, and drag intent.
- `ARCHITECTURE.md` and `IMPLEMENTATION_PLAN.md` describe the route from this prototype to the full MVP.

## Current scope

This build includes multiple independently positioned right-edge notes, five paper colors, simple checklists, local persistence, the global create shortcut, and a native tray command menu. Left-edge placement, settings, collision handling, startup configuration, and fullscreen-aware visibility are next.
