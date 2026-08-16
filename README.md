# Sticky Edges

Sticky Edges is a lightweight Windows desktop app that turns the edge of your screen into a persistent space for paper-like reminders. Create a note, tuck it against the desktop edge, and pull it back out whenever you need it—without opening a traditional notes app.

![License](https://img.shields.io/badge/platform-Windows-0078D4?logo=windows&logoColor=white)
![Built with Electron](https://img.shields.io/badge/built%20with-Electron-47848F?logo=electron&logoColor=white)

## Launch demo

https://github.com/user-attachments/assets/277f957d-712c-43b1-8f33-04136df4ccc3

## Features

- Sticky notes that live at the desktop edge and smoothly reveal on hover.
- Paper-inspired visuals: five colors, subtle texture, folded corners, shadows, and natural rotation.
- Plain notes and interactive checklists.
- Add, edit, check off, or delete individual checklist items.
- Drag notes vertically to organize the desktop.
- Persistent local storage for every note, including content, color, position, and checklist state.
- `Ctrl + Shift + N` to create a new sticky instantly.
- System-tray controls for creating, showing, tucking, and hiding notes.
- Optional **Launch on Startup** toggle in the tray menu.
- Automatic update checks through GitHub Releases.

## Install

Download the latest Windows installer from [GitHub Releases](https://github.com/utsavg05/StickyEdges/releases), then run **Sticky Edges Setup**.

Windows SmartScreen may show a warning for unsigned community software. Select **More info → Run anyway** only if you downloaded the installer from this repository’s official Releases page.

## How to use it

1. Hover a tucked note to reveal it.
2. Click a note to write or edit its contents.
3. Drag the paper background to move it vertically.
4. Open `•••` to change its color, switch between a plain note and checklist, or delete it.
5. Use the tray icon to hide/show all notes, tuck all notes, create a new note, or enable launch on startup.

Notes intentionally remain visible above other apps, including fullscreen content. Use **Hide Notes** in the tray whenever you want a completely clear screen.

## Development

### Requirements

- Windows 10 or later
- Node.js 22 or later

### Run locally

```powershell
git clone https://github.com/utsavg05/StickyEdges.git
cd StickyEdges
npm install
npm run dev
```

### Build an installer

```powershell
npm run dist
```

The generated NSIS installer is placed in `release/`.

## Project structure

```text
src/main/       Electron windows, tray controls, persistence, updates, and IPC
src/renderer/   React sticky-note interface and animations
public/         Tray and application icons
.github/        GitHub Actions release workflow
```

## Releases and updates

Every version tag beginning with `v` triggers the GitHub Actions release workflow. It builds the installer, publishes it to GitHub Releases, and generates update metadata for installed apps.

For release instructions, see [RELEASING.md](RELEASING.md).

## Contributing

Issues and pull requests are welcome. Please keep the app lightweight, local-first, and focused on the simple “sticky notes attached to a monitor” experience.

## License

Distributed under the [MIT License](LICENSE). You are free to use, modify, and distribute Sticky Edges in accordance with the license terms.
