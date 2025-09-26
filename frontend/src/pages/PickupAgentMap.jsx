import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import collectionApi from '../lib/collectionApi';
import { scheduleApi } from '../lib/scheduleApi';

const libraries = []; // No additional libraries needed for basic map functionality

// Sri Lanka bounds
const SL_BOUNDS = {
  north: 9.8314,
  south: 5.916,
  east: 81.8811,
  west: 79.6951
};

const mapOptions = {
  restriction: {
    latLngBounds: SL_BOUNDS,
    strictBounds: false,
  },
  minZoom: 7,
  maxZoom: 18,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
  zoomControlOptions: {
    position: 9 // TOP_RIGHT
  },
  gestureHandling: 'greedy'
};

// Custom bin icons based on fill level
const getBinIcon = (fillLevel) => {
  const color = fillLevel >= 90 ? '#dc2626' : fillLevel >= 80 ? '#ea580c' : '#eab308';
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="24" height="26" rx="2" fill="${color}" stroke="#374151" stroke-width="2"/>
        <rect x="6" y="8" width="28" height="4" rx="2" fill="#6b7280"/>
        <rect x="12" y="6" width="16" height="4" rx="1" fill="#9ca3af"/>
        <circle cx="20" cy="20" r="8" fill="white" opacity="0.9"/>
        <text x="20" y="25" text-anchor="middle" font-family="Arial" font-size="8" font-weight="bold" fill="${color}">
          ${fillLevel}%
        </text>
      </svg>
    `)}`,
    scaledSize: { width: 40, height: 40 },
    anchor: { x: 20, y: 40 }
  };
};

// Schedule marker icon
const scheduleIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" fill="#3b82f6" stroke="white" stroke-width="2"/>
      <rect x="11" y="8" width="14" height="20" rx="2" fill="white"/>
      <rect x="11" y="8" width="14" height="4" fill="#1e40af"/>
      <circle cx="15" cy="6" r="1" fill="#64748b"/>
      <circle cx="21" cy="6" r="1" fill="#64748b"/>
      <rect x="13" y="14" width="10" height="1" fill="#64748b"/>
      <rect x="13" y="17" width="8" height="1" fill="#64748b"/>
      <rect x="13" y="20" width="6" height="1" fill="#64748b"/>
    </svg>
  `)}`,
  scaledSize: { width: 36, height: 36 },
  anchor: { x: 18, y: 36 }
};

// Agent location icon
const agentIcon = {
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="3"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
      <circle cx="16" cy="16" r="3" fill="#10b981"/>
    </svg>
  `)}`,
  scaledSize: { width: 32, height: 32 },
  anchor: { x: 16, y: 16 }
};

