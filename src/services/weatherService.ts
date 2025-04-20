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

// New interface for hourly forecast
interface HourlyForecast {
  dateTime: Date;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  precipitation: number;
  precipitationType: string | null;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  cloudCover: number;
  uvIndex: number;
}

// New interface for weather alerts
interface WeatherAlert {
  alertType: string;
  severity: number;
  headline: string;
  description: string;
  startDate: Date;
  endDate: Date;
  areas: string[];
}

// New interface for air quality
interface AirQuality {
  date: Date;
  index: number;
  category: string;
  primaryPollutant: string;
  pollutants: {
    [key: string]: {
      name: string;
      value: number;
      category: string;
      categoryIndex: number;
    }
  };
  healthRecommendations: {
    general: string;
    sensitive: string;
  };
}

// New interface for weather indices
interface WeatherIndex {
  id: number;
  name: string;
  type: string;
  value: number;
  category: string;
  categoryValue: number;
  text: string;
}

// New interface for astronomic data
interface AstronomicData {
  date: Date;
  sun: {
    rise: Date;
    set: Date;
    hoursOfSun: number;
  };
  moon: {
    rise: Date | null;
    set: Date | null;
    phase: string;
    phaseCode: number;
    age: number;
    illumination: number;
  };
}

// API configuration using environment variables
const API_KEY = process.env.REACT_APP_ACCUWEATHER_API_KEY || 'GrWnK5lgqP7lF5Mivf9NGqPj6NU9lh4p';
const USE_CORS_PROXY = process.env.REACT_APP_USE_CORS_PROXY === 'true';
const CORS_PROXY_URL = process.env.REACT_APP_CORS_PROXY_URL || 'https://cors-anywhere.herokuapp.com/';
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';
const IS_DEV = process.env.NODE_ENV === 'development';

// API URLs
const BASE_URL = 'https://dataservice.accuweather.com';
const LOCATIONS_URL = `${BASE_URL}/locations/v1`;
const FORECASTS_URL = `${BASE_URL}/forecasts/v1`;
const CURRENT_CONDITIONS_URL = `${BASE_URL}/currentconditions/v1`;
const INDICES_URL = `${BASE_URL}/indices/v1`;
const AIR_QUALITY_URL = `${BASE_URL}/airquality/v1`;

