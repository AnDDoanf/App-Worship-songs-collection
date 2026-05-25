import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiExternalLink, FiXCircle } from 'react-icons/fi';

function normalizeAudioValue(audio) {
  return typeof audio === 'string' ? audio.trim() : '';
}

function hasAudioSource(audio) {
  const trimmed = normalizeAudioValue(audio);
  return Boolean(trimmed && trimmed !== 'Không rõ' && trimmed !== 'KhÃ´ng rÃµ');
}

function getYouTubeVideoId(audio) {
  const trimmed = normalizeAudioValue(audio);

  if (!trimmed) {
    return '';
  }

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.replace(/^www\./i, '').toLowerCase();

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v') || '';
      }

      const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/i);
      if (shortsMatch) {
        return shortsMatch[1];
      }

      const embedMatch = url.pathname.match(/^\/embed\/([^/?#]+)/i);
      if (embedMatch) {
        return embedMatch[1];
      }
    }

    if (hostname === 'youtu.be') {
      return url.pathname.replace(/^\//, '').split('/')[0];
    }

    return '';
  } catch (_error) {
    return '';
  }
}

function YouTubePopup({ embedUrl, sourceUrl, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div className="popup" onClick={onClose}>
      <div className="popup-youtube" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="popup-close-button popup-close-button-themed"
          onClick={onClose}
          aria-label="Close YouTube player"
        >
          <FiXCircle />
        </button>
        <div className="popup-youtube-frame">
          <iframe
            src={embedUrl}
            title="YouTube audio player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
        <a
          className="button-mode popup-youtube-link"
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span>Open on YouTube</span>
          <FiExternalLink aria-hidden="true" />
        </a>
      </div>
    </div>,
    document.body
  );
}

function AudioPlayer(props) {
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isYoutubePopupOpen, setIsYoutubePopupOpen] = useState(false);
  const normalizedAudio = normalizeAudioValue(props.audio);
  const hasAudio = hasAudioSource(normalizedAudio);
  const youtubeVideoId = useMemo(() => getYouTubeVideoId(normalizedAudio), [normalizedAudio]);
  const youtubeEmbedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`
    : '';

  if (!hasAudio) {
    return (
      <div className="audio-player">
        <button type="button" className="button-mode audio-button" disabled>
          Chưa có âm thanh
        </button>
      </div>
    );
  }

  if (youtubeVideoId) {
    return (
      <>
        <div className="audio-player">
          <button
            type="button"
            className="button-mode audio-button"
            onClick={() => setIsYoutubePopupOpen(true)}
          >
            YouTube
          </button>
        </div>
        {isYoutubePopupOpen ? (
          <YouTubePopup
            embedUrl={youtubeEmbedUrl}
            sourceUrl={normalizedAudio}
            onClose={() => setIsYoutubePopupOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="audio-player">
      {!audioLoaded ? (
        <button type="button" className="button-mode audio-button" onClick={() => setAudioLoaded(true)}>
          Âm thanh
        </button>
      ) : (
        <audio className="audio-control" src={normalizedAudio} controls autoPlay={false} preload="none" />
      )}
    </div>
  );
}

export default AudioPlayer;
