import { useRef, useState } from 'react';
import { FiChevronDown, FiDownload, FiFileText, FiList, FiMonitor, FiPlus, FiShare2, FiUpload } from 'react-icons/fi';
import { toast } from 'sonner';
import { copyTextToClipboard } from '../../../utils/clipboard';
import { buildShareUrl } from '../../../utils/shareLinks';
import SlideshowListEditorModal from './SlideshowListEditorModal';
import ActionIconButton from '../../../components/common/ActionIconButton';

function QuickActionButton({ onClick, label, icon }) {
  return <ActionIconButton label={label} icon={icon} onClick={onClick} />;
}

function SlideshowBuilder({
  lists,
  newestListName,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onOpenSlideshow,
  onOpenLyricsQueue,
  songLibrary = [],
  onDuplicateList,
  onExportLists,
  onImportLists,
  onOpenLyricsProjection,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const importRef = useRef(null);
  const [editorState, setEditorState] = useState({
    isOpen: false,
    mode: 'create',
    originalName: '',
    name: '',
    draft: '',
  });

  const newestList = lists.find((list) => list.name === newestListName);
  let visibleLists = lists;
  if (!isExpanded) {
    visibleLists = newestList ? [newestList] : lists.slice(-1);
  }

  const openCreateModal = () => {
    setEditorState({
      isOpen: true,
      mode: 'create',
      originalName: '',
      name: '',
      draft: '',
    });
  };

  const openEditModal = (list) => {
    setEditorState({
      isOpen: true,
      mode: 'view',
      originalName: list.name,
      name: list.name,
      draft: list.draft,
    });
  };

  const closeEditor = () => {
    setEditorState((currentState) => ({
      ...currentState,
      isOpen: false,
    }));
  };

  const handleOpenSheet = (list) => {
    if (list.songs.length === 0) {
      toast.warning(`Danh s\u00e1ch "${list.name}" ch\u01b0a c\u00f3 b\u00e0i \u0111\u1ec3 m\u1edf b\u1ea3n nh\u1ea1c`);
      return;
    }

    onOpenSlideshow(list.name);
  };

  const handleOpenLyrics = (list) => {
    if (list.songs.length === 0) {
      toast.warning(`Danh s\u00e1ch "${list.name}" ch\u01b0a c\u00f3 b\u00e0i \u0111\u1ec3 m\u1edf l\u1eddi`);
      return;
    }

    onOpenLyricsQueue(list.name);
  };

  const handleShare = async (list) => {
    if (list.ids.length === 0) {
      toast.warning(`Danh s\u00e1ch "${list.name}" ch\u01b0a c\u00f3 b\u00e0i \u0111\u1ec3 chia s\u1ebb`);
      return;
    }

    try {
      await copyTextToClipboard(
        buildShareUrl({
          name: list.name,
          ids: list.ids,
          chordPreferences: list.chordPreferences,
        })
      );
      toast.success(`\u0110\u00e3 sao ch\u00e9p li\u00ean k\u1ebft chia s\u1ebb cho "${list.name}"`);
    } catch (_error) {
      toast.error(`Kh\u00f4ng th\u1ec3 sao ch\u00e9p li\u00ean k\u1ebft chia s\u1ebb cho "${list.name}"`);
    }
  };

  return (
    <>
      <section className={`slideshow-builder ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="slideshow-builder-header">
          <button
            type="button"
            className="slideshow-builder-toggle"
            onClick={() => setIsExpanded((currentValue) => !currentValue)}
            aria-expanded={isExpanded}
          >
            <div className="slideshow-builder-copy">
              <h2>Bộ bài hát của tôi</h2>
            </div>
            <FiChevronDown className={`slideshow-builder-chevron ${isExpanded ? 'open' : ''}`} />
          </button>
          <div className="set-backup-actions">
            {onExportLists ? <button type="button" className="button-mode" onClick={onExportLists}><FiDownload aria-hidden="true" /> Sao lưu</button> : null}
            {onImportLists ? <button type="button" className="button-mode" onClick={() => importRef.current?.click()}><FiUpload aria-hidden="true" /> Khôi phục</button> : null}
            <input ref={importRef} type="file" accept=".json,application/json" hidden aria-label="Chọn bản sao lưu" onChange={async (event) => {
              const file = event.target.files?.[0]; event.target.value = '';
              if (!file) return;
              try {
                if (file.size > 5 * 1024 * 1024) throw new Error('File sao lưu quá lớn (tối đa 5 MB).');
                const count = onImportLists(await file.text()); toast.success(`Đã khôi phục ${count} bộ bài hát. Các bộ hiện có được giữ nguyên.`);
              } catch (error) { toast.error(error.message || 'Không thể đọc bản sao lưu.'); }
            }} />
          </div>
          <button
            type="button"
            className="button-mode slideshow-create-button"
            onClick={openCreateModal}
            aria-label="Tạo danh sách trình chiếu mới"
          >
            <FiPlus aria-hidden="true" />
            <span>Tạo mới</span>
          </button>
        </div>

        <div className="slideshow-list-grid">
          {visibleLists.map((list) => (
            <article key={list.name} className="slideshow-list-card">
              <button
                type="button"
                className="slideshow-list-summary"
                onClick={() => openEditModal(list)}
              >
                <div className="slideshow-list-title-row">
                  <h3>{list.name}</h3>
                  {list.isNewest ? <span className="slideshow-list-badge">Mới nhất</span> : null}
                </div>
                <p>{list.codesLabel}</p>
                <small>{[list.serviceDate, list.service, list.status === 'ready' ? 'Sẵn sàng' : 'Đang chuẩn bị'].filter(Boolean).join(' · ')}</small>
              </button>
              <div className="slideshow-list-actions">
                {onOpenLyricsProjection ? <QuickActionButton label="Chiếu lời" icon={<FiMonitor />} onClick={() => list.songs.length ? onOpenLyricsProjection(list.name) : toast.warning('Bộ chưa có bài hát.')} /> : null}
                <QuickActionButton
                  onClick={() => handleOpenSheet(list)}
                  label="Mở bản nhạc"
                  icon={<FiFileText />}
                />
                <QuickActionButton
                  onClick={() => handleOpenLyrics(list)}
                  label="Lời và hợp âm"
                  icon={<FiList />}
                />
                <QuickActionButton
                  onClick={() => handleShare(list)}
                  label="Chia sẻ"
                  icon={<FiShare2 />}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <SlideshowListEditorModal
        trigger={editorState.isOpen}
        mode={editorState.mode}
        originalName={editorState.originalName}
        initialName={editorState.name}
        initialDraft={editorState.draft}
        initialIds={lists.find((list) => list.name === editorState.originalName)?.ids || []}
        songs={songLibrary}
        listSongs={lists.find((list) => list.name === editorState.originalName)?.songs || []}
        initialDetails={lists.find((list) => list.name === editorState.originalName)}
        onDuplicateList={onDuplicateList}
        setTrigger={closeEditor}
        onCreateList={onCreateList}
        onUpdateList={onUpdateList}
        onDeleteList={onDeleteList}
        onNotify={toast}
      />
    </>
  );
}

export default SlideshowBuilder;
