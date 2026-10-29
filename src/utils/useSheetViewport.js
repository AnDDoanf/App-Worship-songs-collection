import { useLayoutEffect } from 'react';

// Fit browser chrome at normal scale, but keep the sheet's dimensions stable
// during native pinch zoom so the browser can magnify and pan the page.
export function useSheetViewport(overlayRef, isOpen) {
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!isOpen || !overlay) return undefined;

    const viewport = window.visualViewport;
    const update = () => {
      if (viewport && viewport.scale > 1) return;

      overlay.style.setProperty('--sheet-viewport-height', `${viewport?.height ?? window.innerHeight}px`);
      overlay.style.setProperty('--sheet-viewport-width', `${viewport?.width ?? window.innerWidth}px`);
      overlay.style.setProperty('--sheet-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      overlay.style.setProperty('--sheet-viewport-left', `${viewport?.offsetLeft ?? 0}px`);
    };

    update();
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
    };
  }, [overlayRef, isOpen]);
}
