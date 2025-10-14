import { GoogleMap, Marker, useJsApiLoader, InfoWindow, Autocomplete } from "@react-google-maps/api";
import { useEffect, useRef, useState, useCallback } from "react";
import { GOOGLE_MAPS_LIBRARIES } from "../config/googleMapsConfig";

const SL_CENTER = { lat: 7.8731, lng: 80.7718 };
const SL_BOUNDS = { north: 10.1, south: 5.7, west: 79.4, east: 82.1 };

/** Enhanced Sri Lanka boundary polygon that includes Colombo and major cities */
const SL_INNER_PATH = [
  { lat: 9.83, lng: 80.15 }, // Jaffna area
  { lat: 9.65, lng: 80.02 }, 
  { lat: 9.15, lng: 79.85 }, // Extended west to include Colombo area
  { lat: 8.95, lng: 79.80 }, // Further west
  { lat: 8.65, lng: 79.75 }, // Include western coast
  { lat: 8.35, lng: 79.75 },
  { lat: 8.10, lng: 79.78 },
  { lat: 7.85, lng: 79.80 },
  { lat: 7.55, lng: 79.82 },
  { lat: 7.25, lng: 79.84 }, // Include Colombo area
  { lat: 7.05, lng: 79.85 },
  { lat: 6.92, lng: 79.86 }, // Colombo city center
  { lat: 6.82, lng: 79.88 },
  { lat: 6.62, lng: 79.92 },
  { lat: 6.44, lng: 80.05 },
  { lat: 6.30, lng: 80.12 },
  { lat: 6.20, lng: 80.25 },
  { lat: 6.13, lng: 80.45 },
  { lat: 6.08, lng: 80.68 }, // Southern tip
  { lat: 6.11, lng: 80.88 },
  { lat: 6.13, lng: 81.08 },
  { lat: 6.22, lng: 81.28 },
  { lat: 6.34, lng: 81.46 },
  { lat: 6.55, lng: 81.69 }, // Eastern coast
  { lat: 6.85, lng: 81.83 },
  { lat: 7.10, lng: 81.89 },
  { lat: 7.35, lng: 81.94 },
  { lat: 7.65, lng: 81.98 },
  { lat: 8.00, lng: 81.96 },
  { lat: 8.30, lng: 81.88 },
  { lat: 8.60, lng: 81.72 },
  { lat: 8.85, lng: 81.52 },
  { lat: 9.05, lng: 81.24 },
  { lat: 9.22, lng: 81.01 },
  { lat: 9.38, lng: 80.74 },
  { lat: 9.45, lng: 80.46 },
  { lat: 9.50, lng: 80.25 },
];

/** Beautiful modern map style */
const BEAUTIFUL_MAP_STYLE = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "all",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }]
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5f5e5" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4caf50" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }]
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }]
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }]
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }]
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9e9ff" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#1976d2" }]
  }
];

