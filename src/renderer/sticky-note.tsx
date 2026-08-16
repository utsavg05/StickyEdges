import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { stickyColors, type ChecklistItem, type StickyNoteRecord } from '../main/types';

const id = () => crypto.randomUUID();

export function StickyNote() {
  if (new URLSearchParams(window.location.search).get('emptyState') === '1') return <EmptyState />;
  return <NoteEditor />;
}

function EmptyState() {
  return <main className="empty-state"><button onClick={() => void window.sticky.createNote()}><span className="empty-state__plus">+</span><span className="empty-state__label">New Sticky</span></button></main>;
}

function NoteEditor() {
  const [note, setNote] = useState<StickyNoteRecord | null>(null);
  const [dragging, setDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const dragY = useRef(0);
  const leaveTimer = useRef<number | undefined>();
  const desiredTucked = useRef<boolean | null>(null);
  const queuedDragDelta = useRef(0);
  const dragInFlight = useRef(false);
  const editor = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    void window.sticky.getNote().then((loaded) => { desiredTucked.current = loaded.tucked; setNote(loaded); });
    return window.sticky.onFocusEditor(() => { editor.current?.focus(); editor.current?.select(); });
  }, []);
  if (!note) return null;

  const update = (request: Promise<StickyNoteRecord>) => void request.then(setNote);
  const setTucked = (tucked: boolean) => {
    if (desiredTucked.current === tucked) return;
    desiredTucked.current = tucked;
    void window.sticky.setTucked(tucked).then((updated) => { desiredTucked.current = updated.tucked; setNote(updated); });
  };
  const reveal = () => {
    window.clearTimeout(leaveTimer.current);
    if (desiredTucked.current !== false) {
      setRevealing(true);
      window.setTimeout(() => setRevealing(false), 230);
      setTucked(false);
    }
  };
  const tuckLater = () => {
    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => {
      if (!dragging && !menuOpen && document.activeElement !== editor.current) setTucked(true);
    }, 850);
  };
  const beginDrag = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('textarea,button,input,.sticky__tools')) return;
    event.currentTarget.setPointerCapture(event.pointerId); dragY.current = event.screenY; setDragging(true);
  };
  const flushDrag = () => {
    if (dragInFlight.current || !queuedDragDelta.current) return;
    const delta = queuedDragDelta.current;
    queuedDragDelta.current = 0;
    dragInFlight.current = true;
    void window.sticky.moveBy(delta)
      .then(setNote)
      .finally(() => { dragInFlight.current = false; flushDrag(); });
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = event.screenY - dragY.current;
    if (!delta) return;
    dragY.current = event.screenY;
    queuedDragDelta.current += delta;
    flushDrag();
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return; event.currentTarget.releasePointerCapture(event.pointerId); setDragging(false); tuckLater();
  };
  const changeItems = (items: ChecklistItem[]) => update(window.sticky.saveChecklist(items));

  return <main className={`sticky sticky--${note.color} ${dragging ? 'sticky--dragging' : ''} ${revealing ? 'sticky--revealing' : ''}`} onPointerEnter={reveal} onPointerLeave={tuckLater}>
    <div className={`sticky__paper ${note.type === 'checklist' ? 'sticky__paper--checklist' : ''}`} onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag}>
      <button className="sticky__menu" aria-label="Note options" onClick={() => setMenuOpen(!menuOpen)}>•••</button>
      {menuOpen && <div className="sticky__tools" onPointerEnter={reveal}>
        <div className="sticky__colors">{stickyColors.map((color) => <button key={color} className={`dot dot--${color}`} aria-label={`${color} note`} onClick={() => { update(window.sticky.setColor(color)); setMenuOpen(false); }} />)}</div>
        <button onClick={() => { update(window.sticky.setType(note.type === 'text' ? 'checklist' : 'text')); setMenuOpen(false); }}>{note.type === 'text' ? 'Make checklist' : 'Plain note'}</button>
        <button className="danger" onClick={() => void window.sticky.deleteNote()}>Delete note</button>
      </div>}
      <div className="sticky__pin" aria-hidden="true" />
      {note.type === 'text' ? <textarea ref={editor} spellCheck={false} aria-label="Sticky note" value={note.content} maxLength={400} placeholder="Write a reminder…" onFocus={reveal} onBlur={(event) => { update(window.sticky.saveContent(event.target.value)); tuckLater(); }} onChange={(event) => setNote({ ...note, content: event.target.value })} /> : <>
        <textarea ref={editor} spellCheck={false} className="sticky__title" aria-label="Checklist title" value={note.content} maxLength={100} placeholder="Checklist" onFocus={reveal} onBlur={(event) => update(window.sticky.saveContent(event.target.value))} onChange={(event) => setNote({ ...note, content: event.target.value })} />
        <div className="checklist">{note.checklist.map((item) => <label key={item.id}><input type="checkbox" checked={item.checked} onChange={() => changeItems(note.checklist.map((candidate) => candidate.id === item.id ? { ...candidate, checked: !candidate.checked } : candidate))} /><input spellCheck={false} className="checklist__text" value={item.text} aria-label="Checklist item" onChange={(event) => setNote({ ...note, checklist: note.checklist.map((candidate) => candidate.id === item.id ? { ...candidate, text: event.target.value } : candidate) })} onBlur={() => changeItems(note.checklist)} /><button className="checklist__delete" aria-label={`Delete ${item.text || 'checklist item'}`} title="Delete item" onClick={() => changeItems(note.checklist.filter((candidate) => candidate.id !== item.id))}>×</button></label>)}</div>
        {note.checklist.length < 8 && <button className="add-item" onClick={() => changeItems([...note.checklist, { id: id(), text: '', checked: false }])}>+ Add item</button>}
      </>}
      <span className="sticky__hint">drag to move</span><div className="sticky__fold" aria-hidden="true" />
    </div>
  </main>;
}
