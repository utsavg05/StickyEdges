export const stickyColors = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;
export type StickyColor = (typeof stickyColors)[number];
export type NoteType = 'text' | 'checklist';
export const MIN_NOTE_FONT_SIZE = 7;
export const MAX_NOTE_FONT_SIZE = 32;
export const DEFAULT_NOTE_FONT_SIZE = 21;

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface StickyNoteRecord {
  id: string;
  content: string;
  type: NoteType;
  checklist: ChecklistItem[];
  color: StickyColor;
  fontSize: number;
  edge: 'left' | 'right';
  y: number;
  tucked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StickyApi {
  createNote(): Promise<void>;
  getNote(): Promise<StickyNoteRecord>;
  saveContent(content: string): Promise<StickyNoteRecord>;
  setTucked(tucked: boolean): Promise<StickyNoteRecord>;
  moveBy(deltaY: number): Promise<StickyNoteRecord>;
  moveEmptyStateBy(deltaY: number): Promise<void>;
  setColor(color: StickyColor): Promise<StickyNoteRecord>;
  setFontSize(fontSize: number): Promise<StickyNoteRecord>;
  setType(type: NoteType): Promise<StickyNoteRecord>;
  saveChecklist(items: ChecklistItem[]): Promise<StickyNoteRecord>;
  deleteNote(): Promise<void>;
  onFocusEditor(callback: () => void): () => void;
}
