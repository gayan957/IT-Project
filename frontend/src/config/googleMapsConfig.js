// Shared Google Maps API configuration
// This ensures all components use the same libraries array in the same order
// to prevent "Loader must not be called again with different options" error

export const GOOGLE_MAPS_LIBRARIES = ["places", "geometry"];

export const GOOGLE_MAPS_CONFIG = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  libraries: GOOGLE_MAPS_LIBRARIES,
};
