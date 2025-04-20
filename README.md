# Orbivue

Orbivue is a feature-rich cross-platform web application for tracking satellites, visualizing weather data, and displaying live radio signals from satellites.

## Features

- **Real-time Satellite Tracking**: Track and visualize satellites in orbit around Earth with accurate positioning data from NORAD.
- **Weather Information**: Get current weather and forecasts for your location or any place worldwide.
- **Radio Signal Analysis**: View and analyze radio signals and data from satellites.
- **Customization**: Set your preferred location, track favorite satellites, and configure API keys.
- **Responsive Design**: Works seamlessly across desktop, tablet, and mobile devices.
- **Dark/Light Mode**: Choose your preferred visual theme.

## Technologies Used

- **Frontend**:
  - React
  - TypeScript
  - Tailwind CSS
  - Leaflet (for maps)
  - Three.js (for 3D visualizations)
  - Satellite.js (for orbital calculations)

- **Data Sources**:
  - Satellite TLE data from N2YO or CelesTrak
  - Weather data from OpenWeatherMap
  - Radio signal data from amateur radio APIs

## Getting Started

### Prerequisites

- Node.js (>= 14.x)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/orbivue.git
   cd orbivue
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API keys:
   ```
   REACT_APP_N2YO_API_KEY=your_n2yo_api_key
   REACT_APP_OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Satellite Tracker**: Navigate to the Satellite Tracker page to view satellites currently orbiting Earth. Filter by visibility and click on a satellite for detailed information.

2. **Weather Viewer**: Check the current weather and forecast for your location. Search for other locations to view their weather data.

3. **Radio Data**: Visualize and analyze radio signals from satellites using the waterfall display or spectrum analyzer.

4. **Settings**: Configure your API keys, set your preferred location, and customize application settings.

## Deployment

To build the application for production:

```bash
npm run build
```

The build files will be created in the `build` folder, ready to be deployed to any static site hosting service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Satellite data provided by NORAD
- Weather data from OpenWeatherMap
- Radio signal data from various amateur radio sources

## Author

Shreenidhi Vasishta 