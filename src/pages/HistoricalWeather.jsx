import { useMemo, useState, useEffect } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { fetchHistoricalWeather } from "../services/weatherApi.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";
import ZoomableChart from "../components/ZoomableChart";

const fmt = (d) => d.toISOString().slice(0, 10);
const MAX_HISTORY_DAYS = 730;
const parseDate = (v) => new Date(`${v}T00:00:00`);
const diffDaysInclusive = (s, e) =>
	Math.floor((parseDate(e) - parseDate(s)) / 86400000) + 1;

const QUICK_RANGES = [
	{ label: "7d", days: 7 },
	{ label: "14d", days: 14 },
	{ label: "30d", days: 30 },
	{ label: "90d", days: 90 },
];

const toIstLabel = (isoTime) => {
	if (!isoTime) return "--:--";
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Kolkata",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(new Date(isoTime));
};

const toIstDecimalHour = (isoTime) => {
	const label = toIstLabel(isoTime);
	if (!label.includes(":")) return null;
	const [h, m] = label.split(":").map(Number);
	return Number.isNaN(h) || Number.isNaN(m) ? null : h + m / 60;
};

const HistoricalWeather = () => {
	const { location, error: geoError } = useGeolocation();
	const [startDate, setStartDate] = useState("2024-01-01");
	const [endDate, setEndDate] = useState("2024-01-10");
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);
	const [loading, setLoading] = useState(false);

	const debouncedStartDate = useDebouncedValue(startDate, 350);
	const debouncedEndDate = useDebouncedValue(endDate, 350);

	const applyQuickRange = (days) => {
		const end = new Date();
		end.setDate(end.getDate() - 2);
		const start = new Date(end);
		start.setDate(start.getDate() - days + 1);
		setStartDate(fmt(start));
		setEndDate(fmt(end));
	};

	useEffect(() => {
		if (!location) return;
		const controller = new AbortController();
		if (parseDate(debouncedStartDate) > parseDate(debouncedEndDate)) {
			setError("Start date must be on or before end date.");
			setData(null);
			setLoading(false);
			return;
		}
		if (
			diffDaysInclusive(debouncedStartDate, debouncedEndDate) > MAX_HISTORY_DAYS
		) {
			setError("Range cannot exceed 730 days.");
			setData(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);
		const t0 = performance.now();

		fetchHistoricalWeather(
			location.lat,
			location.lon,
			debouncedStartDate,
			debouncedEndDate,
			{ signal: controller.signal },
		)
			.then((result) => {
				setData(result);
				requestAnimationFrame(() => {
					const ms = performance.now() - t0;
					console.log(
						`[Perf] HistoricalWeather load + first render: ${ms.toFixed(2)} ms`,
					);
				});
			})
			.catch((e) => {
				if (e?.code === "ERR_CANCELED") return;
				setError("Failed to load data. Please check the date range.");
			})
			.finally(() => {
				if (!controller.signal.aborted) setLoading(false);
			});
		return () => controller.abort();
	}, [location, debouncedStartDate, debouncedEndDate]);

	const daily = data?.daily;
	const airHourly = data?.air_quality?.hourly;

	const tempTrend = useMemo(
		() =>
			daily?.time?.map((t, i) => ({
				time: t,
				max: daily.temperature_2m_max[i],
				min: daily.temperature_2m_min[i],
				mean: daily.temperature_2m_mean[i],
			})) ?? [],
		[daily],
	);

	const rainTrend = useMemo(
		() =>
			daily?.time?.map((t, i) => ({
				time: t,
				rain: daily.precipitation_sum[i],
			})) ?? [],
		[daily],
	);

	const windTrend = useMemo(
		() =>
			daily?.time?.map((t, i) => ({
				time: t,
				wind: daily.wind_speed_10m_max?.[i] ?? daily.windspeed_10m_max?.[i],
			})) ?? [],
		[daily],
	);

	const windDirTrend = useMemo(
		() =>
			daily?.time?.map((t, i) => ({
				time: t,
				wind_direction: daily.winddirection_10m_dominant?.[i] ?? null,
			})) ?? [],
		[daily],
	);

	const sunTrend = useMemo(
		() =>
			daily?.time?.map((t, i) => ({
				time: t,
				sunrise_ist: toIstDecimalHour(daily.sunrise?.[i]),
				sunset_ist: toIstDecimalHour(daily.sunset?.[i]),
			})) ?? [],
		[daily],
	);

	const airTrend = useMemo(
		() =>
			daily?.time?.map((day) => {
				const idxs =
					airHourly?.time
						?.map((ts, i) => (ts.startsWith(day) ? i : -1))
						.filter((i) => i >= 0) ?? [];
				const avg = (vals) =>
					vals.length === 0
						? null
						: vals.reduce((s, v) => s + v, 0) / vals.length;
				return {
					time: day,
					pm10: avg(
						idxs
							.map((i) => airHourly?.pm10?.[i])
							.filter((v) => typeof v === "number"),
					),
					pm25: avg(
						idxs
							.map((i) => airHourly?.pm2_5?.[i])
							.filter((v) => typeof v === "number"),
					),
				};
			}) ?? [],
		[daily, airHourly],
	);

	return (
		<div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-8">
			<div>
				<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
					Historical Weather
				</h1>
				<p className="text-sm text-slate-400 mt-0.5">
					Explore past conditions and trends
				</p>
			</div>

			<div className="bg-white rounded-2xl border border-slate-200 p-5">
				<div className="flex flex-wrap items-end gap-4">
					<div className="flex flex-col gap-1.5 min-w-0">
						<label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
							Start Date
						</label>
						<input
							type="date"
							value={startDate}
							max={endDate}
							onChange={(e) => setStartDate(e.target.value)}
							className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
						/>
					</div>

					<div className="flex flex-col gap-1.5 min-w-0">
						<label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
							End Date
						</label>
						<input
							type="date"
							value={endDate}
							max={fmt(new Date())}
							onChange={(e) => setEndDate(e.target.value)}
							className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 transition cursor-pointer"
						/>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
							Quick Range
						</label>
						<div className="flex gap-2 flex-wrap">
							{QUICK_RANGES.map(({ label, days }) => (
								<button
									key={days}
									onClick={() => applyQuickRange(days)}
									className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-150"
								>
									{label}
								</button>
							))}
						</div>
					</div>
				</div>
				<p className="text-xs text-slate-400 mt-4">
					Maximum range: 2 years (730 days)
				</p>
			</div>

			{geoError && (
				<div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
					Location unavailable: {geoError}
				</div>
			)}

			{!location && !geoError && (
				<div className="flex items-center gap-2 text-slate-400 text-sm">
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
					Detecting location...
				</div>
			)}

			{loading && (
				<div className="flex items-center gap-2 text-slate-400 text-sm">
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
					Loading historical data...
				</div>
			)}

			{error && (
				<div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
					Warning: {error}
				</div>
			)}

			{location && daily?.time && !loading && (
				<>
					<div className="border-t border-slate-200 pt-6">
						<h2 className="text-base font-bold text-slate-800">
							Historical Trends
						</h2>
						<p className="text-xs text-slate-400 mt-0.5">
							{startDate} to {endDate} · {daily.time.length} days
						</p>
					</div>
					<div className="grid md:grid-cols-2 gap-4">
						<ZoomableChart data={tempTrend} title="Temperature Trends (°C)" />
						<ZoomableChart
							data={sunTrend}
							title="Sunrise / Sunset (IST hour)"
						/>
						<ZoomableChart data={rainTrend} title="Daily Precipitation (mm)" />
						<ZoomableChart data={windTrend} title="Max Wind Speed (km/h)" />
						<ZoomableChart
							data={windDirTrend}
							title="Dominant Wind Direction (deg)"
						/>
						<ZoomableChart
							data={airTrend}
							title="Air Quality PM10 & PM2.5 (μg/m³)"
						/>
					</div>
				</>
			)}

			{location && !loading && !daily?.time && !error && (
				<div className="text-center py-20 text-slate-300 text-sm">
					Select a date range to view historical data
				</div>
			)}
		</div>
	);
};

export default HistoricalWeather;