const PickupAgentMap = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agentLocation, setAgentLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const [locationError, setLocationError] = useState(null);
  const [bins, setBins] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const directionsServiceRef = useRef(null);
  const clickTimerRef = useRef(null);
  const scheduleClickTimerRef = useRef(null);

  // Dashboard navigation items
  const navigationItems = [
    { path: '/pickup-agent/dashboard', label: 'Overview', icon: '📊' },
    { path: '/pickup-agent/dashboard/map', label: 'Collection Map', icon: '🗺️' },
    { path: '/pickup-agent/dashboard/pickups', label: 'Pickups', icon: '📦' },
    { path: '/pickup-agent/dashboard/schedule', label: 'Schedule', icon: '📅' },
    { path: '/pickup-agent/dashboard/earnings', label: 'Earnings', icon: '💰' },
    { path: '/pickup-agent/dashboard/profile', label: 'Profile', icon: '👤' }
  ];

  const isActiveLink = (path) => {
    if (path === '/pickup-agent/dashboard') {
      return location.pathname === '/pickup-agent/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Check API key immediately
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Use Google Maps API loader
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: libraries
  });

  // Enhanced geolocation with better error handling
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000 // 5 minutes cache
    };

    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate location is within Sri Lanka bounds
        if (
          latitude >= SL_BOUNDS.south &&
          latitude <= SL_BOUNDS.north &&
          longitude >= SL_BOUNDS.west &&
          longitude <= SL_BOUNDS.east
        ) {
          setAgentLocation({ lat: latitude, lng: longitude });
          setLocationError(null);
        } else {
          setLocationError('Location is outside Sri Lanka');
          // Use Colombo as fallback
          setAgentLocation({ lat: 6.9271, lng: 79.8612 });
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Using default location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Using default location.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Using default location.';
            break;
        }
        setLocationError(errorMessage);
        setAgentLocation({ lat: 6.9271, lng: 79.8612 });
      },
      options
    );
  }, []);

  // Enhanced data fetching with caching and error handling
  const fetchMapData = useCallback(async (forceRefresh = false) => {
    try {
      setError(null);
      console.log('Fetching map data...');
      
      // Check for cached data first (only if not forcing refresh)
      const cachedBins = sessionStorage.getItem('pickupBins');
      const cachedTime = sessionStorage.getItem('pickupBinsTime');
      const now = Date.now();
      
      if (!forceRefresh && cachedBins && cachedTime && (now - parseInt(cachedTime)) < 300000) { // 5 minutes cache
        console.log('Using cached bin data');
        setBins(JSON.parse(cachedBins));
      } else {
        console.log('Fetching fresh bin data from API...');
        // Fetch fresh data
        const binsResponse = await collectionApi.getHighFillBins();
        const binsData = Array.isArray(binsResponse?.data?.bins) ? binsResponse.data.bins : binsResponse?.bins || [];
        
        // Transform bins to have proper location format for Google Maps
        const transformedBins = binsData.map(bin => ({
          ...bin,
          location: {
            lat: bin.location?.coordinates?.[1] || 6.9271,
            lng: bin.location?.coordinates?.[0] || 79.8612
          },
          address: bin.label || bin.owner?.fullName || 'Unknown Location'
        }));
        
        console.log('Fetched bins:', transformedBins);
        setBins(transformedBins);
        
        // Cache the data
        sessionStorage.setItem('pickupBins', JSON.stringify(transformedBins));
        sessionStorage.setItem('pickupBinsTime', now.toString());
      }

      // Try to load real schedule data, fallback to mock data if none exist
      try {
        const realSchedules = await scheduleApi.getSchedulesForMap();
        if (realSchedules && realSchedules.length > 0) {
          console.log('Loaded real schedules:', realSchedules.length);
          setSchedules(realSchedules);
        } else {
          throw new Error('No real schedules found, using mock data');
        }
      } catch (scheduleError) {
        console.log('Using mock schedule data:', scheduleError.message);
        
        // Enhanced sample schedules with better data
        const enhancedSchedules = [
          {
            _id: 'schedule1',
            location: { lat: 7.2906, lng: 80.6337 },
            address: 'Kandy City Center',
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            priority: 'high',
            estimatedDuration: '45 minutes'
          },
          {
            _id: 'schedule2',
            location: { lat: 6.0535, lng: 80.2210 },
            address: 'Galle Fort Area',
            scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            priority: 'medium',
            estimatedDuration: '30 minutes'
          },
          {
            _id: 'schedule3',
            location: { lat: 6.1399, lng: 80.0785 },
            address: 'Hikkaduwa Beach Road',
            scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            priority: 'low',
            estimatedDuration: '25 minutes'
          }
        ];
        
        setSchedules(enhancedSchedules);
      }
      console.log('Map data loaded successfully');
      
    } catch (error) {
      console.error('Error fetching map data:', error);
      setError('Failed to load map data. Using sample data.');
      
      // Fallback sample data with proper Sri Lanka coordinates
      const fallbackBins = [
        {
          _id: 'bin1',
          location: { lat: 6.9271, lng: 79.8612 },
          fillLevel: 87,
          address: 'Colombo Fort Railway Station',
          wasteType: 'mixed',
          lastUpdated: new Date().toISOString(),
          owner: { fullName: 'Fort Station Authority' }
        },
        {
          _id: 'bin2',
          location: { lat: 7.2906, lng: 80.6337 },
          fillLevel: 92,
          address: 'Kandy Central Market',
          wasteType: 'organic',
          lastUpdated: new Date().toISOString(),
          owner: { fullName: 'Kandy Municipal Council' }
        },
        {
          _id: 'bin3',
          location: { lat: 6.0535, lng: 80.2210 },
          fillLevel: 78,
          address: 'Galle International Stadium',
          wasteType: 'plastic',
          lastUpdated: new Date().toISOString(),
          owner: { fullName: 'Cricket Board' }
        },
        {
          _id: 'bin4',
          location: { lat: 6.8496, lng: 79.9285 },
          fillLevel: 95,
          address: 'University of Moratuwa',
          wasteType: 'paper',
          lastUpdated: new Date().toISOString(),
          owner: { fullName: 'University Administration' }
        },
        {
          _id: 'bin5',
          location: { lat: 7.4818, lng: 80.3609 },
          fillLevel: 89,
          address: 'Dambulla Golden Temple',
          wasteType: 'electronic',
          lastUpdated: new Date().toISOString(),
          owner: { fullName: 'Temple Management' }
        }
      ];
      
      setBins(fallbackBins);
    }
  }, []);
  
  useEffect(() => {
    if (!apiKey) {
      console.error('Google Maps API key not configured');
      setLoading(false);
      setError('Google Maps API key not configured');
      return;
    }

    if (loadError) {
      console.error('Google Maps load error:', loadError);
      setLoading(false);
      setError(`Failed to load Google Maps: ${loadError.message || loadError}`);
      return;
    }

    if (isLoaded) {
      console.log('Google Maps loaded successfully');
      // Google Maps is loaded, now fetch data and get location
      getCurrentLocation();
      fetchMapData();
      setLoading(false);
    }
  }, [apiKey, isLoaded, loadError, getCurrentLocation, fetchMapData]);

  // Check if returning from collection page and force refresh
  useEffect(() => {
    const checkForCollectionUpdate = () => {
      const collectionCompleted = sessionStorage.getItem('collectionCompleted');
      if (collectionCompleted) {
        console.log('Collection completed detected, forcing map data refresh...');
        sessionStorage.removeItem('collectionCompleted');
        // Clear cache and force refresh
        sessionStorage.removeItem('pickupBins');
        sessionStorage.removeItem('pickupBinsTime');
        if (isLoaded) {
          fetchMapData(true); // Force refresh
        }
      }
    };

    checkForCollectionUpdate();
    
    // Also check when the component becomes visible again (in case of browser tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForCollectionUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoaded, fetchMapData]);

  // Loading timeout to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Map loading timeout reached after 15 seconds');
        setLoading(false);
        setError('Map took too long to load. You can still use the debug options below.');
      }
    }, 15000); // 15 second timeout

    return () => clearTimeout(loadingTimeout);
  }, [loading]);

  // Calculate route with better error handling
  const calculateRoute = useCallback(async (destination) => {
    if (!directionsServiceRef.current || !agentLocation) return;

    setIsCalculatingRoute(true);
    try {
      const result = await new Promise((resolve, reject) => {
        directionsServiceRef.current.route(
          {
            origin: agentLocation,
            destination: destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false
          },
          (result, status) => {
            if (status === 'OK') {
              resolve(result);
            } else {
              reject(new Error(`Route calculation failed: ${status}`));
            }
          }
        );
      });

      setDirectionsResponse(result);
      
      // Extract route information
      const route = result.routes[0];
      const leg = route.legs[0];
      setRouteInfo({
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.length
      });
      
    } catch (error) {
      console.error('Error calculating route:', error);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [agentLocation]);

  // Handle bin click with enhanced single/double click detection
  const handleBinClick = useCallback((bin) => {
    console.log('Bin clicked:', bin);
    
    if (clickTimerRef.current) {
      // Double click detected - navigate to collect waste page
      console.log('Double click detected - navigating to collect waste');
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      
      // Navigate to collect waste page with bin data
      navigate('/collect-waste', { 
        state: { 
          binData: bin 
        } 
      });
      
    } else {
      // Single click - set timer to detect double click
      console.log('Single click - setting timer for double click detection');
      clickTimerRef.current = setTimeout(() => {
        console.log('Single click confirmed - showing route');
        clickTimerRef.current = null;
        
        // Single click - show route
        setSelectedBin(null);
        setSelectedSchedule(null);
        calculateRoute(bin.location);
        
      }, 400); // Increased delay to 400ms for better double-click detection
    }
  }, [calculateRoute, navigate]);

  // Handle schedule click with single/double click detection
  const handleScheduleClick = useCallback((schedule) => {
    console.log('Schedule clicked:', schedule);
    
    if (scheduleClickTimerRef.current) {
      // Double click detected - navigate to collect schedule waste page
      console.log('Double click detected - navigating to collect schedule waste');
      clearTimeout(scheduleClickTimerRef.current);
      scheduleClickTimerRef.current = null;
      
      // Navigate to collect schedule waste page with schedule data
      navigate('/collect-schedule-waste', { 
        state: { 
          schedule: schedule 
        } 
      });
      
    } else {
      // Single click - set timer to detect double click
      console.log('Single click - setting timer for double click detection');
      scheduleClickTimerRef.current = setTimeout(() => {
        console.log('Single click confirmed - showing schedule info');
        scheduleClickTimerRef.current = null;
        
        // Single click - show schedule info
        setSelectedBin(null);
        setSelectedSchedule(schedule);
        setDirectionsResponse(null);
        setRouteInfo(null);
        
      }, 400); // Same delay as bin clicks for consistency
    }
  }, [navigate]);

  // Clear route and selections
  const clearRoute = useCallback(() => {
    setDirectionsResponse(null);
    setRouteInfo(null);
    setSelectedBin(null);
    setSelectedSchedule(null);
  }, []);

  // Initialize map
  const onMapLoad = useCallback((mapInstance) => {
    console.log('Map loaded successfully:', mapInstance);
    try {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      console.log('DirectionsService initialized');
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error('Error initializing map services:', error);
      setError('Failed to initialize map services');
      setLoading(false);
    }
  }, []);

  // Navigation to collect page
  const handleCollectClick = useCallback((bin) => {
    navigate(`/pickup-agent/dashboard/collect/${bin._id}`);
  }, [navigate]);

  // Effects
  useEffect(() => {
    console.log('PickupAgentMap component mounted');
    getCurrentLocation();
    
    // Add timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, forcing completion');
        setLoading(false);
        setError('Map loading took too long. Using fallback data.');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [getCurrentLocation, loading]);

  useEffect(() => {
    console.log('Fetching initial map data');
    fetchMapData().finally(() => {
      // Ensure loading is set to false regardless of success/failure
      console.log('Data fetching completed');
    });
  }, [fetchMapData]);

  // Log when data changes
  useEffect(() => {
    console.log('Bins updated:', bins.length, 'bins loaded');
    // If we have data and location, we can stop loading
    if (bins.length > 0 && agentLocation && loading) {
      console.log('Data and location ready, stopping loading');
      setLoading(false);
    }
  }, [bins, loading, agentLocation]);

  useEffect(() => {
    console.log('Agent location updated:', agentLocation);
  }, [agentLocation]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading Pickup Map...</p>
          <p className="text-sm text-gray-500 mt-2">Getting your location and bin data</p>
          
          {/* Debug information */}
          <div className="mt-4 text-xs text-gray-600 space-y-1">
            <p>API Key: {apiKey ? '✓ Configured' : '✗ Missing'}</p>
            <p>Maps Loaded: {isLoaded ? '✓ Yes' : '✗ No'}</p>
            <p>Load Error: {loadError ? `✗ ${loadError}` : '✓ None'}</p>
          </div>
          
          {/* Emergency bypass after 5 seconds */}
          <button
            onClick={() => {
              console.log('User bypassed loading');
              setLoading(false);
              setError('Loaded with manual bypass - using fallback data');
            }}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Anyway
          </button>
          
          <p className="text-xs text-gray-400 mt-2">Click if loading takes too long</p>
        </div>
      </div>
    );
  }

  // Check if Google Maps API key is available
  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Google Maps Not Available</h2>
          <p className="text-gray-600 mb-4">
            Google Maps API key is not configured. Please contact your administrator.
          </p>
          <div className="text-left bg-gray-50 p-4 rounded text-sm">
            <p className="font-medium mb-2">For developers:</p>
            <p>Add <code className="bg-gray-200 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Sub Header with Stats */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {locationError ? locationError : 'Your current location is being tracked'}
          </div>
          
          {/* Statistics */}
          <div className="flex space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{bins.length}</div>
              <div className="text-xs text-gray-500">High-Fill Bins</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{schedules.length}</div>
              <div className="text-xs text-gray-500">Scheduled Pickups</div>
            </div>
            {routeInfo && (
              <div className="text-center">
                <div className="text-sm font-bold text-green-600">{routeInfo.distance}</div>
                <div className="text-xs text-gray-500">{routeInfo.duration}</div>
              </div>
            )}
            <div className="text-center bg-yellow-50 px-3 py-1 rounded">
              <div className="text-xs text-yellow-700 font-medium">💡 Tip</div>
              <div className="text-xs text-yellow-600">Double-click bins to collect</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-4">
            <button
              onClick={() => fetchMapData(true)}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
            
            <button
              onClick={getCurrentLocation}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Update Location
            </button>

            {directionsResponse && (
              <button
                onClick={clearRoute}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Route
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/agent-pickups')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Pickups
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span>90%+ Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span>80-89% Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span>75-79% Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Your Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
            </div>
          </div>
        ) : (
          <GoogleMap
            center={agentLocation}
            zoom={12}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={mapOptions}
            onLoad={onMapLoad}
            onClick={clearRoute}
            onError={(error) => {
              console.error('Google Map error:', error);
              setError('Google Maps encountered an error. Please try refreshing.');
            }}
          >
            {/* Agent Location Marker */}
            <Marker
              position={agentLocation}
              icon={agentIcon}
              title="Your Current Location"
              zIndex={1000}
            />

            {/* Bin Markers */}
            {bins.map((bin) => (
              <Marker
                key={bin._id}
                position={bin.location}
                icon={getBinIcon(bin.fillLevel)}
                onClick={() => {
                  console.log('Marker clicked for bin:', bin._id);
                  handleBinClick(bin);
                }}
                title={`${bin.address} - ${bin.fillLevel}% full - Double-click to collect`}
                zIndex={bin.fillLevel >= 90 ? 900 : bin.fillLevel >= 80 ? 800 : 700}
              />
            ))}

            {/* Schedule Markers */}
            {schedules.map((schedule) => (
              <Marker
                key={schedule._id}
                position={schedule.location}
                icon={scheduleIcon}
                onClick={() => handleScheduleClick(schedule)}
                title={`Scheduled pickup: ${schedule.address}`}
                zIndex={600}
              />
            ))}

            {/* Bin Info Window */}
            {selectedBin && (
              <InfoWindow
                position={selectedBin.location}
                onCloseClick={() => setSelectedBin(null)}
              >
                <div className="p-4 max-w-sm">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedBin.address}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fill Level:</span>
                      <span className={`font-bold ${
                        selectedBin.fillLevel >= 90 ? 'text-red-600' : 
                        selectedBin.fillLevel >= 80 ? 'text-orange-600' : 'text-yellow-600'
                      }`}>
                        {selectedBin.fillLevel}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waste Type:</span>
                      <span className="font-medium capitalize">{selectedBin.wasteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="text-sm text-gray-500">
                        {new Date(selectedBin.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {routeInfo && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">Route Information</h4>
                      <div className="text-sm space-y-1">
                        <div>Distance: <span className="font-medium">{routeInfo.distance}</span></div>
                        <div>Duration: <span className="font-medium">{routeInfo.duration}</span></div>
                        <div>Steps: <span className="font-medium">{routeInfo.steps}</span></div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleCollectClick(selectedBin)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Collect Waste
                  </button>
                </div>
              </InfoWindow>
            )}

            {/* Schedule Info Window */}
            {selectedSchedule && (
              <InfoWindow
                position={selectedSchedule.location}
                onCloseClick={() => setSelectedSchedule(null)}
              >
                <div className="p-4 max-w-sm">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedSchedule.address}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled Time:</span>
                      <span className="font-medium">
                        {new Date(selectedSchedule.scheduledTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium capitalize ${
                        selectedSchedule.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {selectedSchedule.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`font-medium capitalize ${
                        selectedSchedule.priority === 'high' ? 'text-red-600' : 
                        selectedSchedule.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {selectedSchedule.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Duration:</span>
                      <span className="font-medium">{selectedSchedule.estimatedDuration}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => calculateRoute(selectedSchedule.location)}
                    disabled={isCalculatingRoute}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isCalculatingRoute ? 'Calculating Route...' : 'Show Route'}
                  </button>
                </div>
              </InfoWindow>
            )}

            {/* Directions Renderer */}
            {directionsResponse && (
              <DirectionsRenderer
                directions={directionsResponse}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#3b82f6',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                  }
                }}
              />
            )}
          </GoogleMap>
        )}

        {/* Fallback Map View - Shows when Google Maps fails */}
        {error && error.includes('Google Maps') && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-lg">
              <div className="text-orange-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Map Unavailable</h3>
              <p className="text-gray-600 mb-4">Google Maps failed to load. Here's your collection data:</p>
              
              {/* Fallback Data Display */}
              <div className="text-left space-y-4">
                <div className="bg-red-50 p-3 rounded">
                  <h4 className="font-bold text-red-800 mb-2">High Priority Bins ({bins.filter(b => b.fillLevel >= 90).length})</h4>
                  {bins.filter(b => b.fillLevel >= 90).map(bin => (
                    <div key={bin._id} className="text-sm text-red-700">
                      📍 {bin.address} - {bin.fillLevel}% full
                    </div>
                  ))}
                </div>
                
                <div className="bg-orange-50 p-3 rounded">
                  <h4 className="font-bold text-orange-800 mb-2">Medium Priority Bins ({bins.filter(b => b.fillLevel >= 80 && b.fillLevel < 90).length})</h4>
                  {bins.filter(b => b.fillLevel >= 80 && b.fillLevel < 90).map(bin => (
                    <div key={bin._id} className="text-sm text-orange-700">
                      📍 {bin.address} - {bin.fillLevel}% full
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-bold text-blue-800 mb-2">Scheduled Pickups ({schedules.length})</h4>
                  {schedules.map(schedule => (
                    <div key={schedule._id} className="text-sm text-blue-700">
                      📅 {schedule.address} - {new Date(schedule.scheduledTime).toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Floating Action Panel */}
        {(isCalculatingRoute || routeInfo) && (
          <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            {isCalculatingRoute ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700">Calculating optimal route...</span>
              </div>
            ) : routeInfo ? (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Route Details</h3>
                <div className="space-y-1 text-sm">
                  <div>🚗 Distance: <span className="font-medium">{routeInfo.distance}</span></div>
                  <div>⏱️ Duration: <span className="font-medium">{routeInfo.duration}</span></div>
                  <div>📍 Navigation steps: <span className="font-medium">{routeInfo.steps}</span></div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default PickupAgentMap;