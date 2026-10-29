import { copyTextToClipboard } from './clipboard';

test('uses the async clipboard API when available', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  await copyTextToClipboard('song text');
  expect(writeText).toHaveBeenCalledWith('song text');
});

test('copies through a temporary textarea when the clipboard API is unavailable', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
  const previousExecCommand = document.execCommand;
  const execCommand = jest.fn(() => true);
  document.execCommand = execCommand;
  await copyTextToClipboard('fallback text');
  expect(execCommand).toHaveBeenCalledWith('copy');
  expect(document.querySelector('textarea')).toBeNull();
  if (previousExecCommand) document.execCommand = previousExecCommand;
  else delete document.execCommand;
});
