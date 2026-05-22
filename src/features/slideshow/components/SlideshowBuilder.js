import { useMemo, useState } from 'react';
import { FiChevronDown, FiFileText, FiList, FiPlus } from 'react-icons/fi';
import useToast from '../../../hooks/useToast';
import SlideshowListEditorModal from './SlideshowListEditorModal';

function QuickActionButton({ onClick, label, icon }) {
  return (
    <button
      type="button"
      className="button-mode slideshow-list-action-button"
      onClick={onClick}
    >
      <span className="slideshow-list-action-label">{label}</span>
      <span className="slideshow-list-action-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

function SlideshowBuilder({
  lists,
  newestListName,
  onCreateList,
  onUpdateList,
  onDeleteList,
  onOpenSlideshow,
  onOpenLyricsQueue,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editorState, setEditorState] = useState({
    isOpen: false,
    mode: 'create',
    originalName: '',
    name: '',
    draft: '',
  });
  const { toastMessage, showToast } = useToast();

  const visibleLists = useMemo(() => {
    if (isExpanded) {
      return lists;
    }

    const newestList = lists.find((list) => list.name === newestListName);
    return newestList ? [newestList] : lists.slice(-1);
  }, [isExpanded, lists, newestListName]);

  const queueSummary = useMemo(() => {
    if (lists.length === 0) {
      return 'Chưa có danh sách';
    }

    const newestList =
      lists.find((list) => list.name === newestListName) || lists[lists.length - 1];

    return newestList?.codesLabel || 'Chưa có bài trong danh sách';
  }, [lists, newestListName]);

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
      mode: 'edit',
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
      showToast(`Danh sách "${list.name}" chưa có bài để mở bản nhạc`);
      return;
    }

    onOpenSlideshow(list.name);
  };

  const handleOpenLyrics = (list) => {
    if (list.songs.length === 0) {
      showToast(`Danh sách "${list.name}" chưa có bài để mở lời`);
      return;
    }

    onOpenLyricsQueue(list.name);
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
              <h2>Thư mục bản nhạc</h2>
            </div>
            <FiChevronDown className={`slideshow-builder-chevron ${isExpanded ? 'open' : ''}`} />
          </button>
          <button
            type="button"
            className="button-mode slideshow-create-button"
            onClick={openCreateModal}
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
              </button>
              <div className="slideshow-list-actions">
                <QuickActionButton
                  onClick={() => handleOpenSheet(list)}
                  label="Mở bản nhạc"
                  icon={<FiFileText />}
                />
                <QuickActionButton
                  onClick={() => handleOpenLyrics(list)}
                  label="Mở lời"
                  icon={<FiList />}
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
        setTrigger={closeEditor}
        onCreateList={onCreateList}
        onUpdateList={onUpdateList}
        onDeleteList={onDeleteList}
        onNotify={showToast}
      />

      <div className={`song-action-toast ${toastMessage ? 'visible' : ''}`} aria-live="polite">
        {toastMessage}
      </div>
    </>
  );
}

export default SlideshowBuilder;
