/**
 * Detects if a string contains Khmer characters
 * Khmer Unicode range: U+1780 to U+17FF
 */
export const containsKhmer = (text: string): boolean => {
  const khmerRegex = /[\u1780-\u17FF]/;
  return khmerRegex.test(text);
};

/**
 * Returns appropriate className based on text content
 */
export const getTextClassName = (text: string, baseClass?: string): string => {
  const classes = [baseClass].filter(Boolean);
  
  if (containsKhmer(text)) {
    classes.push('khmer-text');
  }
  
  return classes.join(' ');
};