// Types for satellite radio data
export interface RadioFrequency {
  frequency: number;  // MHz
  modulation: string; // e.g., "FM", "CW", "BPSK"
  type: string;       // e.g., "Telemetry", "Voice", "Data"
  isActive: boolean;  // Whether the frequency is currently transmitting
}

export interface SatelliteSignal {
  id: string;
  name: string;
  isActive: boolean;
  frequencies: RadioFrequency[];
}

// Mock satellite radio data
const mockSatelliteSignals: SatelliteSignal[] = [
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    isActive: true,
    frequencies: [
      {
        frequency: 145.8,
        modulation: 'FM',
        type: 'Voice',
        isActive: true,
      },
      {
        frequency: 145.825,
        modulation: 'AFSK',
        type: 'Packet',
        isActive: true,
      },
      {
        frequency: 437.55,
        modulation: 'FM',
        type: 'Voice',
        isActive: false,
      },
    ],
  },
  {
    id: 'noaa15',
    name: 'NOAA 15',
    isActive: true,
    frequencies: [
      {
        frequency: 137.62,
        modulation: 'APT',
        type: 'Weather Image',
        isActive: true,
      },
      {
        frequency: 137.35,
        modulation: 'DSB',
        type: 'Data',
        isActive: false,
      },
    ],
  },
  {
    id: 'noaa18',
    name: 'NOAA 18',
    isActive: true,
    frequencies: [
      {
        frequency: 137.9125,
        modulation: 'APT',
        type: 'Weather Image',
        isActive: true,
      },
    ],
  },
  {
    id: 'noaa19',
    name: 'NOAA 19',
    isActive: true,
    frequencies: [
      {
        frequency: 137.1,
        modulation: 'APT',
        type: 'Weather Image',
        isActive: true,
      },
    ],
  },
  {
    id: 'meteor',
    name: 'METEOR-M 2',
    isActive: false,
    frequencies: [
      {
        frequency: 137.1,
        modulation: 'LRPT',
        type: 'Weather Image',
        isActive: false,
      },
    ],
  },
  {
    id: 'ao91',
    name: 'FOX-1B (AO-91)',
    isActive: true,
    frequencies: [
      {
        frequency: 145.96,
        modulation: 'FM',
        type: 'Uplink',
        isActive: true,
      },
      {
        frequency: 435.25,
        modulation: 'FM',
        type: 'Downlink',
        isActive: true,
      },
    ],
  },
  {
    id: 'ao92',
    name: 'FOX-1D (AO-92)',
    isActive: true,
    frequencies: [
      {
        frequency: 435.35,
        modulation: 'FM',
        type: 'Uplink',
        isActive: true,
      },
      {
        frequency: 145.88,
        modulation: 'FM',
        type: 'Downlink',
        isActive: true,
      },
    ],
  },
  {
    id: 'so50',
    name: 'SO-50',
    isActive: true,
    frequencies: [
      {
        frequency: 145.85,
        modulation: 'FM',
        type: 'Uplink',
        isActive: true,
      },
      {
        frequency: 436.795,
        modulation: 'FM',
        type: 'Downlink',
        isActive: true,
      },
    ],
  },
  {
    id: 'po101',
    name: 'PO-101',
    isActive: false,
    frequencies: [
      {
        frequency: 437.405,
        modulation: 'FSK',
        type: 'Telemetry',
        isActive: false,
      },
    ],
  },
  {
    id: 'atl1',
    name: 'ATLAS-1',
    isActive: true,
    frequencies: [
      {
        frequency: 437.175,
        modulation: 'GMSK',
        type: 'Data',
        isActive: true,
      },
    ],
  },
];

/**
 * Fetches radio data for all satellites
 * In a real app, this would connect to SDR hardware or a web service
 */
export const fetchRadioData = async (): Promise<SatelliteSignal[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockSatelliteSignals);
    }, 800);
  });
};

/**
 * Fetches radio data for a specific satellite
 */
export const fetchSatelliteRadioData = async (satelliteId: string): Promise<SatelliteSignal | null> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const satellite = mockSatelliteSignals.find(sat => sat.id === satelliteId);
      resolve(satellite || null);
    }, 500);
  });
};

/**
 * In a real app, this would start recording a given frequency
 */
export const startRecording = async (satelliteId: string, frequency: number): Promise<{ success: boolean; recordingId?: string }> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        recordingId: `rec_${Date.now()}_${satelliteId}_${frequency}`,
      });
    }, 300);
  });
};

/**
 * In a real app, this would stop recording a given frequency
 */
export const stopRecording = async (recordingId: string): Promise<{ success: boolean }> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 300);
  });
};

/**
 * Gets historical recorded data
 */
export const getRecordings = async (satelliteId?: string): Promise<any[]> => {
  // Simulate API call - in a real app, this would return recordings from a database
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 500);
  });
}; 