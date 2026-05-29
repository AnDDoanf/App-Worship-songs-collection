import React, { useEffect, useState } from 'react';
import { FiArrowUp } from 'react-icons/fi';

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop;
      setVisible(scrolled > 300);
    };

    window.addEventListener('scroll', toggleVisible);
    toggleVisible();

    return () => {
      window.removeEventListener('scroll', toggleVisible);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      className={`scroll-to-top ${visible ? 'is-visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Lên đầu trang"
    >
      <FiArrowUp />
    </button>
  );
};

export default ScrollToTop;
