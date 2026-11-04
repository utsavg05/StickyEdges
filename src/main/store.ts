import { app } from 'electron';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_NOTE_FONT_SIZE, MAX_NOTE_FONT_SIZE, MIN_NOTE_FONT_SIZE, type StickyNoteRecord } from './types';

type Store = { version: 1; notes: StickyNoteRecord[] };
const stamp = new Date().toISOString();
const starterNotes: StickyNoteRecord[] = [
  { id: 'today', content: 'Today', type: 'checklist', checklist: [{ id: 'ui', text: 'Finish UI design', checked: true }, { id: 'email', text: 'Reply to emails', checked: true }, { id: 'mike', text: 'Call Mike', checked: false }], color: 'yellow', fontSize: DEFAULT_NOTE_FONT_SIZE, edge: 'right', y: 44, tucked: false, createdAt: stamp, updatedAt: stamp },
  { id: 'meeting', content: 'Meeting\nat 2:00 PM', type: 'text', checklist: [], color: 'green', fontSize: DEFAULT_NOTE_FONT_SIZE, edge: 'right', y: 274, tucked: false, createdAt: stamp, updatedAt: stamp },
  { id: 'groceries', content: 'Buy groceries', type: 'checklist', checklist: [{ id: 'eggs', text: 'Eggs', checked: false }, { id: 'milk', text: 'Milk', checked: false }, { id: 'bread', text: 'Bread', checked: false }], color: 'pink', fontSize: DEFAULT_NOTE_FONT_SIZE, edge: 'right', y: 504, tucked: false, createdAt: stamp, updatedAt: stamp }
];

function storePath() { return join(app.getPath('userData'), 'notes.json'); }

export function loadNotes(): StickyNoteRecord[] {
  const path = storePath();
  if (!existsSync(path)) return starterNotes;

  try {
    const candidate = JSON.parse(readFileSync(path, 'utf8')) as Partial<Store>;
    return Array.isArray(candidate.notes)
      ? candidate.notes.map((note) => ({
          ...note,
          fontSize: Number.isInteger(note.fontSize)
            && note.fontSize >= MIN_NOTE_FONT_SIZE
            && note.fontSize <= MAX_NOTE_FONT_SIZE
            ? note.fontSize
            : DEFAULT_NOTE_FONT_SIZE
        }))
      : starterNotes;
  } catch {
    return starterNotes;
  }
}

export function saveNotes(notes: StickyNoteRecord[]) {
  const path = storePath();
  const temporaryPath = `${path}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify({ version: 1, notes }, null, 2), 'utf8');
  renameSync(temporaryPath, path);
}