export default function ImprovedMapPicker({ 
  value, 
  onChange, 
  height = "400px",
  showInfoWindow = true,
  markerTitle = "Selected Location",
  className = ""
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const initial = value ?? SL_CENTER;
  const [position, setPosition] = useState(initial);
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [autocomplete, setAutocomplete] = useState(null);
  const lastGoodPosition = useRef(initial);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sync position when value changes from parent
  useEffect(() => {
    if (value && (value.lat !== position.lat || value.lng !== position.lng)) {
      setPosition(value);
      lastGoodPosition.current = value;
    }
  }, [value, position.lat, position.lng]);

  // Validate if position is within Sri Lanka bounds
  const validatePosition = useCallback(async (pos) => {
    if (!window.google?.maps?.geometry) return true;

    setIsValidating(true);
    try {
      const polygon = new window.google.maps.Polygon({ paths: SL_INNER_PATH });
      const isInside = window.google.maps.geometry.poly.containsLocation(
        new window.google.maps.LatLng(pos.lat, pos.lng),
        polygon
      );
      
      setIsValidating(false);
      return isInside;
    } catch (err) {
      console.warn("Position validation failed:", err);
      setIsValidating(false);
      return true; // If validation fails, allow the position
    }
  }, []);

    // Handle map click events
  const handleMapClick = useCallback(async (event) => {
    const newPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    
    const isValid = await validatePosition(newPos);
    if (isValid) {
      setPosition(newPos);
      lastGoodPosition.current = newPos;
      onChange?.(newPos);
      setError("");
      setShowInfo(false);
    } else {
      setError("Please select a location within Sri Lanka");
      setPosition(lastGoodPosition.current);
    }
  }, [validatePosition, onChange]);

  // Handle autocomplete load
  const onAutocompleteLoad = useCallback((autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  // Handle place selection from search
  const onPlaceChanged = useCallback(async () => {
    if (autocomplete !== null) {
      setSearchLoading(true);
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        const isValid = await validatePosition(newPos);
        if (isValid) {
          setPosition(newPos);
          lastGoodPosition.current = newPos;
          onChange?.(newPos);
          setError("");
          
          // Center map on the new location
          if (mapRef.current) {
            mapRef.current.panTo(newPos);
            mapRef.current.setZoom(15);
          }
        } else {
          setError("Selected location is outside Sri Lanka");
          if (searchInputRef.current) {
            searchInputRef.current.value = "";
          }
        }
      } else {
        setError("Please select a valid location from the suggestions");
        if (searchInputRef.current) {
          searchInputRef.current.value = "";
        }
      }
      setSearchLoading(false);
    }
  }, [autocomplete, validatePosition, onChange]);

  // Clear search
  const clearSearch = useCallback(() => {
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setShowInstructions(true);
  }, []);

  // Handle marker drag events
  const handleMarkerDragEnd = useCallback(async (event) => {
    const newPos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    
    const isValid = await validatePosition(newPos);
    if (isValid) {
      setPosition(newPos);
      lastGoodPosition.current = newPos;
      onChange?.(newPos);
      setError("");
    } else {
      setError("Please keep the marker within Sri Lanka");
      // Snap back to last good position
      setPosition(lastGoodPosition.current);
      setTimeout(() => setError(""), 2000);
    }
  }, [onChange, validatePosition]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium">Map failed to load</p>
          <p className="text-sm">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading beautiful map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg border border-gray-200 ${className}`}>
      {/* Search Bar */}
            {/* Search Bar - Modern Design */}
      <div className="absolute top-4 right-4 z-10">
        <div className="w-80">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center">
                {/* Search Icon */}
                <div className="flex items-center justify-center w-12 h-12 text-emerald-600">
                  {searchLoading ? (
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  )}
                </div>
                
                {/* Search Input */}
                <Autocomplete
                  onLoad={onAutocompleteLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    componentRestrictions: { country: 'lk' },
                    fields: ['geometry', 'name', 'formatted_address', 'place_id'],
                    types: ['geocode', 'establishment']
                  }}
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search places..."
                    className="flex-1 h-12 px-3 py-0 text-gray-900 placeholder-gray-500 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium transition-all duration-300 focus:placeholder-gray-400"
                    onFocus={() => setShowInstructions(false)}
                    onBlur={() => !searchInputRef.current?.value && setShowInstructions(true)}
                  />
                </Autocomplete>
                
                {/* Clear Button */}
                {searchInputRef.current?.value && (
                  <button
                    onClick={clearSearch}
                    className="flex items-center justify-center w-8 h-8 mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Search Results Hint */}
              <div className="px-3 pb-2">
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Search any place in Sri Lanka
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height }}
        center={position}
        zoom={8}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        options={{
          restriction: { latLngBounds: SL_BOUNDS, strictBounds: true },
          minZoom: 7,
          maxZoom: 19,
          styles: BEAUTIFUL_MAP_STYLE,
          zoomControl: true,
          streetViewControl: true,
          mapTypeControl: true,
          fullscreenControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
          disableDefaultUI: false,
          backgroundColor: "#f5f5f5",
        }}
      >
        {/* Custom Marker */}
        <Marker
          position={position}
          draggable
          onDragEnd={handleMarkerDragEnd}
          onClick={() => setShowInfo(true)}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE || 0,
            scale: 16,
            fillColor: "#10b981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
            anchor: new window.google.maps.Point(0, 0),
          }}
          animation={isValidating ? window.google?.maps?.Animation?.BOUNCE : null}
        />

        {/* Info Window */}
        {showInfo && showInfoWindow && (
          <InfoWindow
            position={position}
            onCloseClick={() => setShowInfo(false)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-2">{markerTitle}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Latitude:</strong> {position.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> {position.lng.toFixed(6)}</p>
              </div>
              <div className="mt-2 text-xs text-green-600">
                ✓ Location within Sri Lanka
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm px-4 py-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isValidating ? (
              <>
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-yellow-700 font-medium">Validating...</span>
              </>
            ) : error ? (
              <>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600 font-medium">{error}</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 font-medium">Valid location</span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Instructions Overlay - Only show when not searching */}
      {showInstructions && (
        <div className="absolute top-20 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md transition-opacity duration-300">
          <p className="text-sm text-gray-700 font-medium">
            📍 Click, drag, or search to select location
          </p>
        </div>
      )}
    </div>
  );
}
