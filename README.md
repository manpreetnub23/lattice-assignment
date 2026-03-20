# Weather Dashboard (ReactJS)

A responsive Weather Dashboard built for the ReactJS selection test using Open-Meteo APIs.

## Tech Stack

- React + Vite
- Tailwind CSS
- Axios
- Chart.js + react-chartjs-2 + chartjs-plugin-zoom

## Features

### Page 1: Current Weather & Hourly Forecast

- Browser geolocation on first load
- Current weather cards with:
  - Temperature (Current, Min, Max)
  - Humidity
  - Precipitation
  - Precipitation Probability Max
  - UV Index
  - Wind Speed
  - Sunrise / Sunset
  - Air Quality: AQI, PM10, PM2.5, CO, CO2, NO2, SO2
- Calendar date selector (current page)
- Unit toggle (C/F)
- Hourly charts for selected date:
  - Temperature
  - Relative Humidity
  - Precipitation
  - Visibility
  - Wind Speed
  - PM10 + PM2.5
- Chart interactions:
  - Zoom (wheel/pinch)
  - Pan
  - Horizontal scrolling

### Page 2: Historical Weather

- Date range selection
- Quick ranges (7d/14d/30d/90d)
- Range validation: maximum 2 years (730 days)
- Historical charts:
  - Temperature (Mean/Min/Max)
  - Sunrise/Sunset (IST)
  - Precipitation
  - Max Wind Speed
  - Dominant Wind Direction
  - PM10 + PM2.5 trends

## API Sources

- Weather Forecast: `https://api.open-meteo.com/v1/forecast`
- Air Quality: `https://air-quality-api.open-meteo.com/v1/air-quality`
- Historical Archive: `https://archive-api.open-meteo.com/v1/archive`

## Environment Variables

Create `.env.local` in the project root:

```env
VITE_WEATHER_API_BASE_URL=https://api.open-meteo.com/v1/forecast
VITE_AIR_QUALITY_API_BASE_URL=https://air-quality-api.open-meteo.com/v1/air-quality
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Project Structure

```text
src/
  components/
    WeatherCard.jsx
    ZoomableChart.jsx
  hooks/
    useGeolocation.js
  pages/
    CurrentWeather.jsx
    HistoricalWeather.jsx
  services/
    weatherApi.js
  App.jsx
```

## Notes

- Geolocation permission is required for localized data.
- If env values are updated, restart the Vite dev server.
- Some air metrics may be unavailable for certain locations/timestamps; cards show `--` in such cases.

## Performance Check (500ms Requirement)

The app logs fetch-to-first-render timing in browser console:

- `[Perf] CurrentWeather load + first render: XX.XX ms`
- `[Perf] HistoricalWeather load + first render: XX.XX ms`

How to verify:

1. Run `npm run dev`
2. Open browser DevTools Console
3. Refresh and switch between `Current` / `Historical`
4. Record multiple runs and compute average

## Submission Checklist

- [x] ReactJS app
- [x] Open-Meteo API integration
- [x] Browser GPS integration
- [x] Current + Historical views
- [x] Responsive UI
- [x] Interactive charts (zoom, pan, horizontal scroll)
- [x] Air quality integration
