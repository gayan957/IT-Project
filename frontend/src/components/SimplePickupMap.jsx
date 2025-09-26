import React, { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const libraries = ['places'];

const SimplePickupMap = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  
  const mapStyles = {
    height: "calc(100vh - 200px)",
    width: "100%"
  };
  
  const defaultCenter = {
    lat: 6.9271,
    lng: 79.8612
  };

  const bins = [
    { _id: '1', location: { lat: 6.9271, lng: 79.8612 }, fillLevel: 87, address: 'Colombo Fort' },
    { _id: '2', location: { lat: 7.2906, lng: 80.6337 }, fillLevel: 92, address: 'Kandy Center' },
    { _id: '3', location: { lat: 6.0535, lng: 80.2210 }, fillLevel: 78, address: 'Galle Fort' }
  ];

  const onMapLoad = useCallback(() => {
    console.log('Simple map loaded');
    setIsLoaded(true);
  }, []);

  const getBinColor = (fillLevel) => {
    if (fillLevel >= 90) return '#dc2626'; // red
    if (fillLevel >= 80) return '#ea580c'; // orange  
    return '#eab308'; // yellow
  };

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Pickup Agent Map</h1>
        <p className="text-sm text-gray-600">Simple map view - {bins.length} bins available</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Map */}
      <div className="p-4">
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          onLoad={() => console.log('Script loaded')}
          onError={(error) => {
            console.error('Script load error:', error);
            setError('Failed to load Google Maps');
          }}
        >
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={8}
            center={defaultCenter}
            onLoad={onMapLoad}
          >
            {bins.map((bin) => (
              <Marker
                key={bin._id}
                position={bin.location}
                title={`${bin.address} - ${bin.fillLevel}% full`}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="15" cy="15" r="12" fill="${getBinColor(bin.fillLevel)}" stroke="white" stroke-width="2"/>
                      <text x="15" y="19" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="white">
                        ${bin.fillLevel}%
                      </text>
                    </svg>
                  `)}`,
                  scaledSize: { width: 30, height: 30 }
                }}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Status */}
      <div className="px-6 py-2 bg-white border-t">
        <p className="text-sm text-gray-600">
          Map Status: {isLoaded ? '✅ Loaded' : '⏳ Loading...'}
        </p>
      </div>
    </div>
  );
};

export default SimplePickupMap;