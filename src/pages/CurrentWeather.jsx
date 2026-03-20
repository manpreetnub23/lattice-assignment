import { useEffect, useMemo, useState } from "react";
import { fetchWeather } from "../services/weatherApi.js";
import { useGeolocation } from "../hooks/useGeolocation.js";
import WeatherCard from "../components/WeatherCard";
import ZoomableChart from "../components/ZoomableChart";

const toLocalDateISO = (date = new Date()) => {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	const d = String(date.getDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
};

const Spinner = () => (
	<div className="flex items-center gap-2 text-slate-400">
		<svg
			className="animate-spin"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2.5"
		>
			<path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
		</svg>
		<span className="text-sm">Fetching weather data...</span>
	</div>
);

const UnitToggle = ({ unit, onToggle }) => (
	<div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5">
		{["C", "F"].map((u) => (
			<button
				key={u}
				onClick={() => onToggle(u)}
				className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
					unit === u
						? "bg-white text-indigo-600 shadow-sm"
						: "text-slate-400 hover:text-slate-600"
				}`}
			>
				°{u}
			</button>
		))}
	</div>
);

const CurrentWeather = () => {
	const { location, error: geoError } = useGeolocation();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [unit, setUnit] = useState("C");
	const [selectedDate, setSelectedDate] = useState(toLocalDateISO());

	useEffect(() => {
		if (!location) return;
		const t0 = performance.now();
		setLoading(true);
		fetchWeather(location.lat, location.lon)
			.then((result) => {
				setData(result);
				requestAnimationFrame(() => {
					const ms = performance.now() - t0;
					console.log(
						`[Perf] CurrentWeather load + first render: ${ms.toFixed(2)} ms`,
					);
				});
			})
			.catch((e) => setError(e.message))
			.finally(() => setLoading(false));
	}, [location]);

	const convertTemp = (temp) =>
		typeof temp !== "number" ? null : unit === "C" ? temp : (temp * 9) / 5 + 32;

	const hourly = data?.hourly;
	const daily = data?.daily;
	const current = data?.current_weather;
	const airQualityHourly = data?.air_quality?.hourly;
	const hourlyTime = hourly?.time ?? [];
	const airHourlyTime = airQualityHourly?.time ?? [];
	const dailyDates = daily?.time ?? [];

	useEffect(() => {
		if (!dailyDates.length) return;
		if (!dailyDates.includes(selectedDate))
			setSelectedDate(
				dailyDates.includes(toLocalDateISO())
					? toLocalDateISO()
					: dailyDates[0],
			);
	}, [dailyDates]);

	const selectedDayIndex = Math.max(0, dailyDates.indexOf(selectedDate));
	const selectedHourlyIndexes = useMemo(
		() =>
			hourlyTime
				.map((t, i) => (t.startsWith(selectedDate) ? i : -1))
				.filter((i) => i >= 0),
		[hourlyTime, selectedDate],
	);
	const selectedAirIndexes = useMemo(
		() =>
			airHourlyTime
				.map((t, i) => (t.startsWith(selectedDate) ? i : -1))
				.filter((i) => i >= 0),
		[airHourlyTime, selectedDate],
	);
	const selectedFirstHourlyIndex = selectedHourlyIndexes[0] ?? 0;

	const buildSeries = (indexes, times, builder) =>
		indexes.map((idx) => ({
			time: times[idx]?.slice(11, 16) ?? "--:--",
			...builder(idx),
		}));

	const tempData = useMemo(
		() =>
			buildSeries(selectedHourlyIndexes, hourlyTime, (i) => ({
				temp: convertTemp(hourly?.temperature_2m?.[i]),
			})),
		[selectedHourlyIndexes, hourly?.temperature_2m, unit],
	);
	const humidityData = useMemo(
		() =>
			buildSeries(selectedHourlyIndexes, hourlyTime, (i) => ({
				humidity: hourly?.relativehumidity_2m?.[i],
			})),
		[selectedHourlyIndexes, hourly?.relativehumidity_2m],
	);
	const rainData = useMemo(
		() =>
			buildSeries(selectedHourlyIndexes, hourlyTime, (i) => ({
				rain: hourly?.precipitation?.[i],
			})),
		[selectedHourlyIndexes, hourly?.precipitation],
	);
	const visibilityData = useMemo(
		() =>
			buildSeries(selectedHourlyIndexes, hourlyTime, (i) => ({
				visibility: hourly?.visibility?.[i],
			})),
		[selectedHourlyIndexes, hourly?.visibility],
	);
	const windData = useMemo(
		() =>
			buildSeries(selectedHourlyIndexes, hourlyTime, (i) => ({
				wind: hourly?.windspeed_10m?.[i],
			})),
		[selectedHourlyIndexes, hourly?.windspeed_10m],
	);
	const airData = useMemo(
		() =>
			buildSeries(selectedAirIndexes, airHourlyTime, (i) => ({
				pm10: airQualityHourly?.pm10?.[i] ?? null,
				pm25: airQualityHourly?.pm2_5?.[i] ?? null,
			})),
		[selectedAirIndexes, airQualityHourly?.pm10, airQualityHourly?.pm2_5],
	);

	const selectedCurrentTemp =
		current?.time?.slice(0, 10) === selectedDate
			? current?.temperature
			: hourly?.temperature_2m?.[selectedFirstHourlyIndex];

	const selectedAirIndex =
		selectedAirIndexes.find(
			(idx) => airQualityHourly?.time?.[idx]?.slice(0, 10) === selectedDate,
		) ??
		selectedAirIndexes[0] ??
		0;
	const getAirValue = (key) => {
		const v = airQualityHourly?.[key]?.[selectedAirIndex];
		return typeof v === "number" ? v : "--";
	};

	if (geoError)
		return (
			<div className="p-12 text-center text-red-500 text-sm">📍 {geoError}</div>
		);
	if (error && !data)
		return <div className="p-12 text-center text-red-500 text-sm">{error}</div>;
	if (!data || !hourly || !daily || !current)
		return (
			<div className="p-12">
				{loading ? (
					<Spinner />
				) : (
					<p className="text-slate-400 text-sm">Weather data unavailable.</p>
				)}
			</div>
		);

	return (
		<div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
			{/* Header */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
						Current Weather
					</h1>
					<p className="text-sm text-slate-400 mt-0.5">
						Showing data for {selectedDate}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					{loading && <Spinner />}
					<input
						type="date"
						value={selectedDate}
						min={dailyDates[0]}
						max={dailyDates[dailyDates.length - 1]}
						onChange={(e) => setSelectedDate(e.target.value)}
						className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
					/>
					<UnitToggle unit={unit} onToggle={setUnit} />
				</div>
			</div>

			{/* Cards */}
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
				<WeatherCard
					title="Current Temp"
					value={convertTemp(selectedCurrentTemp)?.toFixed(1) ?? "--"}
					unit={unit}
				/>
				<WeatherCard
					title="Max Temp"
					value={
						convertTemp(daily.temperature_2m_max?.[selectedDayIndex])?.toFixed(
							1,
						) ?? "--"
					}
					unit={unit}
				/>
				<WeatherCard
					title="Min Temp"
					value={
						convertTemp(daily.temperature_2m_min?.[selectedDayIndex])?.toFixed(
							1,
						) ?? "--"
					}
					unit={unit}
				/>
				<WeatherCard
					title="Humidity"
					value={hourly.relativehumidity_2m?.[selectedFirstHourlyIndex] ?? "--"}
					unit="%"
				/>
				<WeatherCard
					title="Precipitation"
					value={hourly.precipitation?.[selectedFirstHourlyIndex] ?? "--"}
					unit="mm"
				/>
				<WeatherCard
					title="Precip. Probability Max"
					value={
						daily.precipitation_probability_max?.[selectedDayIndex] ?? "--"
					}
					unit="%"
				/>
				<WeatherCard
					title="Wind Speed"
					value={daily.windspeed_10m_max?.[selectedDayIndex] ?? "--"}
					unit="km/h"
				/>
				<WeatherCard
					title="UV Index"
					value={daily.uv_index_max?.[selectedDayIndex] ?? "--"}
				/>
				<WeatherCard title="AQI" value={getAirValue("european_aqi")} />
				<WeatherCard title="PM10" value={getAirValue("pm10")} unit="μg/m³" />
				<WeatherCard title="PM2.5" value={getAirValue("pm2_5")} unit="μg/m³" />
				<WeatherCard
					title="CO"
					value={getAirValue("carbon_monoxide")}
					unit="μg/m³"
				/>
				<WeatherCard
					title="CO2"
					value={getAirValue("carbon_dioxide")}
					unit="ppm"
				/>
				<WeatherCard
					title="NO2"
					value={getAirValue("nitrogen_dioxide")}
					unit="μg/m³"
				/>
				<WeatherCard
					title="SO2"
					value={getAirValue("sulphur_dioxide")}
					unit="μg/m³"
				/>
				<WeatherCard
					title="Sunrise"
					value={daily.sunrise?.[selectedDayIndex]?.slice(11, 16) ?? "--"}
				/>
				<WeatherCard
					title="Sunset"
					value={daily.sunset?.[selectedDayIndex]?.slice(11, 16) ?? "--"}
				/>
			</div>

			{/* Section divider */}
			<div className="border-t border-slate-200 pt-6">
				<h2 className="text-base font-bold text-slate-800">Hourly Trends</h2>
				<p className="text-xs text-slate-400 mt-0.5">
					Hourly breakdown for {selectedDate}
				</p>
			</div>

			<div className="grid md:grid-cols-2 gap-4">
				<ZoomableChart data={tempData} title={`Temperature (°${unit})`} />
				<ZoomableChart data={humidityData} title="Relative Humidity (%)" />
				<ZoomableChart data={rainData} title="Precipitation (mm)" />
				<ZoomableChart data={visibilityData} title="Visibility (m)" />
				<ZoomableChart data={windData} title="Wind Speed (km/h)" />
				<ZoomableChart
					data={airData}
					title="Air Quality PM10 & PM2.5 (μg/m³)"
				/>
			</div>
		</div>
	);
};

export default CurrentWeather;
