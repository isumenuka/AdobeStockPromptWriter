/**
 * Copies the given text to clipboard using the Clipboard API
 * @param text - The text to copy
 * @returns Promise<boolean> - Resolves to true if copying was successful
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};