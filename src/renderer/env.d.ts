import type { StickyApi } from '../main/types';

declare global {
  interface Window {
    sticky: StickyApi;
  }
}

export {};
