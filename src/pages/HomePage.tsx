import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
          Explore the Skies with Orbivue
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Track satellites, monitor weather conditions, and visualize radio signals all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/satellite-tracker"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Launch Satellite Tracker
          </Link>
          <Link
            to="/weather"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
          >
            View Weather Data
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
          <div className="mb-4 bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Real-time Satellite Tracking</h3>
          <p className="text-gray-600 dark:text-gray-300">
            View and track satellites in orbit around Earth with accurate positioning data from NORAD.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
          <div className="mb-4 bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Local Weather Information</h3>
          <p className="text-gray-600 dark:text-gray-300">
            Get up-to-date weather forecasts and conditions for your current location or any place worldwide.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center text-center">
          <div className="mb-4 bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
            <svg className="h-8 w-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Radio Signal Visualization</h3>
          <p className="text-gray-600 dark:text-gray-300">
            View and analyze radio signals and data transmitted from satellites as they pass overhead.
          </p>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg p-8 shadow-lg text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to explore the skies?</h2>
        <p className="text-lg mb-6 max-w-2xl mx-auto">
          Start tracking satellites, checking weather conditions, and visualizing radio signals with Orbivue.
        </p>
        <Link
          to="/satellite-tracker"
          className="px-6 py-3 bg-white text-primary-700 hover:bg-gray-100 font-medium rounded-lg transition-colors inline-block"
        >
          Get Started Now
        </Link>
      </section>
    </div>
  );
};

export default HomePage; 