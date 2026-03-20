import axios from "axios";

const sanitizeUrl = (url) =>
	typeof url === "string"
		? url.trim().replace(/^['"]|['"]$/g, "").replace(/;+\s*$/, "")
		: "";

const baseURL =
	sanitizeUrl(import.meta.env.VITE_WEATHER_API_BASE_URL) ||
	"https://api.open-meteo.com/v1/forecast";
const airQURL =
	sanitizeUrl(import.meta.env.VITE_AIR_QUALITY_API_BASE_URL) ||
	"https://air-quality-api.open-meteo.com/v1/air-quality";
const weatherArchiveURL = "https://archive-api.open-meteo.com/v1/archive";

const AIR_HOURLY_METRICS = [
	"pm10",
	"pm2_5",
	"european_aqi",
	"carbon_monoxide",
	"carbon_dioxide",
	"nitrogen_dioxide",
	"sulphur_dioxide",
];

const fetchAirQuality = async (params) => {
	const { timezone, ...restParams } = params;
	const tz = timezone ?? "auto";

	try {
		return await axios.get(airQURL, {
			params: { ...restParams, hourly: AIR_HOURLY_METRICS.join(","), timezone: tz },
		});
	} catch (error) {
		if (error?.response?.status === 400) {
			const fallbackMetrics = AIR_HOURLY_METRICS.filter(
				(metric) => metric !== "carbon_dioxide",
			);
			return axios.get(airQURL, {
				params: { ...restParams, hourly: fallbackMetrics.join(","), timezone: tz },
			});
		}
		throw error;
	}
};

// Get current + hourly weather
export const fetchWeather = async (lat, lon) => {
	try {
		// Weather API
		const weatherRes = await axios.get(baseURL, {
			params: {
				latitude: lat,
				longitude: lon,
				hourly: [
					"temperature_2m",
					"relativehumidity_2m",
					"precipitation",
					"visibility",
					"windspeed_10m",
				].join(","),
				daily: [
					"temperature_2m_max",
					"temperature_2m_min",
					"sunrise",
					"sunset",
					"uv_index_max",
					"precipitation_probability_max",
					"windspeed_10m_max",
				].join(","),
				current_weather: true,
				timezone: "auto",
			},
		});

		// Air Quality API
		const airRes = await fetchAirQuality({
			latitude: lat,
			longitude: lon,
		});
		return { ...weatherRes.data, air_quality: airRes.data };
	} catch (error) {
		console.error("Error fetching weather:", error);
		throw error;
	}
};

export const fetchHistoricalWeather = async (lat, lon, startDate, endDate) => {
	try {
		const weatherRes = await axios.get(weatherArchiveURL, {
			params: {
				latitude: lat,
				longitude: lon,
				start_date: startDate,
				end_date: endDate,
				daily: [
					"temperature_2m_max",
					"temperature_2m_min",
					"temperature_2m_mean",
					"sunrise",
					"sunset",
					"precipitation_sum",
					"wind_speed_10m_max",
					"winddirection_10m_dominant",
				].join(","),
				timezone: "Asia/Kolkata",
			},
		});

		const airRes = await fetchAirQuality({
			latitude: lat,
			longitude: lon,
			start_date: startDate,
			end_date: endDate,
			timezone: "Asia/Kolkata",
		});

		return { ...weatherRes.data, air_quality: airRes.data };
	} catch (error) {
		console.error("Error fetching historical weather:", error);
		throw error;
	}
};
