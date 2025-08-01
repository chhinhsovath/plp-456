// Khmer font configuration for PDF export
// This file registers Khmer fonts for use in jsPDF

export function registerKhmerFont(jsPDF: any) {
  // Add Khmer OS font
  const khmerOSFont = `
    AAEAAAALAIAAAwAwT1MvMg8SBf...
  `; // Font data would be base64 encoded here

  // Register the font
  jsPDF.API.events.push(['addFonts', function() {
    this.addFileToVFS('KhmerOS.ttf', khmerOSFont);
    this.addFont('KhmerOS.ttf', 'KhmerOS', 'normal');
  }]);
}

// Alternative: Load font from CDN
export function loadKhmerFontFromCDN() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;600;700&display=swap';
  document.head.appendChild(link);
}

// Font configuration for different contexts
export const khmerFontConfig = {
  pdf: {
    fontFamily: 'KhmerOS',
    fontSize: 12,
    lineHeight: 1.6,
  },
  web: {
    fontFamily: "'Noto Sans Khmer', 'Khmer OS', sans-serif",
    fontSize: '14px',
    lineHeight: 1.5,
  },
  print: {
    fontFamily: 'Khmer OS, Arial Unicode MS',
    fontSize: '11pt',
    lineHeight: 1.4,
  },
};