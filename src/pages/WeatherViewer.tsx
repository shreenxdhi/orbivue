import React, { useState, useEffect, useRef } from 'react';
import { fetchWeatherData, fetchForecast, searchCities } from '../services/weatherService';

interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  description: string;
  icon: string;
  sunrise: Date;
  sunset: Date;
}

interface ForecastDay {
  date: Date;
  minTemp: number;
  maxTemp: number;
  description: string;
  icon: string;
  precipitation: number;
  humidity: number;
  windSpeed: number;
}

interface City {
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
  displayName: string;
}

const WeatherViewer: React.FC = () => {
  const [userLocation, setUserLocation] = useState<[number, number]>([0, 0]);
  const [locationName, setLocationName] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cityResults, setCityResults] = useState<City[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [recentSearches, setRecentSearches] = useState<City[]>([]);

  // Load recent searches from localStorage on initial load
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentWeatherSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error parsing saved searches', e);
      }
    }
  }, []);

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

    // Add click event listener to handle clicks outside search results
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch weather when user location is available
  useEffect(() => {
    if (userLocation[0] !== 0 || userLocation[1] !== 0) {
      fetchWeather(userLocation[0], userLocation[1]);
    }
  }, [userLocation]);

  // Handle search input changes with debounce
  useEffect(() => {
    if (searchQuery.length > 2) {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
      
      const timer = setTimeout(async () => {
        try {
          const results = await searchCities(searchQuery);
          setCityResults(results);
          setShowResults(true);
        } catch (err) {
          console.error('Error searching cities:', err);
        }
      }, 500);
      
      setSearchDebounce(timer);
    } else {
      setCityResults([]);
      setShowResults(false);
    }
    
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery]);

  const fetchWeather = async (lat: number, lon: number, cityName?: string) => {
    try {
      setLoading(true);
      setError(null);
      // Fetch current weather
      const data = await fetchWeatherData(lat, lon, cityName);
      setWeatherData(data);
      setLocationName(data.location);

      // Fetch forecast
      const forecastData = await fetchForecast(lat, lon, cityName);
      setForecast(forecastData);
      
      setLoading(false);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(`${err instanceof Error ? err.message : 'Error fetching weather data'}`);
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(false);
    
    if (searchQuery.trim()) {
      try {
        setLoading(true);
        setError(null);
        // Fetch weather using the search query
        await fetchWeather(0, 0, searchQuery);
      } catch (err) {
        console.error('Search error:', err);
        setError('Location not found. Please try another search.');
        setLoading(false);
      }
    }
  };

  const handleCitySelect = async (city: City) => {
    setSearchQuery(city.displayName);
    setShowResults(false);
    
    try {
      setLoading(true);
      setError(null);
      // Use coordinates for more accurate results
      await fetchWeather(city.lat, city.lon);
      
      // Save to recent searches
      const updatedSearches = [city, ...recentSearches.filter(s => 
        s.name !== city.name || s.country !== city.country
      )].slice(0, 5);
      
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentWeatherSearches', JSON.stringify(updatedSearches));
    } catch (err) {
      console.error('City select error:', err);
      setError(`Error getting weather for ${city.displayName}`);
      setLoading(false);
    }
  };

  // Format time from Date object
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date to day name
  const formatDay = (date: Date): string => {
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  return (
    <div className="flex flex-col space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Weather Viewer
        </h1>

        {/* Search for any city */}
        <div className="mb-6 relative" ref={searchRef}>
          <form onSubmit={handleSearch}>
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Search for any city in the world..."
                className="flex-grow px-4 py-2 rounded-l-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-r-lg"
              >
                Search
              </button>
            </div>
          </form>

          {/* City search results */}
          {showResults && cityResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-60 overflow-y-auto">
              {cityResults.map((city, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => handleCitySelect(city)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{city.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-300">
                    {city.state ? `${city.state}, ` : ''}{city.country}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recent searches:</h3>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((city, index) => (
                <button
                  key={index}
                  onClick={() => handleCitySelect(city)}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300"
                >
                  {city.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded-lg mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd"></path>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : weatherData ? (
          <div>
            {/* Current weather */}
            <div className="bg-gradient-to-r from-blue-500 to-primary-600 text-white rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{weatherData.location}</h2>
                  <p className="text-lg capitalize">{weatherData.description}</p>
                  <div className="flex items-center mt-4">
                    <img 
                      src={`https://openweathermap.org/img/wn/${weatherData.icon}@2x.png`} 
                      alt={weatherData.description}
                      className="w-16 h-16 mr-2"
                    />
                    <div>
                      <div className="text-4xl font-bold">{Math.round(weatherData.temperature)}°C</div>
                      <div>Feels like {Math.round(weatherData.feelsLike)}°C</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0 grid grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <div className="text-sm opacity-75">Humidity</div>
                    <div className="font-medium">{weatherData.humidity}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">Wind</div>
                    <div className="font-medium">{weatherData.windSpeed} km/h ({weatherData.windDirection})</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">Pressure</div>
                    <div className="font-medium">{weatherData.pressure} hPa</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">Sunrise / Sunset</div>
                    <div className="font-medium">{formatTime(weatherData.sunrise)} / {formatTime(weatherData.sunset)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast */}
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">5-Day Forecast</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {forecast.map((day, index) => (
                <div key={index} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="font-medium text-gray-700 dark:text-gray-300">{formatDay(day.date)}</div>
                  <img 
                    src={`https://openweathermap.org/img/wn/${day.icon}.png`} 
                    alt={day.description}
                    className="w-12 h-12 mx-auto"
                  />
                  <div className="capitalize text-sm text-gray-600 dark:text-gray-400">{day.description}</div>
                  <div className="mt-2 text-gray-800 dark:text-white">
                    <span className="font-medium">{Math.round(day.maxTemp)}°</span> / {Math.round(day.minTemp)}°
                  </div>
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <div>Precipitation: {day.precipitation}%</div>
                    <div>Humidity: {day.humidity}%</div>
                    <div>Wind: {day.windSpeed} km/h</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p>No weather data available. Please search for a location.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default WeatherViewer; 