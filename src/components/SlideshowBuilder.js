import { useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiFileText,
  FiFolderPlus,
  FiList,
  FiSave,
  FiTrash2,
  FiXCircle,
} from 'react-icons/fi';

function ActionButton({ onClick, disabled, label, icon, variant = 'default' }) {
  return (
    <button
      type="button"
      className={`button-mode slideshow-action-button slideshow-action-button-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="slideshow-action-label">{label}</span>
      <span className="slideshow-action-icon" aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}

function SlideshowBuilder({
  selectedListName,
  listNameInput,
  availableLists,
  draftValue,
  onDraftChange,
  onSelectList,
  onListNameChange,
  onCreateList,
  onSaveList,
  onBuildQueue,
  queueSongs,
  onOpenSlideshow,
  onOpenLyricsQueue,
  onClearQueue,
  onDeleteList,
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const queueLabel = useMemo(() => {
    if (queueSongs.length === 0) {
      return 'Chưa có bài trong danh sách';
    }

    return queueSongs.map((song) => song.id).join(', ');
  }, [queueSongs]);

  const handleSave = () => {
    const buildResult = onBuildQueue(draftValue);

    if (buildResult.error) {
      setErrorMessage(buildResult.error);
      setIsExpanded(true);
      return;
    }

    const saveResult = onSaveList();

    if (saveResult.error) {
      setErrorMessage(saveResult.error);
      setIsExpanded(true);
      return;
    }

    setErrorMessage('');
  };

  const handleCreate = () => {
    const createResult = onCreateList();

    if (createResult.error) {
      setErrorMessage(createResult.error);
      setIsExpanded(true);
      return;
    }

    setErrorMessage('');
  };

  return (
    <section className={`slideshow-builder ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button
        type="button"
        className="slideshow-builder-toggle"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        aria-expanded={isExpanded}
      >
        <div className="slideshow-builder-copy">
          <h2>Danh sách trình chiếu bản nhạc</h2>
          <p>{queueLabel}</p>
        </div>
        <FiChevronDown className={`slideshow-builder-chevron ${isExpanded ? 'open' : ''}`} />
      </button>

      {isExpanded ? (
        <>
          <div className="slideshow-builder-controls">
            <div className="slideshow-list-row">
              <select
                className="dropdown slideshow-list-select"
                value={selectedListName}
                onChange={(event) => onSelectList(event.target.value)}
              >
                {availableLists.map((listName) => (
                  <option key={listName} value={listName}>
                    {listName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="slideshow-input slideshow-name-input"
                value={listNameInput}
                onChange={(event) => onListNameChange(event.target.value)}
                placeholder="Chương trình Chúa nhật"
              />
            </div>
            <input
              type="text"
              className="slideshow-input"
              value={draftValue}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="T12, H122, TCX001"
            />
            <div className="slideshow-action-group">
              <p className="slideshow-action-heading">Xem nhanh</p>
              <div className="slideshow-primary-actions">
                <ActionButton
                  onClick={onOpenSlideshow}
                  disabled={queueSongs.length === 0}
                  label="Mở bản nhạc"
                  icon={<FiFileText />}
                  variant="primary"
                />
                <ActionButton
                  onClick={onOpenLyricsQueue}
                  disabled={queueSongs.length === 0}
                  label="Mở lời"
                  icon={<FiList />}
                  variant="primary"
                />
              </div>
            </div>
            <div className="slideshow-action-group">
              <p className="slideshow-action-heading">Quản lý danh sách</p>
              <div className="slideshow-secondary-actions">
                <ActionButton onClick={handleCreate} label="Tạo danh sách" icon={<FiFolderPlus />} variant="secondary" />
                <ActionButton onClick={handleSave} label="Lưu danh sách" icon={<FiSave />} variant="secondary" />
                <ActionButton
                  onClick={onClearQueue}
                  disabled={queueSongs.length === 0 && !draftValue}
                  label="Xóa bài hát"
                  icon={<FiXCircle />}
                  variant="secondary"
                />
                <ActionButton
                  onClick={onDeleteList}
                  disabled={availableLists.length <= 1}
                  label="Xóa danh sách"
                  icon={<FiTrash2 />}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
          {errorMessage ? <p className="slideshow-error">{errorMessage}</p> : null}
        </>
      ) : null}
    </section>
  );
}

export default SlideshowBuilder;
