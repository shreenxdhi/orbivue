import React, { useState, useEffect } from 'react';

interface ApiKey {
  id: string;
  service: string;
  key: string;
  isActive: boolean;
}

interface AppSettings {
  darkMode: boolean;
  satelliteRefreshRate: number;
  weatherRefreshRate: number;
  location: {
    useAutoLocation: boolean;
    latitude: number;
    longitude: number;
    locationName: string;
  };
  notifications: {
    satellitePasses: boolean;
    weatherAlerts: boolean;
  };
}

const Settings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: '1', service: 'N2YO', key: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', isActive: true },
    { id: '2', service: 'OpenWeatherMap', key: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', isActive: true },
  ]);
  
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    satelliteRefreshRate: 60,
    weatherRefreshRate: 30,
    location: {
      useAutoLocation: true,
      latitude: 0,
      longitude: 0,
      locationName: '',
    },
    notifications: {
      satellitePasses: true,
      weatherAlerts: true,
    },
  });
  
  const [newApiKey, setNewApiKey] = useState<{ service: string; key: string }>({
    service: '',
    key: '',
  });
  
  // Load settings from local storage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('orbivue-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse settings:', error);
      }
    }
    
    const savedApiKeys = localStorage.getItem('orbivue-api-keys');
    if (savedApiKeys) {
      try {
        const parsedApiKeys = JSON.parse(savedApiKeys);
        setApiKeys(parsedApiKeys);
      } catch (error) {
        console.error('Failed to parse API keys:', error);
      }
    }
    
    // Check system dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setSettings(prev => ({ ...prev, darkMode: true }));
    }
  }, []);
  
  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('orbivue-settings', JSON.stringify(settings));
  }, [settings]);
  
  // Save API keys to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('orbivue-api-keys', JSON.stringify(apiKeys));
  }, [apiKeys]);
  
  // Handle API key form submission
  const handleAddApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newApiKey.service.trim() && newApiKey.key.trim()) {
      const newId = (apiKeys.length + 1).toString();
      setApiKeys([...apiKeys, { id: newId, ...newApiKey, isActive: true }]);
      setNewApiKey({ service: '', key: '' });
    }
  };
  
  // Handle API key deletion
  const handleDeleteApiKey = (id: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
  };
  
  // Toggle API key active state
  const handleToggleApiKey = (id: string) => {
    setApiKeys(
      apiKeys.map(key => 
        key.id === id ? { ...key, isActive: !key.isActive } : key
      )
    );
  };
  
  // Handle settings form submission
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      if (name === 'notifications.satellitePasses') {
        setSettings({
          ...settings,
          notifications: {
            ...settings.notifications,
            satellitePasses: checked,
          },
        });
      } else if (name === 'notifications.weatherAlerts') {
        setSettings({
          ...settings,
          notifications: {
            ...settings.notifications,
            weatherAlerts: checked,
          },
        });
      } else if (name === 'location.useAutoLocation') {
        setSettings({
          ...settings,
          location: {
            ...settings.location,
            useAutoLocation: checked,
          },
        });
      } else if (name === 'darkMode') {
        setSettings({
          ...settings,
          darkMode: checked,
        });
        
        // Apply dark mode to the document
        if (checked) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else {
      // Handle number and text inputs
      if (name === 'satelliteRefreshRate' || name === 'weatherRefreshRate') {
        setSettings({
          ...settings,
          [name]: Number(value),
        });
      } else if (name === 'location.latitude') {
        setSettings({
          ...settings,
          location: {
            ...settings.location,
            latitude: Number(value),
          },
        });
      } else if (name === 'location.longitude') {
        setSettings({
          ...settings,
          location: {
            ...settings.location,
            longitude: Number(value),
          },
        });
      } else if (name === 'location.locationName') {
        setSettings({
          ...settings,
          location: {
            ...settings.location,
            locationName: value,
          },
        });
      }
    }
  };
  
  // Reset all settings to defaults
  const handleResetSettings = () => {
    const defaultSettings: AppSettings = {
      darkMode: false,
      satelliteRefreshRate: 60,
      weatherRefreshRate: 30,
      location: {
        useAutoLocation: true,
        latitude: 0,
        longitude: 0,
        locationName: '',
      },
      notifications: {
        satellitePasses: true,
        weatherAlerts: true,
      },
    };
    
    setSettings(defaultSettings);
    document.documentElement.classList.remove('dark');
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Settings
        </h1>
        
        {/* API Keys Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">API Keys</h2>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Service</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">API Key</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left py-2 text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className="border-b border-gray-200 dark:border-gray-600">
                    <td className="py-3 text-gray-800 dark:text-gray-200">{key.service}</td>
                    <td className="py-3 text-gray-800 dark:text-gray-200">
                      <div className="flex items-center">
                        <span className="font-mono">
                          {key.key.substring(0, 4)}...{key.key.substring(key.key.length - 4)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          key.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                      >
                        {key.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleApiKey(key.id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                          {key.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteApiKey(key.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <form onSubmit={handleAddApiKey} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Add New API Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="service"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Service
                </label>
                <input
                  type="text"
                  id="service"
                  name="service"
                  value={newApiKey.service}
                  onChange={(e) => setNewApiKey({ ...newApiKey, service: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., N2YO, OpenWeatherMap"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="key"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  API Key
                </label>
                <input
                  type="text"
                  id="key"
                  name="key"
                  value={newApiKey.key}
                  onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your API key"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg"
            >
              Add API Key
            </button>
          </form>
        </div>
        
        {/* Application Settings Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Application Settings</h2>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-6">
            {/* Appearance */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Appearance</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="darkMode"
                    name="darkMode"
                    checked={settings.darkMode}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="darkMode"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Dark Mode
                  </label>
                </div>
              </div>
            </div>
            
            {/* Refresh Rates */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Data Updates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="satelliteRefreshRate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Satellite Refresh Rate (seconds)
                  </label>
                  <input
                    type="number"
                    id="satelliteRefreshRate"
                    name="satelliteRefreshRate"
                    value={settings.satelliteRefreshRate}
                    onChange={handleSettingsChange}
                    min="10"
                    max="3600"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="weatherRefreshRate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Weather Refresh Rate (minutes)
                  </label>
                  <input
                    type="number"
                    id="weatherRefreshRate"
                    name="weatherRefreshRate"
                    value={settings.weatherRefreshRate}
                    onChange={handleSettingsChange}
                    min="5"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            {/* Location Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Location</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useAutoLocation"
                    name="location.useAutoLocation"
                    checked={settings.location.useAutoLocation}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="useAutoLocation"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Use Automatic Location
                  </label>
                </div>
                
                {!settings.location.useAutoLocation && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                    <div>
                      <label
                        htmlFor="locationName"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Location Name
                      </label>
                      <input
                        type="text"
                        id="locationName"
                        name="location.locationName"
                        value={settings.location.locationName}
                        onChange={handleSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                        placeholder="e.g., New York City"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="latitude"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Latitude
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        name="location.latitude"
                        value={settings.location.latitude}
                        onChange={handleSettingsChange}
                        step="0.000001"
                        min="-90"
                        max="90"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                        placeholder="e.g., 40.7128"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="longitude"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Longitude
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        name="location.longitude"
                        value={settings.location.longitude}
                        onChange={handleSettingsChange}
                        step="0.000001"
                        min="-180"
                        max="180"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                        placeholder="e.g., -74.006"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Notifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="satellitePasses"
                    name="notifications.satellitePasses"
                    checked={settings.notifications.satellitePasses}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="satellitePasses"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Satellite Pass Notifications
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weatherAlerts"
                    name="notifications.weatherAlerts"
                    checked={settings.notifications.weatherAlerts}
                    onChange={handleSettingsChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="weatherAlerts"
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    Weather Alert Notifications
                  </label>
                </div>
              </div>
            </div>
            
            {/* Reset Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={handleResetSettings}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings; 