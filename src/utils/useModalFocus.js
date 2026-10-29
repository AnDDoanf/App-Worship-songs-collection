import { useEffect } from 'react';

export function useModalFocus(ref, open) {
  useEffect(() => {
    const modal = ref.current;
    if (!open || !modal) return undefined;
    const previous = document.activeElement;
    modal.focus();
    const keydown = (event) => {
      if (event.key !== 'Tab') return;
      const elements = [...modal.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href]')]
        .filter((element) => !element.closest('[hidden], [inert], [aria-hidden="true"]'));
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modal)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    modal.addEventListener('keydown', keydown);
    return () => { modal.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus(); };
  }, [open, ref]);
}
