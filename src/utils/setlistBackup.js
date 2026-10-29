import { normalizeStoredState } from '../store/slideshowStore';

export function serializeSetlists(state) {
  return JSON.stringify({ format: 'worship-setlists', version: 1, state: normalizeStoredState(state) }, null, 2);
}

export function parseSetlistBackup(text) {
  const data = JSON.parse(text);
  if (data.format !== 'worship-setlists' || data.version !== 1 || !data.state?.lists || Array.isArray(data.state.lists)) {
    throw new Error('File không phải bản sao lưu bộ bài hát được hỗ trợ.');
  }
  const entries = Object.entries(data.state.lists);
  if (!entries.length || entries.some(([name, list]) => !name.trim() || ['__proto__', 'constructor', 'prototype'].includes(name) ||
    !list || !Array.isArray(list.ids) || list.ids.some((id) => typeof id !== 'string' || !/^[a-z]+\d+[a-z0-9]*$/i.test(id)))) {
    throw new Error('Bản sao lưu có tên bộ hoặc mã bài hát không hợp lệ.');
  }
  return normalizeStoredState(data.state);
}

export function mergeSetlistBackup(current, imported) {
  const lists = { ...current.lists };
  let activeListName = current.activeListName;
  for (const [name, list] of Object.entries(imported.lists)) {
    let target = name;
    let number = 2;
    while (Object.prototype.hasOwnProperty.call(lists, target)) target = `${name} (${number++})`;
    lists[target] = list;
    activeListName = target;
  }
  return { ...current, lists, activeListName };
}

export function downloadSetlists(state) {
  const url = URL.createObjectURL(new Blob([serializeSetlists(state)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'thanh-ca-bo-bai-hat.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
