export const stickyColors = ['yellow', 'pink', 'blue', 'green', 'purple'] as const;
export type StickyColor = (typeof stickyColors)[number];
export type NoteType = 'text' | 'checklist';

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
  edge: 'left' | 'right';
  y: number;
  tucked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StickyApi {
  getNote(): Promise<StickyNoteRecord>;
  saveContent(content: string): Promise<StickyNoteRecord>;
  setTucked(tucked: boolean): Promise<StickyNoteRecord>;
  moveBy(deltaY: number): Promise<StickyNoteRecord>;
  setColor(color: StickyColor): Promise<StickyNoteRecord>;
  setType(type: NoteType): Promise<StickyNoteRecord>;
  saveChecklist(items: ChecklistItem[]): Promise<StickyNoteRecord>;
  deleteNote(): Promise<void>;
  onFocusEditor(callback: () => void): () => void;
}
