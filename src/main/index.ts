import { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join } from 'node:path';
import { loadNotes, saveNotes } from './store';
import { MAX_NOTE_FONT_SIZE, MIN_NOTE_FONT_SIZE, DEFAULT_NOTE_FONT_SIZE, stickyColors, type ChecklistItem, type NoteType, type StickyNoteRecord } from './types';

const NOTE_WIDTH = 244;
const NOTE_HEIGHT = 230;
const PEEK_WIDTH = 32;
const GAP = 16;
const EMPTY_STATE_WIDTH = 162;
const EMPTY_STATE_HEIGHT = 52;
let notes: StickyNoteRecord[] = [];
const windows = new Map<string, BrowserWindow>();
let tray: Tray | null = null;
let notesHidden = false;
let emptyStateWindow: BrowserWindow | null = null;

const stamp = () => new Date().toISOString();
const display = () => screen.getPrimaryDisplay().workArea;

function clampY(y: number) {
  const area = display();
  return Math.max(area.y + 12, Math.min(y, area.y + area.height - NOTE_HEIGHT - 12));
}

function noteBounds(note: StickyNoteRecord) {
  const area = display();
  const x = note.edge === 'right'
    ? (note.tucked ? area.x + area.width - PEEK_WIDTH : area.x + area.width - NOTE_WIDTH)
    : (note.tucked ? area.x - NOTE_WIDTH + PEEK_WIDTH : area.x);
  return { x, y: clampY(note.y), width: NOTE_WIDTH, height: NOTE_HEIGHT };
}

function applyBounds(note: StickyNoteRecord, animate = false) {
  const window = windows.get(note.id);
  if (!window || window.isDestroyed()) return;
  const target = noteBounds(note);
  if (!animate) { window.setBounds(target); return; }
  const start = window.getBounds();
  const startedAt = Date.now();
  const duration = 170;
  const tick = () => {
    if (window.isDestroyed()) return;
    const progress = Math.min(1, (Date.now() - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    window.setBounds({ ...target, x: Math.round(start.x + (target.x - start.x) * eased) });
    if (progress < 1) setTimeout(tick, 16);
  };
  tick();
}

function persist() { saveNotes(notes); }
function save(note: StickyNoteRecord, update: Partial<StickyNoteRecord>) {
  const next = { ...note, ...update, updatedAt: stamp() };
  notes = notes.map((item) => item.id === note.id ? next : item);
  persist();
  applyBounds(next, update.tucked !== undefined && update.tucked !== note.tucked);
  return next;
}

function createNote(seed?: Partial<StickyNoteRecord>) {
  const count = notes.length;
  const record: StickyNoteRecord = {
    id: crypto.randomUUID(), content: '', type: 'text', checklist: [], color: 'yellow', fontSize: DEFAULT_NOTE_FONT_SIZE, edge: 'right',
    y: 40 + (count % 4) * (NOTE_HEIGHT + GAP), tucked: false, createdAt: stamp(), updatedAt: stamp(), ...seed
  };
  notes = [...notes, record];
  persist();
  createWindow(record);
  syncEmptyState();
  return record;
}

function emptyStateBounds() {
  const area = display();
  return { x: area.x + area.width - 172, y: area.y + 24, width: EMPTY_STATE_WIDTH, height: EMPTY_STATE_HEIGHT };
}

function moveEmptyStateBy(deltaY: number) {
  if (!emptyStateWindow || emptyStateWindow.isDestroyed()) return;
  const current = emptyStateWindow.getBounds();
  const area = screen.getDisplayMatching(current).workArea;
  const y = Math.max(area.y, Math.min(current.y + deltaY, area.y + area.height - EMPTY_STATE_HEIGHT));
  emptyStateWindow.setBounds({ ...current, y });
}

function createEmptyStateWindow() {
  const window = new BrowserWindow({
    ...emptyStateBounds(), frame: false, transparent: true, resizable: false, movable: false,
    show: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  emptyStateWindow = window;
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.on('closed', () => { emptyStateWindow = null; });
  const url = app.isPackaged
    ? `file://${join(__dirname, '../renderer/index.html')}?emptyState=1`
    : 'http://localhost:5173?emptyState=1';
  void window.loadURL(url);
  window.once('ready-to-show', () => { window.setBounds(emptyStateBounds()); if (!notesHidden) window.showInactive(); });
}

function syncEmptyState() {
  if (notes.length) {
    emptyStateWindow?.destroy();
    emptyStateWindow = null;
  } else if (!emptyStateWindow || emptyStateWindow.isDestroyed()) {
    createEmptyStateWindow();
  } else if (!notesHidden) {
    emptyStateWindow.showInactive();
  }
}

function createWindow(note: StickyNoteRecord) {
  const window = new BrowserWindow({
    width: NOTE_WIDTH, height: NOTE_HEIGHT, frame: false, transparent: true, resizable: false,
    movable: false, show: false, skipTaskbar: true, alwaysOnTop: true, hasShadow: false,
    webPreferences: { preload: join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  windows.set(note.id, window);
  // Sticky notes are intentionally a persistent desktop surface, including
  // while a browser, maximized app, or fullscreen app is active.
  window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  window.on('closed', () => windows.delete(note.id));
  const url = app.isPackaged
    ? `file://${join(__dirname, '../renderer/index.html')}?noteId=${note.id}`
    : `http://localhost:5173?noteId=${note.id}`;
  void window.loadURL(url);
  window.once('ready-to-show', () => { applyBounds(note); window.showInactive(); });
}

function focusNote(note: StickyNoteRecord) {
  if (notesHidden) setNotesHidden(false);
  save(note, { tucked: false });
  const window = windows.get(note.id);
  window?.show(); window?.focus(); window?.webContents.send('sticky:focus-editor');
}

function setNotesHidden(hidden: boolean) {
  notesHidden = hidden;
  windows.forEach((window) => {
    if (hidden) window.hide();
    else window.showInactive();
  });
  if (hidden) emptyStateWindow?.hide();
  else syncEmptyState();
  refreshTrayMenu();
}

function launchesOnStartup() {
  return app.getLoginItemSettings().openAtLogin;
}

function setLaunchOnStartup(enabled: boolean) {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
    path: process.execPath
  });
  refreshTrayMenu();
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'New Sticky', click: () => focusNote(createNote()) },
    { label: 'Show All Notes', click: () => notes.forEach((note) => save(note, { tucked: false })) },
    { label: 'Tuck All Notes', click: () => notes.forEach((note) => save(note, { tucked: true })) },
    { label: notesHidden ? 'Show Notes' : 'Hide Notes', click: () => setNotesHidden(!notesHidden) },
    { type: 'checkbox', label: 'Launch on Startup', checked: launchesOnStartup(), click: (item) => setLaunchOnStartup(item.checked) },
    { type: 'separator' }, { label: 'Quit', click: () => app.quit() }
  ]));
}

function buildTray() {
  const iconPath = app.isPackaged
    ? join(__dirname, '../renderer/tray-icon.png')
    : join(process.cwd(), 'public', 'tray-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip('Sticky Edges');
  refreshTrayMenu();
}

function enableAutoUpdates() {
  // The macOS build is deliberately unsigned while we distribute it outside
  // the App Store. Keep those releases manual until it is signed/notarized.
  if (!app.isPackaged || process.platform === 'darwin') return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // GitHub Releases is the update feed generated by electron-builder. Updates
  // download silently and install on the next normal app exit.
  void autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
    console.error('Update check failed:', error);
  });
}

