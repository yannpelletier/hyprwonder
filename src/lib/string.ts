export const ellipsisText = (text: string, maxSize: number) => {
  if (text.length > maxSize) {
    return `${text.substring(0, maxSize)}...`;
  }
  return text;
}

export const capLines = (text: string, maxLines: number) => {
  const lines = text.split('\n');
  if (lines.length <= maxLines) {
    return text;
  }

  return lines.slice(0, maxLines).join('\n');
};

export const fuzzySearch = (query: string, text: string) => {
  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Create fuzzy pattern: allow any characters between letters
  const pattern = escapedQuery.split('').join('.*');
  const regex = new RegExp(pattern, 'i'); // Case-insensitive
  return regex.test(text);
}

export const fileNameToDisplay = (fileName: string) => {
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    return '';
  }
  // Remove file extension
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '');
  // Replace hyphens and underscores with spaces, split into words
  const words = nameWithoutExtension.replace(/[-_]/g, ' ').trim().split(/\s+/);
  // Capitalize every word
  const capitalizedWords = words.map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
  // Join words with single spaces
  return capitalizedWords.join(' ');
};

// Convert display string to file name
export const displayToFileName = (displayString: string) => {
  if (typeof displayString !== 'string' || displayString.trim() === '') {
    return '';
  }
  // Convert to lowercase and replace multiple spaces with a single hyphen
  return displayString
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}
