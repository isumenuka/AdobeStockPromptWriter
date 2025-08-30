/**
 * Returns a random element from an array
 * @param array - The array to select from
 * @returns A random element from the array
 */
export const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Returns multiple unique random elements from an array
 * @param array - The array to select from
 * @param count - Number of elements to return
 * @returns Array of unique random elements
 */
export const getRandomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, array.length));
};