function senderNote(event: Electron.IpcMainInvokeEvent) {
  const note = [...windows.entries()].find(([, window]) => window.webContents.id === event.sender.id)?.[0];
  const record = note && notes.find((item) => item.id === note);
  if (!record) throw new Error('Unknown sticky window');
  return record;
}
function validText(value: unknown, limit = 400) {
  if (typeof value !== 'string') throw new Error('Expected text');
  return value.slice(0, limit);
}

app.whenReady().then(() => {
  notes = loadNotes();
  notes.forEach(createWindow);
  syncEmptyState();
  buildTray();
  enableAutoUpdates();
  globalShortcut.register('CommandOrControl+Shift+N', () => focusNote(createNote()));

  ipcMain.handle('sticky:create-note', () => { focusNote(createNote()); });
  ipcMain.handle('sticky:get-note', (event) => senderNote(event));
  ipcMain.handle('sticky:save-content', (event, content: unknown) => save(senderNote(event), { content: validText(content) }));
  ipcMain.handle('sticky:set-tucked', (event, tucked: unknown) => {
    if (typeof tucked !== 'boolean') throw new Error('Expected tucked state');
    return save(senderNote(event), { tucked });
  });
  ipcMain.handle('sticky:move-by', (event, delta: unknown) => {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) throw new Error('Expected vertical movement');
    const note = senderNote(event); return save(note, { y: clampY(note.y + delta) });
  });
  ipcMain.handle('sticky:move-empty-state-by', (event, delta: unknown) => {
    if (typeof delta !== 'number' || !Number.isFinite(delta)) throw new Error('Expected vertical movement');
    if (!emptyStateWindow || emptyStateWindow.isDestroyed() || emptyStateWindow.webContents.id !== event.sender.id) throw new Error('Unknown empty-state window');
    moveEmptyStateBy(delta);
  });
  ipcMain.handle('sticky:set-color', (event, color: unknown) => {
    if (!stickyColors.includes(color as typeof stickyColors[number])) throw new Error('Invalid color');
    return save(senderNote(event), { color: color as typeof stickyColors[number] });
  });
  ipcMain.handle('sticky:set-font-size', (event, fontSize: unknown) => {
    if (typeof fontSize !== 'number' || !Number.isInteger(fontSize) || fontSize < MIN_NOTE_FONT_SIZE || fontSize > MAX_NOTE_FONT_SIZE) {
      throw new Error(`Font size must be an integer between ${MIN_NOTE_FONT_SIZE} and ${MAX_NOTE_FONT_SIZE}`);
    }
    return save(senderNote(event), { fontSize });
  });
  ipcMain.handle('sticky:set-type', (event, type: unknown) => {
    if (type !== 'text' && type !== 'checklist') throw new Error('Invalid note type');
    return save(senderNote(event), { type: type as NoteType });
  });
  ipcMain.handle('sticky:save-checklist', (event, items: unknown) => {
    if (!Array.isArray(items) || items.some((item) => typeof item?.id !== 'string' || typeof item?.text !== 'string' || typeof item?.checked !== 'boolean')) throw new Error('Invalid checklist');
    return save(senderNote(event), { checklist: (items as ChecklistItem[]).slice(0, 8).map((item) => ({ ...item, text: item.text.slice(0, 80) })) });
  });
  ipcMain.handle('sticky:delete', (event) => {
    const note = senderNote(event); notes = notes.filter((item) => item.id !== note.id); persist(); windows.get(note.id)?.close(); syncEmptyState();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());
app.on('window-all-closed', () => undefined);
