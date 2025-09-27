// Assets Index - Centralized export for all assets
// This file provides a single point of import for all assets

// Logos
export { default as Trash2CashLogo } from './images/logos/trash2cash_logo.png';
export { default as Trash2CashLogoSVG } from './images/logos/trash2cash-logo.svg';

// Logo configurations
export const LogoConfig = {
  sizes: {
    small: 'h-6 w-6',
    medium: 'h-8 w-8', 
    large: 'h-12 w-12',     // Currently used in header
    xlarge: 'h-16 w-16',
    xxlarge: 'h-20 w-20'
  },
  colors: {
    primary: '#72BF44',
    white: '#FFFFFF'
  }
};