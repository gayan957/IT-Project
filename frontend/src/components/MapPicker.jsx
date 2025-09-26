// src/components/MapPicker.jsx
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const SL_CENTER = { lat: 7.8731, lng: 80.7718 };

// Expanded rectangle: ~1.5–2° padding in every direction
// Covers whole island, Colombo, suburbs, and some buffer into the ocean
const SL_BOUNDS = {
  north: 11.0,   // was 10.1
  south: 4.5,    // was 5.7
  west: 78.5,    // was 79.4
  east: 83.5     // was 82.1
};


const CLEAN_MAP_STYLE = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ color: "#eaf5ff" }] },
  { featureType: "landscape", stylers: [{ color: "#f6fbf5" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ lightness: 10, saturation: -5 }] },
];

export default function MapPicker({ value, onChange, height = "360px" }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places", "geometry"], // Added geometry library
  });

  const initial = value ?? SL_CENTER;
  const [pos, setPos] = useState(initial);
  const lastGoodPos = useRef(initial);
  const [error, setError] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const autocompleteRef = useRef(null);
  const mapRef = useRef(null);
  const geocoder = useRef(null);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setPos(value);
      lastGoodPos.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (isLoaded && window.google) {
      geocoder.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  const withinBounds = (latLng) =>
    latLng.lat >= SL_BOUNDS.south &&
    latLng.lat <= SL_BOUNDS.north &&
    latLng.lng >= SL_BOUNDS.west &&
    latLng.lng <= SL_BOUNDS.east;

  // Function to check if location is on land using reverse geocoding
  const isLocationOnLand = async (latLng) => {
    if (!geocoder.current) return true; // Fallback to allow if geocoder not available
    
    try {
      const response = await new Promise((resolve, reject) => {
        geocoder.current.geocode(
          { location: latLng },
          (results, status) => {
            if (status === 'OK') resolve(results);
            else reject(status);
          }
        );
      });

      if (response && response.length > 0) {
        // Check if any result contains land-based location types
        const result = response[0];
        const addressComponents = result.address_components || [];
        const types = result.types || [];
        
        // If the result has formatted_address, it's likely on land
        // Ocean locations typically don't have detailed address information
        if (result.formatted_address) {
          // Additional check: make sure it's not just coordinates
          const hasRealAddress = addressComponents.some(component => 
            component.types.includes('locality') || 
            component.types.includes('administrative_area_level_1') ||
            component.types.includes('administrative_area_level_2') ||
            component.types.includes('sublocality') ||
            component.types.includes('route') ||
            component.types.includes('street_number')
          );
          
          // Check if it's specifically marked as a water body
          const isWaterBody = types.some(type => 
            type.includes('natural_feature') && 
            result.formatted_address.toLowerCase().includes('ocean')
          ) || result.formatted_address.toLowerCase().match(/\b(ocean|sea|water|bay)\b/);
          
          if (hasRealAddress && !isWaterBody) {
            return true;
          }
          
          // If it has an address but might be water, check the address content
          const addressText = result.formatted_address.toLowerCase();
          if (addressText.includes('sri lanka') || 
              addressText.includes('colombo') ||
              addressText.includes('galle') ||
              addressText.includes('kandy') ||
              addressText.includes('jaffna') ||
              addressText.match(/\d+/) || // Contains numbers (likely street address)
              hasRealAddress) {
            return true;
          }
        }
        
        // If no proper address found, it might be ocean
        return false;
      }
      
      // If no results, assume it's ocean
      return false;
    } catch (error) {
      console.warn('Geocoding failed:', error);
      // Fallback: if geocoding fails, allow the location
      return true;
    }
  };

  const commitIfValid = async (latLng) => {
    setError("");
    setIsValidating(true);
    
    try {
      if (!withinBounds(latLng)) {
        setError("Please select a location within Sri Lanka.");
        setPos(lastGoodPos.current);
        return;
      }

      // Check if location is on land
      const isOnLand = await isLocationOnLand(latLng);
      
      if (!isOnLand) {
        setError("Please select a location on land, not in the ocean.");
        setPos(lastGoodPos.current);
        return;
      }

      // If all checks pass, commit the location
      setPos(latLng);
      lastGoodPos.current = latLng;
      onChange?.(latLng);
    } catch (error) {
      console.error('Location validation error:', error);
      setError("Unable to validate location. Please try again.");
      setPos(lastGoodPos.current);
    } finally {
      setIsValidating(false);
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
  };

  const onPlaceChanged = async () => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (place?.geometry?.location) {
      const newPos = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      await commitIfValid(newPos);
      if (mapRef.current) {
        mapRef.current.panTo(newPos);
        mapRef.current.setZoom(15);
      }
    }
  };

  const handleClick = async (e) => {
    await commitIfValid({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };
  
  const handleDragEnd = async (e) => {
    await commitIfValid({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  };

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );

  return (
    <div className="relative">
      {/* Search Box */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <Autocomplete
          onLoad={(ac) => (autocompleteRef.current = ac)}
          onPlaceChanged={onPlaceChanged}
          options={{
            bounds: SL_BOUNDS,
            componentRestrictions: { country: "lk" },
            fields: ["geometry", "name", "formatted_address"],
            types: ["establishment", "geocode"],
          }}
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a location in Sri Lanka..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full px-4 py-3 pl-12 pr-4 bg-white border border-gray-300 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </Autocomplete>
      </div>

      {/* Instruction Overlay */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Click or drag to select location</span>
          </div>
        </div>
      </div>

      <div style={{ height }} className="w-full border border-gray-200 overflow-hidden rounded-lg shadow-sm">
        <GoogleMap
          onLoad={onMapLoad}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={SL_CENTER}
          zoom={9}
          onClick={handleClick}
          options={{
            restriction: { latLngBounds: SL_BOUNDS, strictBounds: true },
            minZoom: 7,
            maxZoom: 18,
            styles: CLEAN_MAP_STYLE,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
            gestureHandling: "greedy",
          }}
        >
          <Marker
            position={pos}
            draggable
            onDragEnd={handleDragEnd}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#1e40af",
              strokeWeight: 2,
            }}
          />
        </GoogleMap>
      </div>

      <div className="mt-3 px-3 py-2 bg-gray-50 rounded-lg">
        {isValidating ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-600">Validating location...</span>
          </div>
        ) : error ? (
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm text-gray-700 font-medium">
              Selected: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">Search above or click on the map to select a location on land</p>
      </div>
    </div>
  );
}
