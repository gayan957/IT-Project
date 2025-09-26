import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const libraries = ['places'];

const SimpleMap = () => {
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const mapStyles = {
    height: "400px",
    width: "100%"
  };
  
  const defaultCenter = {
    lat: 6.9271,
    lng: 79.8612
  };

  const onLoad = useCallback(() => {
    console.log('Simple map loaded successfully');
    setIsLoaded(true);
  }, []);

  const onError = useCallback((error) => {
    console.error('Simple map error:', error);
    setError(error.message);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Simple Map Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      <div className="border rounded">
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          onLoad={() => console.log('LoadScript completed')}
          onError={(error) => {
            console.error('LoadScript error:', error);
            setError('Failed to load Google Maps script');
          }}
        >
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={10}
            center={defaultCenter}
            onLoad={onLoad}
            onError={onError}
          >
            <Marker position={defaultCenter} />
          </GoogleMap>
        </LoadScript>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Map loaded: {isLoaded ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export default SimpleMap;