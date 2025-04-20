import axios from 'axios';

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

// API configuration using environment variables
const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY || 'f0fd7a09787e01aa6a78edace652c5d7';
const USE_CORS_PROXY = process.env.REACT_APP_USE_CORS_PROXY === 'true';
const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://cors-anywhere.herokuapp.com/';
const IS_DEV = process.env.NODE_ENV === 'development';

// API URLs for production vs development
const BASE_URL = IS_DEV ? '/api/weather' : 'https://api.openweathermap.org/data/2.5';
const GEO_URL = IS_DEV ? '/api/geo' : 'https://api.openweathermap.org/geo/1.0';

// Function to build API URL with optional CORS proxy (for non-dev environments)
const buildApiUrl = (baseUrl: string): string => {
  if (IS_DEV) return baseUrl; // Use local proxy in development
  return USE_CORS_PROXY ? `${CORS_PROXY_URL}${baseUrl}` : baseUrl;
};

// Default weather data for fallback
const DEFAULT_WEATHER: WeatherData = {
  location: 'New York',
  temperature: 22.5,
  feelsLike: 23.2,
  humidity: 65,
  pressure: 1012,
  windSpeed: 5.7,
  windDirection: 'NE',
  description: 'partly cloudy',
  icon: '02d',
  sunrise: new Date(new Date().setHours(5, 45, 0, 0)),
  sunset: new Date(new Date().setHours(20, 15, 0, 0)),
};

// Convert wind direction in degrees to cardinal direction
const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return directions[Math.round(degrees / 45) % 8];
};

// Generate mock forecast data for fallback
const generateMockForecast = (): ForecastDay[] => {
  const forecast: ForecastDay[] = [];
  const weatherIcons = ['01d', '02d', '03d', '04d', '10d'];
  const weatherDescriptions = [
    'clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'rain'
  ];
  
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const randomIconIndex = Math.floor(Math.random() * weatherIcons.length);
    
    forecast.push({
      date,
      minTemp: 15 + Math.random() * 3,
      maxTemp: 20 + Math.random() * 5,
      description: weatherDescriptions[randomIconIndex],
      icon: weatherIcons[randomIconIndex],
      precipitation: Math.round(Math.random() * 100),
      humidity: 40 + Math.round(Math.random() * 50),
      windSpeed: 2 + Math.round(Math.random() * 10 * 10) / 10,
    });
  }
  
  return forecast;
};