// Function to build API URL with optional CORS proxy
const buildApiUrl = (baseUrl: string): string => {
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

// Mock city data for autocomplete
const MOCK_CITIES = [
  // North America
  { name: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060, displayName: 'New York, NY, US' },
  { name: 'Los Angeles', state: 'CA', country: 'US', lat: 34.0522, lon: -118.2437, displayName: 'Los Angeles, CA, US' },
  { name: 'Chicago', state: 'IL', country: 'US', lat: 41.8781, lon: -87.6298, displayName: 'Chicago, IL, US' },
  { name: 'Houston', state: 'TX', country: 'US', lat: 29.7604, lon: -95.3698, displayName: 'Houston, TX, US' },
  { name: 'Toronto', state: 'ON', country: 'CA', lat: 43.6532, lon: -79.3832, displayName: 'Toronto, ON, CA' },
  { name: 'Mexico City', state: null, country: 'MX', lat: 19.4326, lon: -99.1332, displayName: 'Mexico City, MX' },
  
  // Europe
  { name: 'London', state: null, country: 'GB', lat: 51.5074, lon: -0.1278, displayName: 'London, GB' },
  { name: 'Paris', state: null, country: 'FR', lat: 48.8566, lon: 2.3522, displayName: 'Paris, FR' },
  { name: 'Berlin', state: null, country: 'DE', lat: 52.5200, lon: 13.4050, displayName: 'Berlin, DE' },
  { name: 'Madrid', state: null, country: 'ES', lat: 40.4168, lon: -3.7038, displayName: 'Madrid, ES' },
  { name: 'Rome', state: null, country: 'IT', lat: 41.9028, lon: 12.4964, displayName: 'Rome, IT' },
  { name: 'Moscow', state: null, country: 'RU', lat: 55.7558, lon: 37.6173, displayName: 'Moscow, RU' },
  { name: 'Istanbul', state: null, country: 'TR', lat: 41.0082, lon: 28.9784, displayName: 'Istanbul, TR' },
  { name: 'Amsterdam', state: null, country: 'NL', lat: 52.3676, lon: 4.9041, displayName: 'Amsterdam, NL' },
  { name: 'Athens', state: null, country: 'GR', lat: 37.9838, lon: 23.7275, displayName: 'Athens, GR' },
  { name: 'Vienna', state: null, country: 'AT', lat: 48.2082, lon: 16.3738, displayName: 'Vienna, AT' },
  { name: 'Stockholm', state: null, country: 'SE', lat: 59.3293, lon: 18.0686, displayName: 'Stockholm, SE' },
  { name: 'Warsaw', state: null, country: 'PL', lat: 52.2297, lon: 21.0122, displayName: 'Warsaw, PL' },
  
  // Asia
  { name: 'Tokyo', state: null, country: 'JP', lat: 35.6762, lon: 139.6503, displayName: 'Tokyo, JP' },
  { name: 'Beijing', state: null, country: 'CN', lat: 39.9042, lon: 116.4074, displayName: 'Beijing, CN' },
  { name: 'Shanghai', state: null, country: 'CN', lat: 31.2304, lon: 121.4737, displayName: 'Shanghai, CN' },
  { name: 'Mumbai', state: 'Maharashtra', country: 'IN', lat: 19.0760, lon: 72.8777, displayName: 'Mumbai, Maharashtra, IN' },
  { name: 'Delhi', state: null, country: 'IN', lat: 28.7041, lon: 77.1025, displayName: 'Delhi, IN' },
  { name: 'Bangalore', state: 'Karnataka', country: 'IN', lat: 12.9716, lon: 77.5946, displayName: 'Bangalore, Karnataka, IN' },
  { name: 'Seoul', state: null, country: 'KR', lat: 37.5665, lon: 126.9780, displayName: 'Seoul, KR' },
  { name: 'Singapore', state: null, country: 'SG', lat: 1.3521, lon: 103.8198, displayName: 'Singapore, SG' },
  { name: 'Hong Kong', state: null, country: 'HK', lat: 22.3193, lon: 114.1694, displayName: 'Hong Kong, HK' },
  { name: 'Bangkok', state: null, country: 'TH', lat: 13.7563, lon: 100.5018, displayName: 'Bangkok, TH' },
  { name: 'Jakarta', state: null, country: 'ID', lat: -6.2088, lon: 106.8456, displayName: 'Jakarta, ID' },
  { name: 'Manila', state: null, country: 'PH', lat: 14.5995, lon: 120.9842, displayName: 'Manila, PH' },
  { name: 'Kuala Lumpur', state: null, country: 'MY', lat: 3.1390, lon: 101.6869, displayName: 'Kuala Lumpur, MY' },
  { name: 'Dubai', state: null, country: 'AE', lat: 25.2048, lon: 55.2708, displayName: 'Dubai, AE' },
  { name: 'Riyadh', state: null, country: 'SA', lat: 24.7136, lon: 46.6753, displayName: 'Riyadh, SA' },
  
  // Africa
  { name: 'Cairo', state: null, country: 'EG', lat: 30.0444, lon: 31.2357, displayName: 'Cairo, EG' },
  { name: 'Lagos', state: null, country: 'NG', lat: 6.5244, lon: 3.3792, displayName: 'Lagos, NG' },
  { name: 'Nairobi', state: null, country: 'KE', lat: -1.2921, lon: 36.8219, displayName: 'Nairobi, KE' },
  { name: 'Cape Town', state: null, country: 'ZA', lat: -33.9249, lon: 18.4241, displayName: 'Cape Town, ZA' },
  { name: 'Johannesburg', state: null, country: 'ZA', lat: -26.2041, lon: 28.0473, displayName: 'Johannesburg, ZA' },
  { name: 'Casablanca', state: null, country: 'MA', lat: 33.5731, lon: -7.5898, displayName: 'Casablanca, MA' },
  { name: 'Addis Ababa', state: null, country: 'ET', lat: 9.0320, lon: 38.7463, displayName: 'Addis Ababa, ET' },
  
  // South America
  { name: 'Rio de Janeiro', state: null, country: 'BR', lat: -22.9068, lon: -43.1729, displayName: 'Rio de Janeiro, BR' },
  { name: 'São Paulo', state: null, country: 'BR', lat: -23.5505, lon: -46.6333, displayName: 'São Paulo, BR' },
  { name: 'Buenos Aires', state: null, country: 'AR', lat: -34.6037, lon: -58.3816, displayName: 'Buenos Aires, AR' },
  { name: 'Lima', state: null, country: 'PE', lat: -12.0464, lon: -77.0428, displayName: 'Lima, PE' },
  { name: 'Bogotá', state: null, country: 'CO', lat: 4.7110, lon: -74.0721, displayName: 'Bogotá, CO' },
  { name: 'Santiago', state: null, country: 'CL', lat: -33.4489, lon: -70.6693, displayName: 'Santiago, CL' },
  { name: 'Caracas', state: null, country: 'VE', lat: 10.4806, lon: -66.9036, displayName: 'Caracas, VE' },
  
  // Oceania
  { name: 'Sydney', state: 'NSW', country: 'AU', lat: -33.8688, lon: 151.2093, displayName: 'Sydney, NSW, AU' },
  { name: 'Melbourne', state: 'VIC', country: 'AU', lat: -37.8136, lon: 144.9631, displayName: 'Melbourne, VIC, AU' },
  { name: 'Brisbane', state: 'QLD', country: 'AU', lat: -27.4698, lon: 153.0251, displayName: 'Brisbane, QLD, AU' },
  { name: 'Auckland', state: null, country: 'NZ', lat: -36.8485, lon: 174.7633, displayName: 'Auckland, NZ' },
  { name: 'Wellington', state: null, country: 'NZ', lat: -41.2865, lon: 174.7762, displayName: 'Wellington, NZ' }
];

// Generate mock weather data for a specific city
const getMockWeatherForCity = (cityName: string): WeatherData => {
  const lowerCityName = cityName.toLowerCase();
  const now = new Date();
  
  // Base data that will be modified based on city
  const baseData = {
    location: cityName,
    temperature: 22 + (Math.random() * 10 - 5),
    feelsLike: 23 + (Math.random() * 10 - 5),
    humidity: 50 + Math.round(Math.random() * 40),
    pressure: 1010 + Math.round(Math.random() * 20 - 10),
    windSpeed: 2 + Math.random() * 8,
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    description: ['clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'shower rain', 'rain', 'thunderstorm', 'mist'][Math.floor(Math.random() * 8)],
    icon: ['01d', '02d', '03d', '04d', '09d', '10d', '11d', '50d'][Math.floor(Math.random() * 8)],
    sunrise: new Date(now.setHours(6, Math.floor(Math.random() * 30), 0)),
    sunset: new Date(now.setHours(18, 30 + Math.floor(Math.random() * 30), 0)),
  };
  
  // Northern cold climates
  if (lowerCityName.includes('moscow') || lowerCityName.includes('stockholm') || 
      lowerCityName.includes('helsinki') || lowerCityName.includes('oslo')) {
    return {
      ...baseData,
      temperature: 5 + (Math.random() * 10 - 5),
      feelsLike: 3 + (Math.random() * 10 - 5),
      description: ['light snow', 'snow', 'mist', 'fog', 'overcast clouds'][Math.floor(Math.random() * 5)],
      icon: ['13d', '13d', '50d', '50d', '04d'][Math.floor(Math.random() * 5)],
    };
  }
  
  // European cities
  else if (lowerCityName.includes('london')) {
    return {
      ...baseData,
      temperature: 12 + (Math.random() * 8 - 4),
      feelsLike: 11 + (Math.random() * 8 - 4),
      description: 'light rain',
      icon: '10d',
      humidity: 70 + Math.round(Math.random() * 20),
    };
  }
  else if (lowerCityName.includes('paris')) {
    return {
      ...baseData,
      temperature: 15 + (Math.random() * 8 - 4),
      feelsLike: 14 + (Math.random() * 8 - 4),
      description: ['broken clouds', 'scattered clouds', 'light rain'][Math.floor(Math.random() * 3)],
      icon: ['04d', '03d', '10d'][Math.floor(Math.random() * 3)],
    };
  }
  else if (lowerCityName.includes('madrid') || lowerCityName.includes('rome') || lowerCityName.includes('athens')) {
    return {
      ...baseData,
      temperature: 25 + (Math.random() * 8 - 4),
      feelsLike: 24 + (Math.random() * 8 - 4),
      description: 'clear sky',
      icon: '01d',
      humidity: 40 + Math.round(Math.random() * 20),
    };
  }
  // Asian tropical cities
  else if (lowerCityName.includes('bangkok') || lowerCityName.includes('manila') || 
           lowerCityName.includes('jakarta') || lowerCityName.includes('singapore')) {
    return {
      ...baseData,
      temperature: 32 + (Math.random() * 6 - 3),
      feelsLike: 36 + (Math.random() * 6 - 3),
      humidity: 75 + Math.round(Math.random() * 15),
      description: ['scattered clouds', 'broken clouds', 'shower rain', 'thunderstorm'][Math.floor(Math.random() * 4)],
      icon: ['03d', '04d', '09d', '11d'][Math.floor(Math.random() * 4)],
    };
  }
  // Asian East cities
  else if (lowerCityName.includes('tokyo')) {
    return {
      ...baseData,
      temperature: 25 + (Math.random() * 8 - 4),
      feelsLike: 26 + (Math.random() * 8 - 4),
      description: 'scattered clouds',
      icon: '03d',
    };
  }
  else if (lowerCityName.includes('beijing') || lowerCityName.includes('shanghai')) {
    return {
      ...baseData,
      temperature: 20 + (Math.random() * 10 - 5),
      feelsLike: 19 + (Math.random() * 10 - 5),
      description: ['haze', 'mist', 'fog', 'scattered clouds'][Math.floor(Math.random() * 4)],
      icon: ['50d', '50d', '50d', '03d'][Math.floor(Math.random() * 4)],
      humidity: 60 + Math.round(Math.random() * 20),
    };
  }
  // Indian cities
  else if (lowerCityName.includes('mumbai')) {
    return {
      ...baseData,
      temperature: 30 + (Math.random() * 6 - 3),
      feelsLike: 32 + (Math.random() * 6 - 3),
      humidity: 70 + Math.round(Math.random() * 20),
      description: 'haze',
      icon: '50d',
    };
  }
  else if (lowerCityName.includes('delhi')) {
    return {
      ...baseData,
      temperature: 33 + (Math.random() * 8 - 4),
      feelsLike: 35 + (Math.random() * 8 - 4),
      humidity: 50 + Math.round(Math.random() * 20),
      description: ['haze', 'dust', 'smoke', 'clear sky'][Math.floor(Math.random() * 4)],
      icon: ['50d', '50d', '50d', '01d'][Math.floor(Math.random() * 4)],
    };
  }
  else if (lowerCityName.includes('bangalore')) {
    return {
      ...baseData,
      temperature: 26 + (Math.random() * 4 - 2),
      feelsLike: 27 + (Math.random() * 4 - 2),
      humidity: 60 + Math.round(Math.random() * 20),
      description: 'scattered clouds',
      icon: '03d',
    };
  }
  // Middle Eastern cities
  else if (lowerCityName.includes('dubai') || lowerCityName.includes('riyadh')) {
    return {
      ...baseData,
      temperature: 38 + (Math.random() * 8 - 4),
      feelsLike: 40 + (Math.random() * 8 - 4),
      humidity: 30 + Math.round(Math.random() * 20),
      description: 'clear sky',
      icon: '01d',
    };
  }
  // Australian cities
  else if (lowerCityName.includes('sydney')) {
    return {
      ...baseData,
      temperature: 20 + (Math.random() * 8 - 4),
      feelsLike: 21 + (Math.random() * 8 - 4),
      description: 'few clouds',
      icon: '02d',
    };
  }
  // African cities
  else if (lowerCityName.includes('cairo')) {
    return {
      ...baseData,
      temperature: 32 + (Math.random() * 8 - 4),
      feelsLike: 34 + (Math.random() * 8 - 4),
      humidity: 30 + Math.round(Math.random() * 20),
      description: 'clear sky',
      icon: '01d',
    };
  }
  else if (lowerCityName.includes('lagos') || lowerCityName.includes('nairobi')) {
    return {
      ...baseData,
      temperature: 28 + (Math.random() * 6 - 3),
      feelsLike: 30 + (Math.random() * 6 - 3),
      humidity: 65 + Math.round(Math.random() * 20),
      description: ['scattered clouds', 'shower rain', 'thunderstorm'][Math.floor(Math.random() * 3)],
      icon: ['03d', '09d', '11d'][Math.floor(Math.random() * 3)],
    };
  }
  // South American Cities
  else if (lowerCityName.includes('rio') || lowerCityName.includes('são paulo')) {
    return {
      ...baseData,
      temperature: 27 + (Math.random() * 6 - 3),
      feelsLike: 29 + (Math.random() * 6 - 3),
      humidity: 70 + Math.round(Math.random() * 15),
      description: ['scattered clouds', 'broken clouds', 'light rain'][Math.floor(Math.random() * 3)],
      icon: ['03d', '04d', '10d'][Math.floor(Math.random() * 3)],
    };
  }
  else if (lowerCityName.includes('buenos aires')) {
    return {
      ...baseData,
      temperature: 23 + (Math.random() * 6 - 3),
      feelsLike: 24 + (Math.random() * 6 - 3),
      description: 'few clouds',
      icon: '02d',
    };
  }
  // North American cities
  else if (lowerCityName.includes('new york')) {
    return {
      ...baseData,
      temperature: 18 + (Math.random() * 10 - 5),
      feelsLike: 17 + (Math.random() * 10 - 5),
      description: ['clear sky', 'few clouds', 'broken clouds'][Math.floor(Math.random() * 3)],
      icon: ['01d', '02d', '04d'][Math.floor(Math.random() * 3)],
    };
  }
  else if (lowerCityName.includes('los angeles')) {
    return {
      ...baseData,
      temperature: 24 + (Math.random() * 6 - 3),
      feelsLike: 23 + (Math.random() * 6 - 3),
      humidity: 40 + Math.round(Math.random() * 20),
      description: 'clear sky',
      icon: '01d',
    };
  }
  
  return baseData;
};

// Get weather data for location
export const fetchWeatherData = async (
  lat: number, 
  lon: number, 
  searchQuery?: string
): Promise<WeatherData> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    
    if (searchQuery) {
      return getMockWeatherForCity(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return getMockWeatherForCity(city.displayName);
  }
  
  try {
    let locationKey = '';
    let locationName = '';

    // Step 1: Search for location by query or coordinates
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        const location = searchResponse.data[0];
        locationKey = location.Key;
        locationName = location.LocalizedName + 
          (location.AdministrativeArea ? `, ${location.AdministrativeArea.ID}` : '') + 
          (location.Country ? `, ${location.Country.ID}` : '');
      } catch (geoError) {
        console.error('Location search error:', geoError);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return getMockWeatherForCity(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
        locationName = geoResponse.data.LocalizedName + 
          (geoResponse.data.AdministrativeArea ? `, ${geoResponse.data.AdministrativeArea.ID}` : '') + 
          (geoResponse.data.Country ? `, ${geoResponse.data.Country.ID}` : '');
      } catch (geoError) {
        console.error('Geoposition search error:', geoError);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return getMockWeatherForCity('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get current conditions
    const currentResponse = await axios.get(buildApiUrl(`${CURRENT_CONDITIONS_URL}/${locationKey}`), {
      params: {
        apikey: API_KEY,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = currentResponse.data[0];
    
    // Step 3: Get location details for sunrise/sunset
    const locationResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/${locationKey}`), {
      params: {
        apikey: API_KEY,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    // Default sunrise/sunset times in case the API doesn't provide them
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 0, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(18, 0, 0, 0);
    
    return {
      location: locationName,
      temperature: data.Temperature.Metric.Value,
      feelsLike: data.RealFeelTemperature.Metric.Value,
      humidity: data.RelativeHumidity,
      pressure: data.Pressure.Metric.Value,
      windSpeed: data.Wind.Speed.Metric.Value,
      windDirection: data.Wind.Direction.English,
      description: data.WeatherText,
      icon: data.WeatherIcon.toString().padStart(2, '0'),
      sunrise: sunrise,
      sunset: sunset
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback weather data in development mode');
      return getMockWeatherForCity(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching weather data');
  }
};

// Get forecast for a specific city with mock data
const getMockForecastForCity = (cityName: string): ForecastDay[] => {
  const forecast: ForecastDay[] = [];
  const lowerCityName = cityName.toLowerCase();
  
  // Default weather patterns
  let weatherPatterns = [
    { description: 'clear sky', icon: '01d', chance: 0.3 },
    { description: 'few clouds', icon: '02d', chance: 0.3 },
    { description: 'scattered clouds', icon: '03d', chance: 0.2 },
    { description: 'broken clouds', icon: '04d', chance: 0.1 },
    { description: 'shower rain', icon: '09d', chance: 0.05 },
    { description: 'rain', icon: '10d', chance: 0.05 }
  ];
  
  // Generate temperature ranges based on city
  let baseTemp = 22; // Default base temperature
  let range = 5;     // Default temperature range
  let humidity = 60; // Default humidity
  let humidityRange = 20; // Default humidity range
  let windBase = 3;  // Default wind base
  let windRange = 5; // Default wind range
  
  // Northern cold climates
  if (lowerCityName.includes('moscow') || lowerCityName.includes('stockholm') || 
      lowerCityName.includes('helsinki') || lowerCityName.includes('oslo')) {
    weatherPatterns = [
      { description: 'light snow', icon: '13d', chance: 0.3 },
      { description: 'snow', icon: '13d', chance: 0.2 },
      { description: 'mist', icon: '50d', chance: 0.2 },
      { description: 'fog', icon: '50d', chance: 0.1 },
      { description: 'overcast clouds', icon: '04d', chance: 0.2 }
    ];
    baseTemp = 5;
    range = 7;
    humidity = 70;
    windBase = 4;
  }
  // European cities
  else if (lowerCityName.includes('london')) {
    weatherPatterns = [
      { description: 'light rain', icon: '10d', chance: 0.4 },
      { description: 'broken clouds', icon: '04d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.2 },
      { description: 'overcast clouds', icon: '04d', chance: 0.1 }
    ];
    baseTemp = 12;
    range = 4;
    humidity = 75;
  }
  else if (lowerCityName.includes('paris')) {
    weatherPatterns = [
      { description: 'broken clouds', icon: '04d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.3 },
      { description: 'light rain', icon: '10d', chance: 0.3 },
      { description: 'clear sky', icon: '01d', chance: 0.1 }
    ];
    baseTemp = 15;
    range = 5;
    humidity = 65;
  }
  else if (lowerCityName.includes('madrid') || lowerCityName.includes('rome') || lowerCityName.includes('athens')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.6 },
      { description: 'few clouds', icon: '02d', chance: 0.3 },
      { description: 'light rain', icon: '10d', chance: 0.1 }
    ];
    baseTemp = 25;
    range = 5;
    humidity = 40;
    humidityRange = 15;
  }
  // Asian tropical cities
  else if (lowerCityName.includes('bangkok') || lowerCityName.includes('manila') || 
           lowerCityName.includes('jakarta') || lowerCityName.includes('singapore')) {
    weatherPatterns = [
      { description: 'scattered clouds', icon: '03d', chance: 0.2 },
      { description: 'broken clouds', icon: '04d', chance: 0.2 },
      { description: 'shower rain', icon: '09d', chance: 0.3 },
      { description: 'thunderstorm', icon: '11d', chance: 0.3 }
    ];
    baseTemp = 32;
    range = 3;
    humidity = 80;
    humidityRange = 10;
    windBase = 2;
  }
  // Asian East cities
  else if (lowerCityName.includes('tokyo')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.4 },
      { description: 'broken clouds', icon: '04d', chance: 0.2 },
      { description: 'light rain', icon: '10d', chance: 0.1 }
    ];
    baseTemp = 25;
    range = 4;
    humidity = 60;
  }
  else if (lowerCityName.includes('beijing') || lowerCityName.includes('shanghai')) {
    weatherPatterns = [
      { description: 'haze', icon: '50d', chance: 0.3 },
      { description: 'mist', icon: '50d', chance: 0.2 },
      { description: 'fog', icon: '50d', chance: 0.2 },
      { description: 'scattered clouds', icon: '03d', chance: 0.2 },
      { description: 'clear sky', icon: '01d', chance: 0.1 }
    ];
    baseTemp = 20;
    range = 6;
    humidity = 65;
  }
  // Indian cities
  else if (lowerCityName.includes('mumbai')) {
    weatherPatterns = [
      { description: 'haze', icon: '50d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.3 },
      { description: 'broken clouds', icon: '04d', chance: 0.2 },
      { description: 'shower rain', icon: '09d', chance: 0.2 }
    ];
    baseTemp = 30;
    range = 3;
    humidity = 75;
    humidityRange = 15;
  }
  else if (lowerCityName.includes('delhi')) {
    weatherPatterns = [
      { description: 'haze', icon: '50d', chance: 0.3 },
      { description: 'dust', icon: '50d', chance: 0.2 },
      { description: 'smoke', icon: '50d', chance: 0.1 },
      { description: 'clear sky', icon: '01d', chance: 0.4 }
    ];
    baseTemp = 33;
    range = 6;
    humidity = 50;
    humidityRange = 20;
  }
  else if (lowerCityName.includes('bangalore')) {
    weatherPatterns = [
      { description: 'scattered clouds', icon: '03d', chance: 0.4 },
      { description: 'few clouds', icon: '02d', chance: 0.3 },
      { description: 'clear sky', icon: '01d', chance: 0.2 },
      { description: 'light rain', icon: '10d', chance: 0.1 }
    ];
    baseTemp = 26;
    range = 3;
    humidity = 60;
  }
  // Middle Eastern cities
  else if (lowerCityName.includes('dubai') || lowerCityName.includes('riyadh')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.8 },
      { description: 'few clouds', icon: '02d', chance: 0.1 },
      { description: 'dust', icon: '50d', chance: 0.1 }
    ];
    baseTemp = 38;
    range = 5;
    humidity = 30;
    humidityRange = 15;
    windBase = 4;
  }
  // Australian cities
  else if (lowerCityName.includes('sydney') || lowerCityName.includes('melbourne')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.3 },
      { description: 'few clouds', icon: '02d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.2 },
      { description: 'light rain', icon: '10d', chance: 0.2 }
    ];
    baseTemp = 20;
    range = 5;
    humidity = 60;
    windBase = 4;
  }
  // African cities
  else if (lowerCityName.includes('cairo')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.7 },
      { description: 'few clouds', icon: '02d', chance: 0.2 },
      { description: 'haze', icon: '50d', chance: 0.1 }
    ];
    baseTemp = 32;
    range = 5;
    humidity = 30;
    humidityRange = 15;
    windBase = 5;
  }
  else if (lowerCityName.includes('lagos') || lowerCityName.includes('nairobi')) {
    weatherPatterns = [
      { description: 'scattered clouds', icon: '03d', chance: 0.3 },
      { description: 'shower rain', icon: '09d', chance: 0.3 },
      { description: 'thunderstorm', icon: '11d', chance: 0.3 },
      { description: 'broken clouds', icon: '04d', chance: 0.1 }
    ];
    baseTemp = 28;
    range = 4;
    humidity = 70;
    humidityRange = 15;
  }
  // South American Cities
  else if (lowerCityName.includes('rio') || lowerCityName.includes('são paulo')) {
    weatherPatterns = [
      { description: 'scattered clouds', icon: '03d', chance: 0.3 },
      { description: 'broken clouds', icon: '04d', chance: 0.3 },
      { description: 'light rain', icon: '10d', chance: 0.3 },
      { description: 'clear sky', icon: '01d', chance: 0.1 }
    ];
    baseTemp = 27;
    range = 4;
    humidity = 70;
    humidityRange = 15;
  }
  else if (lowerCityName.includes('buenos aires')) {
    weatherPatterns = [
      { description: 'few clouds', icon: '02d', chance: 0.4 },
      { description: 'clear sky', icon: '01d', chance: 0.3 },
      { description: 'scattered clouds', icon: '03d', chance: 0.2 },
      { description: 'light rain', icon: '10d', chance: 0.1 }
    ];
    baseTemp = 23;
    range = 5;
    humidity = 65;
  }
  // North American cities
  else if (lowerCityName.includes('new york')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.3 },
      { description: 'few clouds', icon: '02d', chance: 0.3 },
      { description: 'broken clouds', icon: '04d', chance: 0.2 },
      { description: 'light rain', icon: '10d', chance: 0.2 }
    ];
    baseTemp = 18;
    range = 6;
    humidity = 60;
    windBase = 4;
  }
  else if (lowerCityName.includes('los angeles')) {
    weatherPatterns = [
      { description: 'clear sky', icon: '01d', chance: 0.6 },
      { description: 'few clouds', icon: '02d', chance: 0.3 },
      { description: 'haze', icon: '50d', chance: 0.1 }
    ];
    baseTemp = 24;
    range = 4;
    humidity = 40;
    humidityRange = 15;
    windBase = 2;
  }
  
  const today = new Date();
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    // Randomly select weather pattern based on chances
    const rand = Math.random();
    let cumulativeChance = 0;
    let selectedPattern = weatherPatterns[0];
    
    for (const pattern of weatherPatterns) {
      cumulativeChance += pattern.chance;
      if (rand <= cumulativeChance) {
        selectedPattern = pattern;
        break;
      }
    }
    
    const dayTemp = baseTemp + (Math.random() * range * 2 - range);
    
    forecast.push({
      date,
      minTemp: dayTemp - (1 + Math.random() * 2),
      maxTemp: dayTemp + (1 + Math.random() * 2),
      description: selectedPattern.description,
      icon: selectedPattern.icon,
      precipitation: Math.round(Math.random() * 100),
      humidity: humidity + Math.round(Math.random() * humidityRange - humidityRange/2),
      windSpeed: windBase + Math.round(Math.random() * windRange * 10) / 10,
    });
  }
  
  return forecast;
};

// Get forecast for location
export const fetchForecast = async (
  lat: number, 
  lon: number,
  searchQuery?: string
): Promise<ForecastDay[]> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (searchQuery) {
      return getMockForecastForCity(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return getMockForecastForCity(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return getMockForecastForCity(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return getMockForecastForCity('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get 5-day forecast
    const forecastResponse = await axios.get(buildApiUrl(`${FORECASTS_URL}/daily/5day/${locationKey}`), {
      params: {
        apikey: API_KEY,
        metric: true,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Process forecast data
    const forecast: ForecastDay[] = forecastResponse.data.DailyForecasts.map((day: any) => {
      return {
        date: new Date(day.Date),
        minTemp: day.Temperature.Minimum.Value,
        maxTemp: day.Temperature.Maximum.Value,
        description: day.Day.IconPhrase,
        icon: day.Day.Icon.toString().padStart(2, '0'),
        precipitation: day.Day.PrecipitationProbability,
        humidity: day.Day.RelativeHumidity || 50, // fallback value
        windSpeed: day.Day.Wind.Speed.Value
      };
    });
    
    return forecast;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback forecast data in development mode');
      return getMockForecastForCity(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching forecast data');
  }
};

// Search for city autocomplete suggestions
export const searchCities = async (query: string): Promise<any[]> => {
  if (!query || query.length < 2) return [];
  
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
    
    // Filter mock cities based on query
    const lowerQuery = query.toLowerCase();
    return MOCK_CITIES
      .filter(city => 
        city.name.toLowerCase().includes(lowerQuery) || 
        (city.state && city.state.toLowerCase().includes(lowerQuery)) ||
        city.country.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 5);
  }
  
  try {
    const response = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/autocomplete`), {
      params: {
        q: query,
        apikey: API_KEY
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    return response.data.map((city: any) => ({
      name: city.LocalizedName,
      state: city.AdministrativeArea ? city.AdministrativeArea.ID : null,
      country: city.Country ? city.Country.ID : null,
      lat: city.GeoPosition ? city.GeoPosition.Latitude : 0,
      lon: city.GeoPosition ? city.GeoPosition.Longitude : 0,
      key: city.Key,
      displayName: `${city.LocalizedName}${city.AdministrativeArea ? `, ${city.AdministrativeArea.ID}` : ''}${city.Country ? `, ${city.Country.ID}` : ''}`
    }));
  } catch (error) {
    console.error('Error searching cities:', error);
    
    // Return filtered mock cities on error
    if (IS_DEV) {
      console.log('Using mock city data for search');
      const lowerQuery = query.toLowerCase();
      return MOCK_CITIES
        .filter(city => 
          city.name.toLowerCase().includes(lowerQuery) || 
          (city.state && city.state.toLowerCase().includes(lowerQuery)) ||
          city.country.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5);
    }
    
    return [];
  }
};

// Generate mock hourly forecast data
const generateMockHourlyForecast = (cityName: string): HourlyForecast[] => {
  const hourlyForecast: HourlyForecast[] = [];
  const lowerCityName = cityName.toLowerCase();
  const now = new Date();
  
  // Default settings
  let baseTemp = 22;
  let tempRangeDay = 4;
  let cloudiness = 30;
  let precipChance = 20;
  let humidityBase = 60;
  let windSpeedBase = 3;
  
  // Adjust settings based on city
  if (lowerCityName.includes('london')) {
    baseTemp = 14;
    cloudiness = 70;
    precipChance = 40;
    humidityBase = 75;
  } else if (lowerCityName.includes('dubai') || lowerCityName.includes('cairo')) {
    baseTemp = 35;
    cloudiness = 10;
    precipChance = 5;
    humidityBase = 30;
  } else if (lowerCityName.includes('singapore') || lowerCityName.includes('bangkok')) {
    baseTemp = 32;
    cloudiness = 50;
    precipChance = 60;
    humidityBase = 80;
  }
  
  // Generate 24 hours of forecast
  for (let i = 0; i < 24; i++) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() + i);
    
    // Temperature varies by time of day
    const hourOfDay = hour.getHours();
    let tempAdjustment = 0;
    
    // Temperature peaks around 2pm, coolest at 5am
    if (hourOfDay >= 10 && hourOfDay <= 16) {
      tempAdjustment = tempRangeDay * (1 - Math.abs(14 - hourOfDay) / 4);
    } else if (hourOfDay < 6) {
      tempAdjustment = -tempRangeDay * (1 - Math.abs(5 - hourOfDay) / 5);
    }
    
    const temp = baseTemp + tempAdjustment + (Math.random() * 2 - 1);
    
    // Precipitation chance varies by time (higher in afternoon)
    const hourPrecipChance = precipChance + 
      (hourOfDay >= 13 && hourOfDay <= 18 ? 20 : 0) + 
      (Math.random() * 20 - 10);
    
    // Weather condition and icon
    let description = 'clear sky';
    let icon = '01d';
    let precipType = null;
    
    if (hourPrecipChance > 70) {
      description = 'shower rain';
      icon = '09d';
      precipType = 'Rain';
    } else if (hourPrecipChance > 50) {
      description = 'light rain';
      icon = '10d';
      precipType = 'Rain';
    } else if (cloudiness > 70) {
      description = 'broken clouds';
      icon = '04d';
    } else if (cloudiness > 40) {
      description = 'scattered clouds';
      icon = '03d';
    } else if (cloudiness > 20) {
      description = 'few clouds';
      icon = '02d';
    }
    
    // Day/night icon adjustment
    if (hourOfDay < 6 || hourOfDay > 18) {
      icon = icon.replace('d', 'n');
    }
    
    // UV Index - higher in midday
    let uvIndex = 0;
    if (hourOfDay >= 10 && hourOfDay <= 16) {
      uvIndex = Math.min(10, Math.round((10 - cloudiness/10) * (1 - Math.abs(13 - hourOfDay) / 3)));
    } else if (hourOfDay >= 7 && hourOfDay <= 19) {
      uvIndex = Math.max(0, Math.round((6 - cloudiness/15) * (1 - Math.abs(13 - hourOfDay) / 6)));
    }
    
    hourlyForecast.push({
      dateTime: hour,
      temperature: temp,
      feelsLike: temp + (humidityBase > 70 ? 2 : 0) - (windSpeedBase > 5 ? 1 : 0),
      description,
      icon,
      precipitation: Math.round(hourPrecipChance),
      precipitationType: precipType,
      humidity: humidityBase + Math.round(Math.random() * 10 - 5),
      windSpeed: windSpeedBase + Math.round(Math.random() * 20) / 10,
      windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
      cloudCover: cloudiness + Math.round(Math.random() * 20 - 10),
      uvIndex
    });
  }
  
  return hourlyForecast;
};

// Fetch hourly forecast data for a location
export const fetchHourlyForecast = async (
  lat: number,
  lon: number,
  searchQuery?: string
): Promise<HourlyForecast[]> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
    
    if (searchQuery) {
      return generateMockHourlyForecast(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return generateMockHourlyForecast(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockHourlyForecast(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockHourlyForecast('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get 12-hour forecast
    const hourlyResponse = await axios.get(buildApiUrl(`${FORECASTS_URL}/hourly/12hour/${locationKey}`), {
      params: {
        apikey: API_KEY,
        metric: true,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Process forecast data
    const hourlyForecast: HourlyForecast[] = hourlyResponse.data.map((hour: any) => {
      return {
        dateTime: new Date(hour.DateTime),
        temperature: hour.Temperature.Value,
        feelsLike: hour.RealFeelTemperature.Value,
        description: hour.IconPhrase,
        icon: hour.WeatherIcon.toString().padStart(2, '0'),
        precipitation: hour.PrecipitationProbability,
        precipitationType: hour.HasPrecipitation ? hour.PrecipitationType : null,
        humidity: hour.RelativeHumidity || 50, // fallback
        windSpeed: hour.Wind.Speed.Value,
        windDirection: hour.Wind.Direction.English,
        cloudCover: hour.CloudCover,
        uvIndex: hour.UVIndex
      };
    });
    
    return hourlyForecast;
  } catch (error) {
    console.error('Error fetching hourly forecast data:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback hourly forecast data in development mode');
      return generateMockHourlyForecast(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching hourly forecast data');
  }
};

// Generate mock weather alerts for testing
const generateMockWeatherAlerts = (cityName: string): WeatherAlert[] => {
  // Return no alerts most of the time (70%)
  if (Math.random() > 0.3) {
    return [];
  }
  
  const lowerCityName = cityName.toLowerCase();
  const alerts: WeatherAlert[] = [];
  const now = new Date();
  
  // Potential alert types based on region/city
  let possibleAlerts: {type: string, headline: string, description: string, sevMin: number, sevMax: number}[] = [];
  
  // Add general alerts for all regions
  possibleAlerts.push(
    {
      type: 'Heat Advisory',
      headline: 'Heat Advisory in effect',
      description: 'The National Weather Service has issued a Heat Advisory for your area. Temperatures are expected to reach dangerous levels. Stay hydrated and avoid prolonged exposure to the sun.',
      sevMin: 2,
      sevMax: 3
    },
    {
      type: 'Severe Thunderstorm Warning',
      headline: 'Severe Thunderstorm Warning issued',
      description: 'The National Weather Service has issued a Severe Thunderstorm Warning. Strong winds, heavy rain, and dangerous lightning are possible. Seek shelter in a sturdy building.',
      sevMin: 3,
      sevMax: 4
    }
  );
  
  // Region-specific alerts
  if (lowerCityName.includes('miami') || lowerCityName.includes('orleans') || 
      lowerCityName.includes('houston') || lowerCityName.includes('tampa')) {
    possibleAlerts.push({
      type: 'Tropical Storm Watch',
      headline: 'Tropical Storm Watch issued for coastal areas',
      description: 'A Tropical Storm Watch has been issued for coastal areas. Preparations should be made for strong winds and heavy rainfall. Monitor local news for updates.',
      sevMin: 2,
      sevMax: 3
    });
    
    if (Math.random() > 0.7) {
      possibleAlerts.push({
        type: 'Hurricane Warning',
        headline: 'Hurricane Warning - Immediate action required',
        description: 'A Hurricane Warning is in effect. Dangerous winds and storm surge expected. Evacuate if instructed by local officials. Secure property and prepare emergency supplies.',
        sevMin: 4,
        sevMax: 5
      });
    }
  }
  
  if (lowerCityName.includes('angeles') || lowerCityName.includes('diego') || 
      lowerCityName.includes('francisco') || lowerCityName.includes('phoenix')) {
    possibleAlerts.push({
      type: 'Excessive Heat Warning',
      headline: 'Excessive Heat Warning - Extreme temperatures expected',
      description: 'An Excessive Heat Warning is in effect. Dangerously hot conditions with temperatures up to 110°F. Take extra precautions if working outside. Check on vulnerable individuals.',
      sevMin: 3,
      sevMax: 4
    });
    
    if (Math.random() > 0.5) {
      possibleAlerts.push({
        type: 'Fire Weather Watch',
        headline: 'Fire Weather Watch - Critical fire conditions',
        description: 'A Fire Weather Watch has been issued for your area due to strong winds, low humidity, and dry conditions. Avoid outdoor burning and report any fires immediately.',
        sevMin: 3,
        sevMax: 4
      });
    }
  }
  
  if (lowerCityName.includes('chicago') || lowerCityName.includes('minneapolis') || 
      lowerCityName.includes('detroit') || lowerCityName.includes('boston')) {
    possibleAlerts.push({
      type: 'Winter Storm Warning',
      headline: 'Winter Storm Warning - Heavy snow and ice expected',
      description: 'A Winter Storm Warning is in effect. Heavy snow accumulation of 6-12 inches expected. Travel will be difficult to impossible. Prepare for power outages.',
      sevMin: 3,
      sevMax: 4
    });
    
    if (Math.random() > 0.6) {
      possibleAlerts.push({
        type: 'Wind Chill Advisory',
        headline: 'Wind Chill Advisory - Dangerous cold',
        description: 'A Wind Chill Advisory is in effect. Very cold wind chills expected. Frostbite and hypothermia possible with prolonged exposure. Wear appropriate clothing.',
        sevMin: 2,
        sevMax: 3
      });
    }
  }
  
  // Choose 1-2 random alerts from the possible alerts
  const numAlerts = Math.floor(Math.random() * 2) + 1;
  const selectedAlertIndices = new Set<number>();
  
  while (selectedAlertIndices.size < numAlerts && selectedAlertIndices.size < possibleAlerts.length) {
    const index = Math.floor(Math.random() * possibleAlerts.length);
    selectedAlertIndices.add(index);
  }
  
  selectedAlertIndices.forEach(index => {
    const alert = possibleAlerts[index];
    const severity = Math.floor(Math.random() * (alert.sevMax - alert.sevMin + 1)) + alert.sevMin;
    
    // Random duration from 6 hours to 3 days
    const durationHours = Math.floor(Math.random() * 66) + 6;
    const startOffset = Math.floor(Math.random() * 12); // Start within 12 hours
    
    const startDate = new Date(now);
    startDate.setHours(startDate.getHours() + startOffset);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + durationHours);
    
    alerts.push({
      alertType: alert.type,
      severity,
      headline: alert.headline,
      description: alert.description,
      startDate,
      endDate,
      areas: [cityName.split(',')[0]]
    });
  });
  
  return alerts;
};

// Fetch weather alerts for a location
export const fetchWeatherAlerts = async (
  lat: number,
  lon: number,
  searchQuery?: string
): Promise<WeatherAlert[]> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (searchQuery) {
      return generateMockWeatherAlerts(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return generateMockWeatherAlerts(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockWeatherAlerts(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockWeatherAlerts('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get alerts
    const alertsResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/${locationKey}/alerts`), {
      params: {
        apikey: API_KEY,
        details: true,
        language: 'en-us'
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Process alerts data
    const alerts: WeatherAlert[] = alertsResponse.data.map((alert: any) => {
      return {
        alertType: alert.AlertType,
        severity: alert.Severity,
        headline: alert.Headline,
        description: alert.Description,
        startDate: new Date(alert.StartDate),
        endDate: new Date(alert.EndDate),
        areas: alert.Area ? [alert.Area] : []
      };
    });
    
    return alerts;
  } catch (error) {
    console.error('Error fetching weather alerts:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback weather alerts data in development mode');
      return generateMockWeatherAlerts(searchQuery || 'New York');
    }
    
    return []; // Return empty array on error for production - alerts are non-critical
  }
};

// Generate mock air quality data
const generateMockAirQuality = (cityName: string): AirQuality => {
  const lowerCityName = cityName.toLowerCase();
  const now = new Date();
  
  // Default air quality - moderate
  let aqiBase = 50;
  let primaryPollutant = 'PM2.5';
  
  // Adjust based on city
  if (lowerCityName.includes('beijing') || lowerCityName.includes('delhi') || 
      lowerCityName.includes('seoul') || lowerCityName.includes('shanghai')) {
    // Poor AQI for these cities
    aqiBase = 120 + Math.floor(Math.random() * 60);
    primaryPollutant = Math.random() > 0.5 ? 'PM2.5' : 'PM10';
  } else if (lowerCityName.includes('angeles') || lowerCityName.includes('mexico') || 
             lowerCityName.includes('bangkok') || lowerCityName.includes('cairo')) {
    // Moderate to poor
    aqiBase = 80 + Math.floor(Math.random() * 40);
    primaryPollutant = Math.random() > 0.3 ? 'O3' : 'PM2.5';
  } else if (lowerCityName.includes('zurich') || lowerCityName.includes('vancouver') || 
             lowerCityName.includes('stockholm') || lowerCityName.includes('auckland')) {
    // Good
    aqiBase = 20 + Math.floor(Math.random() * 20);
    primaryPollutant = Math.random() > 0.5 ? 'NO2' : 'O3';
  }
  
  // Generate AQI with some randomness
  const aqi = Math.min(500, Math.max(0, aqiBase + Math.floor(Math.random() * 20) - 10));
  
  // Determine category based on AQI
  let category = '';
  let generalRecommendation = '';
  let sensitiveRecommendation = '';
  
  if (aqi <= 50) {
    category = 'Good';
    generalRecommendation = 'Air quality is satisfactory, and air pollution poses little or no risk.';
    sensitiveRecommendation = 'None';
  } else if (aqi <= 100) {
    category = 'Moderate';
    generalRecommendation = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
    sensitiveRecommendation = 'Unusually sensitive people should consider reducing prolonged or heavy exertion.';
  } else if (aqi <= 150) {
    category = 'Unhealthy for Sensitive Groups';
    generalRecommendation = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should limit prolonged outdoor exertion.';
  } else if (aqi <= 200) {
    category = 'Unhealthy';
    generalRecommendation = 'Everyone may begin to experience health effects. Members of sensitive groups may experience more serious health effects.';
    sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should avoid prolonged outdoor exertion. Everyone else should limit prolonged outdoor exertion.';
  } else if (aqi <= 300) {
    category = 'Very Unhealthy';
    generalRecommendation = 'Health alert: The risk of health effects is increased for everyone.';
    sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should avoid outdoor activity. Everyone else should avoid prolonged outdoor exertion.';
  } else {
    category = 'Hazardous';
    generalRecommendation = 'Health warning of emergency conditions: everyone is more likely to be affected.';
    sensitiveRecommendation = 'Everyone should avoid all outdoor physical activity.';
  }
  
  // Generate pollutants data
  const pollutants: any = {
    'PM2.5': {
      name: 'Fine Particulate Matter',
      value: primaryPollutant === 'PM2.5' ? aqi * 0.8 : 15 + Math.random() * 20,
      category: 'Moderate',
      categoryIndex: 2
    },
    'PM10': {
      name: 'Coarse Particulate Matter',
      value: primaryPollutant === 'PM10' ? aqi * 0.8 : 20 + Math.random() * 30,
      category: 'Good',
      categoryIndex: 1
    },
    'O3': {
      name: 'Ozone',
      value: primaryPollutant === 'O3' ? aqi * 0.8 : 15 + Math.random() * 25,
      category: 'Good',
      categoryIndex: 1
    },
    'NO2': {
      name: 'Nitrogen Dioxide',
      value: primaryPollutant === 'NO2' ? aqi * 0.8 : 10 + Math.random() * 15,
      category: 'Good',
      categoryIndex: 1
    },
    'SO2': {
      name: 'Sulfur Dioxide',
      value: 5 + Math.random() * 10,
      category: 'Good',
      categoryIndex: 1
    },
    'CO': {
      name: 'Carbon Monoxide',
      value: 0.5 + Math.random() * 0.5,
      category: 'Good',
      categoryIndex: 1
    }
  };
  
  // Update categories for pollutants based on their values
  for (const key in pollutants) {
    const pollutant = pollutants[key];
    
    if (pollutant.value <= 50) {
      pollutant.category = 'Good';
      pollutant.categoryIndex = 1;
    } else if (pollutant.value <= 100) {
      pollutant.category = 'Moderate';
      pollutant.categoryIndex = 2;
    } else if (pollutant.value <= 150) {
      pollutant.category = 'Unhealthy for Sensitive Groups';
      pollutant.categoryIndex = 3;
    } else if (pollutant.value <= 200) {
      pollutant.category = 'Unhealthy';
      pollutant.categoryIndex = 4;
    } else if (pollutant.value <= 300) {
      pollutant.category = 'Very Unhealthy';
      pollutant.categoryIndex = 5;
    } else {
      pollutant.category = 'Hazardous';
      pollutant.categoryIndex = 6;
    }
  }
  
  return {
    date: now,
    index: aqi,
    category,
    primaryPollutant,
    pollutants,
    healthRecommendations: {
      general: generalRecommendation,
      sensitive: sensitiveRecommendation
    }
  };
};

// Fetch air quality for a location
export const fetchAirQuality = async (
  lat: number,
  lon: number,
  searchQuery?: string
): Promise<AirQuality> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (searchQuery) {
      return generateMockAirQuality(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return generateMockAirQuality(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockAirQuality(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockAirQuality('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get air quality data
    const airQualityResponse = await axios.get(buildApiUrl(`${AIR_QUALITY_URL}/city/${locationKey}`), {
      params: {
        apikey: API_KEY
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = airQualityResponse.data;
    
    // Generate health recommendations based on AQI
    let generalRecommendation = '';
    let sensitiveRecommendation = '';
    const aqi = data.Index || 0;
    
    if (aqi <= 50) {
      generalRecommendation = 'Air quality is satisfactory, and air pollution poses little or no risk.';
      sensitiveRecommendation = 'None';
    } else if (aqi <= 100) {
      generalRecommendation = 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
      sensitiveRecommendation = 'Unusually sensitive people should consider reducing prolonged or heavy exertion.';
    } else if (aqi <= 150) {
      generalRecommendation = 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
      sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should limit prolonged outdoor exertion.';
    } else if (aqi <= 200) {
      generalRecommendation = 'Everyone may begin to experience health effects. Members of sensitive groups may experience more serious health effects.';
      sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should avoid prolonged outdoor exertion. Everyone else should limit prolonged outdoor exertion.';
    } else if (aqi <= 300) {
      generalRecommendation = 'Health alert: The risk of health effects is increased for everyone.';
      sensitiveRecommendation = 'People with respiratory or heart conditions, children and older adults should avoid outdoor activity. Everyone else should avoid prolonged outdoor exertion.';
    } else {
      generalRecommendation = 'Health warning of emergency conditions: everyone is more likely to be affected.';
      sensitiveRecommendation = 'Everyone should avoid all outdoor physical activity.';
    }
    
    // Process pollutants data
    const pollutants: any = {};
    if (data.Pollutants) {
      data.Pollutants.forEach((pollutant: any) => {
        pollutants[pollutant.Name] = {
          name: pollutant.LocalizedName,
          value: pollutant.Value,
          category: pollutant.Category,
          categoryIndex: pollutant.CategoryValue
        };
      });
    }
    
    return {
      date: new Date(data.LocalObservationDateTime || new Date()),
      index: data.Index || 0,
      category: data.Category || 'Unknown',
      primaryPollutant: data.PrimaryPollutant || 'Unknown',
      pollutants,
      healthRecommendations: {
        general: generalRecommendation,
        sensitive: sensitiveRecommendation
      }
    };
  } catch (error) {
    console.error('Error fetching air quality data:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback air quality data in development mode');
      return generateMockAirQuality(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching air quality data');
  }
};

// Define common index types for mock data
const COMMON_INDICES = [
  {
    id: 1,
    name: 'UV Index',
    type: 'uv',
    getCategory: (value: number) => {
      if (value <= 2) return { cat: 'Low', val: 1 };
      if (value <= 5) return { cat: 'Moderate', val: 2 };
      if (value <= 7) return { cat: 'High', val: 3 };
      if (value <= 10) return { cat: 'Very High', val: 4 };
      return { cat: 'Extreme', val: 5 };
    },
    getText: (value: number) => {
      if (value <= 2) return 'Low risk of harm from unprotected sun exposure.';
      if (value <= 5) return 'Moderate risk of harm from unprotected sun exposure. Wear sunscreen and protective clothing.';
      if (value <= 7) return 'High risk of harm from unprotected sun exposure. Apply SPF 30+ sunscreen every 2 hours.';
      if (value <= 10) return 'Very high risk of harm from unprotected sun exposure. Minimize sun exposure between 10 AM and 4 PM.';
      return 'Extreme risk of harm from unprotected sun exposure. Avoid sun exposure between 10 AM and 4 PM.';
    }
  },
  {
    id: 2,
    name: 'Pollen Count',
    type: 'pollen',
    getCategory: (value: number) => {
      if (value <= 2.4) return { cat: 'Low', val: 1 };
      if (value <= 4.9) return { cat: 'Low-Medium', val: 2 };
      if (value <= 7.4) return { cat: 'Medium', val: 3 };
      if (value <= 9.9) return { cat: 'Medium-High', val: 4 };
      return { cat: 'High', val: 5 };
    },
    getText: (value: number) => {
      if (value <= 2.4) return 'Pollen levels are low. Most people will not experience allergy symptoms.';
      if (value <= 4.9) return 'Pollen levels are low to medium. Some individuals with allergies may experience symptoms.';
      if (value <= 7.4) return 'Pollen levels are medium. Many individuals with allergies will experience symptoms.';
      if (value <= 9.9) return 'Pollen levels are medium to high. Most individuals with allergies will experience symptoms.';
      return 'Pollen levels are high. Almost all individuals with allergies will experience symptoms.';
    }
  },
  {
    id: 3,
    name: 'Mosquito Activity',
    type: 'mosquito',
    getCategory: (value: number) => {
      if (value <= 2) return { cat: 'Low', val: 1 };
      if (value <= 5) return { cat: 'Moderate', val: 2 };
      if (value <= 8) return { cat: 'High', val: 3 };
      return { cat: 'Very High', val: 4 };
    },
    getText: (value: number) => {
      if (value <= 2) return 'Low mosquito activity expected. Basic precautions recommended.';
      if (value <= 5) return 'Moderate mosquito activity expected. Use insect repellent when outdoors.';
      if (value <= 8) return 'High mosquito activity expected. Use insect repellent and wear long sleeves when outdoors.';
      return 'Very high mosquito activity expected. Avoid outdoor activities at dawn and dusk. Use strong insect repellent.';
    }
  },
  {
    id: 4,
    name: 'Outdoor Activities',
    type: 'outdoor',
    getCategory: (value: number) => {
      if (value <= 2) return { cat: 'Poor', val: 1 };
      if (value <= 5) return { cat: 'Fair', val: 2 };
      if (value <= 8) return { cat: 'Good', val: 3 };
      return { cat: 'Excellent', val: 4 };
    },
    getText: (value: number) => {
      if (value <= 2) return 'Poor conditions for outdoor activities. Consider indoor alternatives.';
      if (value <= 5) return 'Fair conditions for outdoor activities. Check weather before heading out.';
      if (value <= 8) return 'Good conditions for outdoor activities. Enjoy your time outside.';
      return 'Excellent conditions for outdoor activities. Perfect day to be outside.';
    }
  },
  {
    id: 5,
    name: 'Running',
    type: 'running',
    getCategory: (value: number) => {
      if (value <= 2) return { cat: 'Poor', val: 1 };
      if (value <= 5) return { cat: 'Fair', val: 2 };
      if (value <= 8) return { cat: 'Good', val: 3 };
      return { cat: 'Excellent', val: 4 };
    },
    getText: (value: number) => {
      if (value <= 2) return 'Poor conditions for running. Consider indoor exercise.';
      if (value <= 5) return 'Fair conditions for running. Stay hydrated and be aware of changing conditions.';
      if (value <= 8) return 'Good conditions for running. Enjoy your run.';
      return 'Excellent conditions for running. Perfect day for setting personal records.';
    }
  }
];

// Generate mock weather indices
const generateMockWeatherIndices = (cityName: string): WeatherIndex[] => {
  const lowerCityName = cityName.toLowerCase();
  const indices: WeatherIndex[] = [];
  
  // Adjust base values based on city
  let uvBase = 5; // Moderate UV
  let pollenBase = 5; // Medium pollen
  let mosquitoBase = 4; // Moderate mosquito activity
  let outdoorBase = 7; // Good for outdoor activities
  let runningBase = 6; // Good for running
  
  // Adjust values based on city patterns
  if (lowerCityName.includes('dubai') || lowerCityName.includes('phoenix') || 
      lowerCityName.includes('cairo')) {
    // Hot desert cities
    uvBase = 9; // Very high UV
    pollenBase = 3; // Low-Medium pollen
    mosquitoBase = 2; // Low mosquito activity
    outdoorBase = 4; // Fair for outdoor (hot)
    runningBase = 3; // Fair for running (hot)
  } else if (lowerCityName.includes('seattle') || lowerCityName.includes('london') || 
             lowerCityName.includes('vancouver')) {
    // Rainy cities
    uvBase = 3; // Low UV
    pollenBase = 4; // Low-Medium pollen
    mosquitoBase = 5; // Moderate mosquito activity
    outdoorBase = 5; // Fair for outdoor (wet)
    runningBase = 5; // Fair for running (wet)
  } else if (lowerCityName.includes('singapore') || lowerCityName.includes('bangkok') || 
             lowerCityName.includes('miami')) {
    // Tropical cities
    uvBase = 8; // High UV
    pollenBase = 7; // Medium-High pollen
    mosquitoBase = 8; // High mosquito activity
    outdoorBase = 6; // Good for outdoor (humid)
    runningBase = 4; // Fair for running (humid)
  } else if (lowerCityName.includes('san francisco') || lowerCityName.includes('sydney') || 
             lowerCityName.includes('cape town')) {
    // Coastal temperate cities
    uvBase = 6; // Moderate-High UV
    pollenBase = 6; // Medium pollen
    mosquitoBase = 4; // Moderate mosquito activity
    outdoorBase = 9; // Excellent for outdoor
    runningBase = 9; // Excellent for running
  }
  
  // Generate indices with some randomness
  COMMON_INDICES.forEach(indexDef => {
    let baseValue = 5; // Default value
    
    switch (indexDef.type) {
      case 'uv':
        baseValue = uvBase;
        break;
      case 'pollen':
        baseValue = pollenBase;
        break;
      case 'mosquito':
        baseValue = mosquitoBase;
        break;
      case 'outdoor':
        baseValue = outdoorBase;
        break;
      case 'running':
        baseValue = runningBase;
        break;
    }
    
    // Add randomness but keep within bounds
    const value = Math.max(0, Math.min(10, baseValue + (Math.random() * 2 - 1)));
    const { cat, val } = indexDef.getCategory(value);
    
    indices.push({
      id: indexDef.id,
      name: indexDef.name,
      type: indexDef.type,
      value,
      category: cat,
      categoryValue: val,
      text: indexDef.getText(value)
    });
  });
  
  return indices;
};

// Fetch weather indices for a location
export const fetchWeatherIndices = async (
  lat: number,
  lon: number,
  searchQuery?: string
): Promise<WeatherIndex[]> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (searchQuery) {
      return generateMockWeatherIndices(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return generateMockWeatherIndices(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockWeatherIndices(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockWeatherIndices('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get indices
    const indicesResponse = await axios.get(buildApiUrl(`${INDICES_URL}/1day/${locationKey}`), {
      params: {
        apikey: API_KEY,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Process indices data
    const indices: WeatherIndex[] = indicesResponse.data.map((index: any) => {
      return {
        id: index.ID,
        name: index.Name,
        type: index.Type,
        value: index.Value,
        category: index.Category,
        categoryValue: index.CategoryValue,
        text: index.Text
      };
    });
    
    return indices;
  } catch (error) {
    console.error('Error fetching weather indices:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback weather indices data in development mode');
      return generateMockWeatherIndices(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching weather indices');
  }
};

// Generate mock astronomic data (sun and moon)
const generateMockAstronomicData = (cityName: string): AstronomicData => {
  const lowerCityName = cityName.toLowerCase();
  const now = new Date();
  
  // Default values - adjust based on season and latitude
  let sunriseHour = 6;
  let sunriseMinute = 30;
  let sunsetHour = 18;
  let sunsetMinute = 30;
  
  // Find mock city to get latitude
  const city = MOCK_CITIES.find(c => c.displayName.toLowerCase().includes(lowerCityName)) || MOCK_CITIES[0];
  const lat = city ? city.lat : 40; // Default to New York's latitude
  
  // Adjust based on latitude and month (very simplified model)
  const month = now.getMonth();
  const isNorthernHemisphere = lat >= 0;
  
  // Summer months for Northern Hemisphere: May-Aug (4-7)
  // Winter months for Northern Hemisphere: Nov-Feb (10-1)
  const isSummerInNorth = month >= 4 && month <= 7;
  const isWinterInNorth = month >= 10 || month <= 1;
  
  // For Northern Hemisphere
  if (isNorthernHemisphere) {
    if (isSummerInNorth) {
      // Earlier sunrise, later sunset in summer
      sunriseHour = 5 + Math.floor(Math.random() * 2);
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 20 + Math.floor(Math.random() * 2);
      sunsetMinute = Math.floor(Math.random() * 60);
    } else if (isWinterInNorth) {
      // Later sunrise, earlier sunset in winter
      sunriseHour = 7 + Math.floor(Math.random() * 2);
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 16 + Math.floor(Math.random() * 2);
      sunsetMinute = Math.floor(Math.random() * 60);
    }
  } 
  // For Southern Hemisphere - reversed seasons
  else {
    if (isWinterInNorth) { // Summer in south
      sunriseHour = 5 + Math.floor(Math.random() * 2);
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 20 + Math.floor(Math.random() * 2);
      sunsetMinute = Math.floor(Math.random() * 60);
    } else if (isSummerInNorth) { // Winter in south
      sunriseHour = 7 + Math.floor(Math.random() * 2);
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 16 + Math.floor(Math.random() * 2);
      sunsetMinute = Math.floor(Math.random() * 60);
    }
  }
  
  // Latitude extremes
  if (Math.abs(lat) > 60) {
    // Near-polar regions have extreme daylight variations
    if ((isNorthernHemisphere && isSummerInNorth) || (!isNorthernHemisphere && isWinterInNorth)) {
      // Nearly 24 hours of daylight
      sunriseHour = 3;
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 23;
      sunsetMinute = Math.floor(Math.random() * 60);
    } else if ((isNorthernHemisphere && isWinterInNorth) || (!isNorthernHemisphere && isSummerInNorth)) {
      // Very short daylight period
      sunriseHour = 10;
      sunriseMinute = Math.floor(Math.random() * 60);
      sunsetHour = 14;
      sunsetMinute = Math.floor(Math.random() * 60);
    }
  }
  
  // Create sunrise and sunset dates
  const sunrise = new Date(now);
  sunrise.setHours(sunriseHour, sunriseMinute, 0, 0);
  
  const sunset = new Date(now);
  sunset.setHours(sunsetHour, sunsetMinute, 0, 0);
  
  // Calculate hours of sun
  let hoursOfSun = sunsetHour - sunriseHour;
  if (sunsetMinute < sunriseMinute) {
    hoursOfSun -= (sunriseMinute - sunsetMinute) / 60;
  } else {
    hoursOfSun += (sunsetMinute - sunriseMinute) / 60;
  }
  
  // Moon phase (0-29.5 age, 0-100% illumination)
  const moonAge = Math.random() * 29.5;
  let moonPhase = '';
  let moonPhaseCode = 0;
  let moonIllumination = 0;
  
  if (moonAge < 1) {
    moonPhase = 'New Moon';
    moonPhaseCode = 0;
    moonIllumination = 0;
  } else if (moonAge < 7.4) {
    moonPhase = 'Waxing Crescent';
    moonPhaseCode = 1;
    moonIllumination = (moonAge / 7.4) * 50;
  } else if (moonAge < 8.4) {
    moonPhase = 'First Quarter';
    moonPhaseCode = 2;
    moonIllumination = 50;
  } else if (moonAge < 14.8) {
    moonPhase = 'Waxing Gibbous';
    moonPhaseCode = 3;
    moonIllumination = 50 + ((moonAge - 7.4) / 7.4) * 50;
  } else if (moonAge < 15.8) {
    moonPhase = 'Full Moon';
    moonPhaseCode = 4;
    moonIllumination = 100;
  } else if (moonAge < 22.1) {
    moonPhase = 'Waning Gibbous';
    moonPhaseCode = 5;
    moonIllumination = 100 - ((moonAge - 15.8) / 6.3) * 50;
  } else if (moonAge < 23.1) {
    moonPhase = 'Last Quarter';
    moonPhaseCode = 6;
    moonIllumination = 50;
  } else {
    moonPhase = 'Waning Crescent';
    moonPhaseCode = 7;
    moonIllumination = ((29.5 - moonAge) / 6.4) * 50;
  }
  
  // Moon rise and set are roughly opposite to sun, but with phase offsets
  // This is a very simplified approximation
  let moonRiseHour, moonSetHour;
  
  if (moonPhaseCode === 0) { // New Moon
    moonRiseHour = sunriseHour;
    moonSetHour = sunsetHour;
  } else if (moonPhaseCode === 4) { // Full Moon
    moonRiseHour = sunsetHour;
    moonSetHour = sunriseHour;
  } else if (moonPhaseCode < 4) { // Waxing
    moonRiseHour = (sunriseHour + moonPhaseCode * 3) % 24;
    moonSetHour = (sunsetHour + moonPhaseCode * 3) % 24;
  } else { // Waning
    moonRiseHour = (sunsetHour - (moonPhaseCode - 4) * 3 + 24) % 24;
    moonSetHour = (sunriseHour - (moonPhaseCode - 4) * 3 + 24) % 24;
  }
  
  const moonRise = new Date(now);
  moonRise.setHours(moonRiseHour, Math.floor(Math.random() * 60), 0, 0);
  
  const moonSet = new Date(now);
  moonSet.setHours(moonSetHour, Math.floor(Math.random() * 60), 0, 0);
  
  return {
    date: now,
    sun: {
      rise: sunrise,
      set: sunset,
      hoursOfSun
    },
    moon: {
      rise: moonRise,
      set: moonSet,
      phase: moonPhase,
      phaseCode: moonPhaseCode,
      age: moonAge,
      illumination: moonIllumination
    }
  };
};

// Fetch astronomic data for a location
export const fetchAstronomicData = async (
  lat: number,
  lon: number,
  searchQuery?: string
): Promise<AstronomicData> => {
  // If mock data is enabled or in development mode with USE_MOCK_DATA set to true
  if (USE_MOCK_DATA || (IS_DEV && process.env.REACT_APP_USE_MOCK_DATA === 'true')) {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
    
    if (searchQuery) {
      return generateMockAstronomicData(searchQuery);
    }
    
    // Find a city close to these coordinates
    const city = MOCK_CITIES.find(c => 
      Math.abs(c.lat - lat) < 1 && Math.abs(c.lon - lon) < 1
    ) || MOCK_CITIES[0];
    
    return generateMockAstronomicData(city.displayName);
  }
  
  try {
    let locationKey = '';

    // Step 1: Search for location
    if (searchQuery) {
      try {
        // Search by text
        const searchResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/cities/search`), {
          params: {
            q: searchQuery,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (searchResponse.data.length === 0) {
          throw new Error(`Location "${searchQuery}" not found`);
        }

        locationKey = searchResponse.data[0].Key;
      } catch (error) {
        console.error('Location search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockAstronomicData(searchQuery);
        }
        
        throw new Error(`Could not find location: ${searchQuery}`);
      }
    } else {
      // Search by coordinates
      try {
        const geoResponse = await axios.get(buildApiUrl(`${LOCATIONS_URL}/geoposition/search`), {
          params: {
            q: `${lat},${lon}`,
            apikey: API_KEY
          },
          headers: {
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        locationKey = geoResponse.data.Key;
      } catch (error) {
        console.error('Geoposition search error:', error);
        
        if (USE_MOCK_DATA || IS_DEV) {
          return generateMockAstronomicData('New York');
        }
        
        throw new Error('Could not find location from coordinates');
      }
    }

    // Step 2: Get astronomical data
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const astronomicalResponse = await axios.get(buildApiUrl(`${FORECASTS_URL}/daily/1day/${locationKey}`), {
      params: {
        apikey: API_KEY,
        details: true
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = astronomicalResponse.data.DailyForecasts[0];
    
    // Moon phase mapping (AccuWeather uses 0-7 scale)
    const moonPhases = [
      'New Moon',
      'Waxing Crescent',
      'First Quarter',
      'Waxing Gibbous',
      'Full Moon',
      'Waning Gibbous',
      'Last Quarter',
      'Waning Crescent'
    ];
    
    // Get the current day's hours of sun
    const hoursOfSun = data.HoursOfSun || 12; // Fallback to 12 if not provided
    
    // Parse sun times
    const sunRise = data.Sun && data.Sun.Rise ? new Date(data.Sun.Rise) : new Date(today.setHours(6, 0, 0, 0));
    const sunSet = data.Sun && data.Sun.Set ? new Date(data.Sun.Set) : new Date(today.setHours(18, 0, 0, 0));
    
    // Parse moon times and phase
    const moonRise = data.Moon && data.Moon.Rise ? new Date(data.Moon.Rise) : null;
    const moonSet = data.Moon && data.Moon.Set ? new Date(data.Moon.Set) : null;
    const moonPhaseCode = data.Moon && data.Moon.Phase !== undefined ? data.Moon.Phase : 0;
    const moonPhase = moonPhases[moonPhaseCode];
    const moonAge = data.Moon && data.Moon.Age !== undefined ? data.Moon.Age : 0;
    
    // Calculate moon illumination based on phase and age
    let moonIllumination = 0;
    if (moonPhaseCode === 0) {
      moonIllumination = 0;
    } else if (moonPhaseCode === 4) {
      moonIllumination = 100;
    } else if (moonPhaseCode < 4) {
      // Waxing: 0-100%
      moonIllumination = moonPhaseCode < 2 ? moonPhaseCode * 50 : 50 + (moonPhaseCode - 2) * 50;
    } else {
      // Waning: 100-0%
      moonIllumination = 100 - ((moonPhaseCode - 4) * 33);
    }
    
    return {
      date: today,
      sun: {
        rise: sunRise,
        set: sunSet,
        hoursOfSun
      },
      moon: {
        rise: moonRise,
        set: moonSet,
        phase: moonPhase,
        phaseCode: moonPhaseCode,
        age: moonAge,
        illumination: moonIllumination
      }
    };
  } catch (error) {
    console.error('Error fetching astronomical data:', error);
    
    // In development mode or if mock data is enabled, return mock data
    if (USE_MOCK_DATA || IS_DEV) {
      console.log('Using fallback astronomical data in development mode');
      return generateMockAstronomicData(searchQuery || 'New York');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Error fetching astronomical data');
  }
}; 