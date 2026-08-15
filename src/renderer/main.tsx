import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StickyNote } from './sticky-note';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StickyNote />
  </StrictMode>
);
