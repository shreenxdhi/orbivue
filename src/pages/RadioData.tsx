import React, { useState, useEffect, useRef } from 'react';
import { fetchRadioData, RadioFrequency, SatelliteSignal } from '../services/radioService';

const RadioData: React.FC = () => {
  const [satellites, setSatellites] = useState<SatelliteSignal[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [spectrumMode, setSpectrumMode] = useState<'waterfall' | 'line'>('waterfall');
  const [frequencies, setFrequencies] = useState<RadioFrequency[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectrogramInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch initial satellite radio data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchRadioData();
        setSatellites(data);
        
        // Set first satellite as selected by default
        if (data.length > 0 && !selectedSatellite) {
          setSelectedSatellite(data[0].id);
          setFrequencies(data[0].frequencies);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error loading radio data. Please try again.');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle satellite selection change
  const handleSelectSatellite = (satelliteId: string) => {
    const satellite = satellites.find(sat => sat.id === satelliteId);
    if (satellite) {
      setSelectedSatellite(satelliteId);
      setFrequencies(satellite.frequencies);
      
      // Reset the waterfall display
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    }
  };

  // Draw the spectrum visualization (waterfall or line graph)
  useEffect(() => {
    if (!canvasRef.current || !selectedSatellite) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear any existing timer
    if (spectrogramInterval.current) {
      clearInterval(spectrogramInterval.current);
    }
    
    // For the waterfall display
    let yPos = 0;
    const drawWaterfall = () => {
      if (!ctx || !canvas) return;
      
      // Shift existing content down
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 1);
      
      // Draw new line at the top
      for (let x = 0; x < canvas.width; x++) {
        // Each x position corresponds to a frequency in our range
        const normalized = x / canvas.width;
        
        // Generate a "signal" value between 0-1
        // In a real app, this would be actual signal data
        let signalStrength = 0;
        
        // Find peaks around certain frequencies based on our data
        frequencies.forEach(freq => {
          // Convert frequency to a position on our x-axis
          const freqPos = (freq.frequency - 137.0) / 10; // Example range: 137-147 MHz
          
          // Add a peak for each frequency with some noise
          const distance = Math.abs(normalized - freqPos);
          if (distance < 0.05) {
            const peak = 1 - distance * 20;
            signalStrength = Math.max(signalStrength, peak);
          }
        });
        
        // Add some noise
        signalStrength += Math.random() * 0.1;
        signalStrength = Math.min(1, signalStrength);
        
        // Map signal strength to a color (blue-green-yellow-red)
        let color;
        if (signalStrength < 0.25) {
          color = `rgb(0, 0, ${Math.round(255 * signalStrength * 4)})`;
        } else if (signalStrength < 0.5) {
          color = `rgb(0, ${Math.round(255 * (signalStrength - 0.25) * 4)}, 255)`;
        } else if (signalStrength < 0.75) {
          color = `rgb(${Math.round(255 * (signalStrength - 0.5) * 4)}, 255, ${Math.round(255 - 255 * (signalStrength - 0.5) * 4)})`;
        } else {
          color = `rgb(255, ${Math.round(255 - 255 * (signalStrength - 0.75) * 4)}, 0)`;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, 0, 1, 1);
      }
    };
    
    // For the line graph display
    const drawLineGraph = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw x and y axes
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 30);
      ctx.lineTo(canvas.width, canvas.height - 30);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, canvas.height - 30);
      ctx.stroke();
      
      // Draw frequency labels
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      for (let i = 0; i <= 10; i++) {
        const x = i * canvas.width / 10;
        const freq = 137 + i;
        ctx.fillText(`${freq} MHz`, x, canvas.height - 15);
      }
      
      // Draw the spectrum line
      ctx.strokeStyle = '#00a8ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let x = 0; x < canvas.width; x++) {
        const normalized = x / canvas.width;
        let signalStrength = 0;
        
        // Similar logic as waterfall but for a line graph
        frequencies.forEach(freq => {
          const freqPos = (freq.frequency - 137.0) / 10;
          const distance = Math.abs(normalized - freqPos);
          if (distance < 0.05) {
            const peak = 1 - distance * 20;
            signalStrength = Math.max(signalStrength, peak);
          }
        });
        
        // Add noise for realism
        signalStrength += Math.random() * 0.1;
        signalStrength = Math.min(1, signalStrength);
        
        // Map to y position (inverted, so stronger signals go up)
        const y = (canvas.height - 30) - signalStrength * (canvas.height - 40);
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
    };
    
    // Start the visualization
    if (spectrumMode === 'waterfall') {
      // Draw initial waterfall
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set up the interval to update the waterfall
      spectrogramInterval.current = setInterval(drawWaterfall, 100);
    } else {
      // Draw the line graph and update it periodically
      spectrogramInterval.current = setInterval(drawLineGraph, 100);
    }
    
    // Clean up on unmount
    return () => {
      if (spectrogramInterval.current) {
        clearInterval(spectrogramInterval.current);
      }
    };
  }, [selectedSatellite, spectrumMode, frequencies]);

  // Toggle recording state
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would start/stop recording the signal data
  };

  // Format frequency label
  const formatFrequency = (freq: number) => {
    return `${freq.toFixed(3)} MHz`;
  };

  return (
    <div className="flex flex-col space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Satellite Radio Data
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          View and analyze radio signals from satellites as they pass overhead.
        </p>

        {error && <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-3 rounded-lg mb-4">{error}</div>}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6">
            {/* Satellite selection sidebar */}
            <div className="md:w-1/4 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Satellites</h2>
              <div className="space-y-2">
                {satellites.map((satellite) => (
                  <div
                    key={satellite.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSatellite === satellite.id
                        ? 'bg-primary-100 dark:bg-primary-900 border border-primary-500'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    onClick={() => handleSelectSatellite(satellite.id)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">{satellite.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {satellite.frequencies.length} tracked {satellite.frequencies.length === 1 ? 'frequency' : 'frequencies'}
                    </div>
                    {satellite.isActive && (
                      <div className="mt-1 flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-green-600 dark:text-green-400">Transmitting</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Main content area */}
            <div className="md:w-3/4 space-y-4">
              {selectedSatellite ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {satellites.find(s => s.id === selectedSatellite)?.name} Radio Signals
                    </h2>
                    <div className="flex items-center space-x-3">
                      <div className="flex rounded-lg overflow-hidden">
                        <button
                          onClick={() => setSpectrumMode('waterfall')}
                          className={`px-3 py-1 text-sm ${
                            spectrumMode === 'waterfall'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Waterfall
                        </button>
                        <button
                          onClick={() => setSpectrumMode('line')}
                          className={`px-3 py-1 text-sm ${
                            spectrumMode === 'line'
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          Spectrum
                        </button>
                      </div>
                      <button
                        onClick={toggleRecording}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium ${
                          isRecording
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-600'}`}></span>
                        <span>{isRecording ? 'Recording...' : 'Record'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Spectrum/waterfall display */}
                  <div className="relative bg-black rounded-lg overflow-hidden" style={{ height: '300px' }}>
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={300}
                      className="w-full h-full"
                    ></canvas>
                    
                    {/* Frequency hover labels would go here in a full implementation */}
                  </div>

                  {/* Frequencies table */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Tracked Frequencies</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</th>
                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Modulation</th>
                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Signal Type</th>
                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {frequencies.map((freq, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{formatFrequency(freq.frequency)}</td>
                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{freq.modulation}</td>
                              <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">{freq.type}</td>
                              <td className="py-2 px-4 text-sm">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  freq.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                  {freq.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">Select a satellite to view radio data</p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default RadioData; 