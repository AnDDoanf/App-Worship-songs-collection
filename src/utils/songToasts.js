export function notifyToast(notify, type, message, options) {
  const show = notify?.[type] || notify;
  show?.(message, options);
}

export function songAddedToastOptions(undo) {
  return {
    duration: 3000,
    actionButtonStyle: {
      background: 'var(--success-text)',
      color: 'var(--success-bg)',
    },
    ...(undo ? { action: { label: 'Hoàn tác', onClick: undo } } : {}),
  };
}
