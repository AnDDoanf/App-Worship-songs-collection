import { useEffect, useState } from 'react';

function useToast(duration = 2200) {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [duration, toastMessage]);

  return {
    toastMessage,
    showToast: setToastMessage,
    clearToast: () => setToastMessage(''),
  };
}

export default useToast;
