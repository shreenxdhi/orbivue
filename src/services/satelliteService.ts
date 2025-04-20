import { twoline2satrec, propagate, gstime, eciToGeodetic } from 'satellite.js';

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

// Some common satellite TLEs (Two Line Elements)
const satelliteTLEs = [
  {
    name: 'ISS (ZARYA)',
    noradId: '25544',
    tle1: '1 25544U 98067A   23135.56602164  .00011943  00000+0  21731-3 0  9990',
    tle2: '2 25544  51.6412 139.8584 0005939  99.5777  22.5867 15.50422536396622',
  },
  {
    name: 'HUBBLE',
    noradId: '20580',
    tle1: '1 20580U 90037B   23135.59702084  .00001047  00000+0  57648-4 0  9998',
    tle2: '2 20580  28.4698  49.9784 0002983 151.9235 208.1888 15.09757481280530',
  },
  {
    name: 'NOAA 19',
    noradId: '33591',
    tle1: '1 33591U 09005A   23135.62881757  .00000185  00000+0  12992-3 0  9991',
    tle2: '2 33591  99.1772  90.1232 0014038  64.8196 295.4420 14.12638143736515',
  },
  {
    name: 'STARLINK-1832',
    noradId: '48232',
    tle1: '1 48232U 21021F   23135.56248697  .00008234  00000+0  45795-3 0  9994',
    tle2: '2 48232  53.0545  34.9888 0001361  82.3002 277.8132 15.06457568118080',
  },
  {
    name: 'METEOR-M 2',
    noradId: '40069',
    tle1: '1 40069U 14037A   23135.62113429  .00000063  00000+0  47250-4 0  9992',
    tle2: '2 40069  98.5818  62.5093 0005173 155.1681 204.9752 14.20710431461200',
  },
  {
    name: 'TERRA',
    noradId: '25994',
    tle1: '1 25994U 99068A   23135.55900412  .00000040  00000+0  27398-4 0  9992',
    tle2: '2 25994  98.1710  86.9662 0001433  83.9917 276.1433 14.57113761241945',
  },
  {
    name: 'SUOMI NPP',
    noradId: '37849',
    tle1: '1 37849U 11061A   23135.61671031  .00000027  00000+0  29939-4 0  9996',
    tle2: '2 37849  98.7134  72.8358 0000853  85.4175 274.7093 14.19552906598661',
  },
  {
    name: 'GOES 16',
    noradId: '41866',
    tle1: '1 41866U 16071A   23135.62499632 -.00000094  00000+0  00000+0 0  9991',
    tle2: '2 41866   0.0484 266.3489 0000574 221.5529 249.1005  1.00269684 24027',
  },
  {
    name: 'LANDSAT 8',
    noradId: '39084',
    tle1: '1 39084U 13008A   23135.55893681  .00000026  00000+0  17800-4 0  9995',
    tle2: '2 39084  98.2301  84.9321 0001409  87.6342 272.4984 14.57111493544323',
  },
  {
    name: 'AQUA',
    noradId: '27424',
    tle1: '1 27424U 02022A   23135.58887214  .00000037  00000+0  25849-4 0  9992',
    tle2: '2 27424  98.2118  86.3760 0001663  89.0988 271.0373 14.57116299111068',
  }
];

// Function to calculate if satellite is visible from a location
// This is a simplified version - a real implementation would consider:
// - Sun position (satellite must be in sunlight)
// - Observer's local time (must be night or twilight)
// - Satellite altitude and angle from observer
const isSatelliteVisible = (
  observerLat: number,
  observerLng: number,
  satelliteLat: number,
  satelliteLng: number,
  satelliteAlt: number
): boolean => {
  // Simple distance calculation
  const distance = Math.sqrt(
    Math.pow(observerLat - satelliteLat, 2) + Math.pow(observerLng - satelliteLng, 2)
  );
  
  // Random factor to simulate different visibility conditions
  const randomFactor = Math.random();
  
  // Higher altitude satellites are more likely to be visible
  const altitudeFactor = satelliteAlt > 500 ? 0.7 : 0.3;
  
  // Combine factors - this is very simplified
  return distance < 40 && randomFactor < altitudeFactor;
};

export const getSatellitePositions = async (
  observerLat: number,
  observerLng: number
): Promise<Satellite[]> => {
  // In a real application, you would fetch this from an API
  // Like N2YO or CelesTrak
  
  const satellites: Satellite[] = [];
  const now = new Date();
  
  // For each satellite in our list
  satelliteTLEs.forEach((satData, index) => {
    try {
      // Parse the TLE data
      const satrec = twoline2satrec(satData.tle1, satData.tle2);
      
      // Get current satellite position
      const positionAndVelocity = propagate(satrec, now);
      
      if (positionAndVelocity && positionAndVelocity.position && positionAndVelocity.velocity) {
        const gmst = gstime(now);
        const position = positionAndVelocity.position;
        const velocity = positionAndVelocity.velocity;

        // Check if position and velocity are actually ECI vectors and not booleans
        if (typeof position === 'object' && typeof velocity === 'object') {
          // Convert the position to geodetic coordinates
          const geodeticCoordinates = eciToGeodetic(position, gmst);
          
          // Convert radians to degrees
          const longitude = geodeticCoordinates.longitude * 180 / Math.PI;
          const latitude = geodeticCoordinates.latitude * 180 / Math.PI;
          
          // Calculate the velocity magnitude in km/s
          const velocityMag = Math.sqrt(
            Math.pow(velocity.x, 2) + 
            Math.pow(velocity.y, 2) + 
            Math.pow(velocity.z, 2)
          );
          
          // Check if the satellite is visible from the observer's location
          const visible = isSatelliteVisible(
            observerLat, 
            observerLng, 
            latitude, 
            longitude, 
            geodeticCoordinates.height
          );
          
          satellites.push({
            id: index + 1,
            name: satData.name,
            latitude,
            longitude,
            altitude: geodeticCoordinates.height,
            velocity: velocityMag,
            visible,
            noradId: satData.noradId
          });
        }
      }
    } catch (error) {
      console.error(`Error calculating position for ${satData.name}:`, error);
    }
  });
  
  return satellites;
};

// Function to get TLE data from an API (to be implemented)
export const fetchSatelliteTLE = async (noradId: string) => {
  // In a real implementation, this would fetch from N2YO, CelesTrak, or another provider
  // Example API endpoint: https://api.n2yo.com/rest/v1/satellite/tle/{noradId}&apiKey={apiKey}
  
  // For now, just return from our static data
  const satellite = satelliteTLEs.find(sat => sat.noradId === noradId);
  return satellite;
};

// Function to get satellite passes for a location (to be implemented)
export const getSatellitePasses = async (
  noradId: string,
  observerLat: number,
  observerLng: number,
  days: number = 7
) => {
  // In a real implementation, this would calculate or fetch upcoming passes
  // Example API: https://api.n2yo.com/rest/v1/satellite/visualpasses/{noradId}/{observerLat}/{observerLng}/0/{days}/&apiKey={apiKey}
  
  // For now, return mock data
  return {
    noradId,
    passes: [
      {
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 3660000),   // 1 hour and 10 minutes from now
        maxElevation: 52.3
      },
      {
        startTime: new Date(Date.now() + 86400000),   // 24 hours from now
        endTime: new Date(Date.now() + 86460000),     // 24 hours and 10 minutes from now
        maxElevation: 67.8
      }
    ]
  };
}; 