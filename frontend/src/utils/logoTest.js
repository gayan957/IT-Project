// Logo Test Utility
// This file helps verify that the logo is properly loaded and can be used in PDF generation

import logoPng from '../assets/images/logos/trash2cash_logo.png';

export const testLogo = () => {
  console.log('Testing logo import...');
  console.log('Logo path:', logoPng);
  
  // Create a test image element to verify the logo loads
  const img = new Image();
  img.onload = () => {
    console.log('✅ Logo loaded successfully!');
    console.log('Logo dimensions:', img.width, 'x', img.height);
  };
  img.onerror = (error) => {
    console.error('❌ Logo failed to load:', error);
  };
  img.src = logoPng;
  
  return logoPng;
};

export const getLogoInfo = () => {
  return {
    path: logoPng,
    isDataUrl: logoPng.startsWith('data:'),
    format: logoPng.includes('png') ? 'PNG' : 'Unknown',
    size: logoPng.length
  };
};

console.log('Logo info:', getLogoInfo());