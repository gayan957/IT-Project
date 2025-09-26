import React from 'react';

const MapDebug = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Map Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Environment Variables:</h2>
          <p>API Key: {apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found'}</p>
          <p>Base URL: {import.meta.env.VITE_API_BASE_URL}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Browser Support:</h2>
          <p>Geolocation: {navigator.geolocation ? 'Supported' : 'Not supported'}</p>
          <p>localStorage: {typeof Storage !== 'undefined' ? 'Supported' : 'Not supported'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Network Test:</h2>
          <button 
            onClick={() => {
              fetch('https://maps.googleapis.com/maps/api/js?key=' + apiKey)
                .then(response => {
                  console.log('Google Maps API response:', response.status);
                  alert('Google Maps API: ' + response.status);
                })
                .catch(error => {
                  console.error('Google Maps API error:', error);
                  alert('Google Maps API Error: ' + error.message);
                });
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Google Maps API
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapDebug;