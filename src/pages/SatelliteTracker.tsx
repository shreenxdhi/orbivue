import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getSatellitePositions } from '../services/satelliteService';

// Fix for Leaflet marker icons in React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface Satellite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visible: boolean;
  noradId: string;
}

const SatelliteTracker: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([0, 0]);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [filterVisible, setFilterVisible] = useState<boolean>(false);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setError('Unable to retrieve your location');
          // Default to New York City
          setUserLocation([40.7128, -74.0060]);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
      // Default to New York City
      setUserLocation([40.7128, -74.0060]);
    }
  }, []);

  // Fetch satellites when user location is available
  useEffect(() => {
    if (userLocation[0] !== 0 || userLocation[1] !== 0) {
      fetchSatellites();
    }
  }, [userLocation]);

  const fetchSatellites = async () => {
    try {
      setLoading(true);
      // This is where you'd call your actual API service
      // For now, we'll use a mock function
      const data = await getSatellitePositions(userLocation[0], userLocation[1]);
      setSatellites(data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching satellite data');
      setLoading(false);
    }
  };

  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  const filteredSatellites = filterVisible
    ? satellites.filter((sat) => sat.visible)
    : satellites;

  return (
    <div className="flex flex-col space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Satellite Tracker
        </h1>
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={() => setFilterVisible(!filterVisible)}
            className={`px-4 py-2 rounded-lg font-medium ${
              filterVisible
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
            }`}
          >
            {filterVisible ? 'Showing Visible Only' : 'Show All Satellites'}
          </button>
          <button
            onClick={fetchSatellites}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
          >
            Refresh Data
          </button>
        </div>

        {error && <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 h-[500px] overflow-y-auto pr-2">
              <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Satellites</h2>
              {filteredSatellites.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No satellites found for your location</p>
              ) : (
                <div className="space-y-2">
                  {filteredSatellites.map((satellite) => (
                    <div
                      key={satellite.id}
                      onClick={() => handleSatelliteClick(satellite)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSatellite?.id === satellite.id
                          ? 'bg-primary-100 dark:bg-primary-900'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 dark:text-white">{satellite.name}</h3>
                        {satellite.visible && (
                          <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs font-medium px-2 py-1 rounded-full">
                            Visible
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        NORAD ID: {satellite.noradId}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="md:w-2/3 h-[500px] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <MapContainer
                center={userLocation}
                zoom={3}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={userLocation}>
                  <Popup>Your Location</Popup>
                </Marker>
                {filteredSatellites.map((satellite) => (
                  <Marker
                    key={satellite.id}
                    position={[satellite.latitude, satellite.longitude]}
                    icon={new L.Icon({
                      iconUrl: satellite.visible
                        ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
                        : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                      iconSize: [25, 41],
                      iconAnchor: [12, 41],
                      popupAnchor: [1, -34],
                      shadowSize: [41, 41],
                    })}
                  >
                    <Popup>
                      <div>
                        <h3 className="font-bold">{satellite.name}</h3>
                        <p>Altitude: {satellite.altitude.toFixed(2)} km</p>
                        <p>Velocity: {satellite.velocity.toFixed(2)} km/s</p>
                        <p>Visibility: {satellite.visible ? 'Visible' : 'Not visible'}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        )}
      </section>

      {selectedSatellite && (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {selectedSatellite.name}
            </h2>
            <button
              onClick={() => setSelectedSatellite(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">NORAD ID</h3>
                <p className="text-lg text-gray-900 dark:text-white">{selectedSatellite.noradId}</p>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Position</h3>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedSatellite.latitude.toFixed(4)}°, {selectedSatellite.longitude.toFixed(4)}°
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Altitude</h3>
                <p className="text-lg text-gray-900 dark:text-white">{selectedSatellite.altitude.toFixed(2)} km</p>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Velocity</h3>
                <p className="text-lg text-gray-900 dark:text-white">{selectedSatellite.velocity.toFixed(2)} km/s</p>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Visibility</h3>
                <p className="text-lg text-gray-900 dark:text-white">
                  {selectedSatellite.visible ? 'Currently visible from your location' : 'Not currently visible'}
                </p>
              </div>
              <div>
                <button
                  className="mt-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
                >
                  Add to Watch List
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SatelliteTracker; 