// Get weather data for location
export const fetchWeatherData = async (
  lat: number, 
  lon: number, 
  searchQuery?: string
): Promise<WeatherData> => {
  try {
    let latitude = lat;
    let longitude = lon;
    let locationName = '';

    // If search query is provided, geocode it to get coordinates
    if (searchQuery) {
      try {
        const geoResponse = await axios.get(buildApiUrl(`${GEO_URL}/direct`), {
          params: {
            q: searchQuery,
            limit: 1,
            appid: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (geoResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        const location = geoResponse.data[0];
        latitude = location.lat;
        longitude = location.lon;
        locationName = location.name + (location.state ? `, ${location.state}` : '') + (location.country ? `, ${location.country}` : '');
      } catch (geoError) {
        console.error('Geocoding error:', geoError);
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    }

    // Get current weather data
    const weatherResponse = await axios.get(buildApiUrl(`${BASE_URL}/weather`), {
      params: {
        lat: latitude,
        lon: longitude,
        units: 'metric',
        appid: API_KEY
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = weatherResponse.data;
    
    return {
      location: locationName || data.name,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDirection: getWindDirection(data.wind.deg),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: new Date(data.sys.sunrise * 1000),
      sunset: new Date(data.sys.sunset * 1000),
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // In development mode, return mocked data if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback weather data in development mode');
      return {
        ...DEFAULT_WEATHER,
        location: searchQuery || DEFAULT_WEATHER.location
      };
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching weather data');
  }
};

// Get forecast for location
export const fetchForecast = async (
  lat: number, 
  lon: number,
  searchQuery?: string
): Promise<ForecastDay[]> => {
  try {
    let latitude = lat;
    let longitude = lon;

    // If search query is provided, geocode it to get coordinates
    if (searchQuery) {
      try {
        const geoResponse = await axios.get(buildApiUrl(`${GEO_URL}/direct`), {
          params: {
            q: searchQuery,
            limit: 1,
            appid: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (geoResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        const location = geoResponse.data[0];
        latitude = location.lat;
        longitude = location.lon;
      } catch (geoError) {
        console.error('Geocoding error:', geoError);
        if (process.env.NODE_ENV === 'development') {
          return generateMockForecast();
        }
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    }

    // Get 5-day forecast data
    const forecastResponse = await axios.get(buildApiUrl(`${BASE_URL}/forecast`), {
      params: {
        lat: latitude,
        lon: longitude,
        units: 'metric',
        appid: API_KEY
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const forecast: ForecastDay[] = [];
    const dailyData: { [key: string]: any } = {};
    
    // Process forecast data (comes in 3-hour increments)
    forecastResponse.data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const day = date.toISOString().split('T')[0];
      
      // Initialize daily data if it doesn't exist
      if (!dailyData[day]) {
        dailyData[day] = {
          date: new Date(date),
          minTemp: item.main.temp_min,
          maxTemp: item.main.temp_max,
          descriptions: {},
          icons: {},
          humidity: [],
          windSpeed: [],
          precipitation: item.pop * 100 || 0
        };
      } else {
        // Update min/max temperatures
        dailyData[day].minTemp = Math.min(dailyData[day].minTemp, item.main.temp_min);
        dailyData[day].maxTemp = Math.max(dailyData[day].maxTemp, item.main.temp_max);
        dailyData[day].precipitation = Math.max(dailyData[day].precipitation, item.pop * 100 || 0);
      }
      
      // Track weather descriptions and icons to find most common
      const desc = item.weather[0].description;
      const icon = item.weather[0].icon.replace('n', 'd'); // normalize night/day icons
      
      dailyData[day].descriptions[desc] = (dailyData[day].descriptions[desc] || 0) + 1;
      dailyData[day].icons[icon] = (dailyData[day].icons[icon] || 0) + 1;
      
      // Collect humidity and wind speed values
      dailyData[day].humidity.push(item.main.humidity);
      dailyData[day].windSpeed.push(item.wind.speed);
    });
    
    // Convert daily data to forecast format
    Object.keys(dailyData).forEach(day => {
      const data = dailyData[day];
      
      // Find most common description and icon
      let maxDescCount = 0;
      let description = '';
      Object.entries(data.descriptions).forEach(([desc, count]: [string, any]) => {
        if (count > maxDescCount) {
          maxDescCount = count;
          description = desc;
        }
      });
      
      let maxIconCount = 0;
      let icon = '';
      Object.entries(data.icons).forEach(([ic, count]: [string, any]) => {
        if (count > maxIconCount) {
          maxIconCount = count;
          icon = ic;
        }
      });
      
      // Calculate averages
      const avgHumidity = Math.round(data.humidity.reduce((a: number, b: number) => a + b, 0) / data.humidity.length);
      const avgWindSpeed = Math.round((data.windSpeed.reduce((a: number, b: number) => a + b, 0) / data.windSpeed.length) * 10) / 10;
      
      forecast.push({
        date: data.date,
        minTemp: data.minTemp,
        maxTemp: data.maxTemp,
        description,
        icon,
        precipitation: Math.round(data.precipitation),
        humidity: avgHumidity,
        windSpeed: avgWindSpeed
      });
    });
    
    // Sort by date
    forecast.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Limit to 5 days
    return forecast.slice(0, 5);
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    
    // In development mode, return mocked data if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('Using fallback forecast data in development mode');
      return generateMockForecast();
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching forecast data');
  }
};

// Search for city autocomplete suggestions
export const searchCities = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await axios.get(buildApiUrl(`${GEO_URL}/direct`), {
      params: {
        q: query,
        limit: 5,
        appid: API_KEY
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    return response.data.map((city: any) => ({
      name: city.name,
      state: city.state,
      country: city.country,
      lat: city.lat,
      lon: city.lon,
      displayName: `${city.name}${city.state ? `, ${city.state}` : ''}${city.country ? `, ${city.country}` : ''}`
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}; 