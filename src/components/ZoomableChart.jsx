import {
	Chart as ChartJS,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	Tooltip,
	Legend,
	Filler,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";

ChartJS.register(
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	Tooltip,
	Legend,
	Filler,
	zoomPlugin,
);

const PALETTE = [
	{ line: "#6366F1", fill: "rgba(99,102,241,0.08)" },
	{ line: "#0EA5E9", fill: "rgba(14,165,233,0.08)" },
	{ line: "#10B981", fill: "rgba(16,185,129,0.08)" },
	{ line: "#F59E0B", fill: "rgba(245,158,11,0.08)" },
];

// Derive a single accent color from the chart title
const accentFor = (title = "") => {
	const t = title.toLowerCase();
	if (t.includes("temp")) return "#f97316";
	if (t.includes("humid")) return "#0ea5e9";
	if (t.includes("precip") || t.includes("rain")) return "#06b6d4";
	if (t.includes("wind")) return "#10b981";
	if (t.includes("air") || t.includes("pm") || t.includes("aqi"))
		return "#8b5cf6";
	if (t.includes("sun") || t.includes("uv")) return "#f59e0b";
	if (t.includes("vis")) return "#3b82f6";
	return "#6366f1";
};

const ZoomableChart = ({ data, title }) => {
	const accent = accentFor(title);

	if (!Array.isArray(data) || data.length === 0) {
		return (
			<div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-center min-h-44">
				<p className="text-sm text-slate-400">No data available</p>
			</div>
		);
	}

	const keys = Object.keys(data[0]).filter((k) => k !== "time");

	const chartData = {
		labels: data.map((d) => d.time),
		datasets: keys.map((key, i) => {
			const color = PALETTE[i % PALETTE.length];
			return {
				label: key.replace(/_/g, " ").toUpperCase(),
				data: data.map((d) => d[key]),
				borderColor: color.line,
				backgroundColor: color.fill,
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 4,
				pointHoverBackgroundColor: color.line,
				pointHoverBorderColor: "#fff",
				pointHoverBorderWidth: 2,
				tension: 0.4,
				fill: keys.length === 1,
			};
		}),
	};

	const options = {
		responsive: true,
		maintainAspectRatio: true,
		interaction: { mode: "index", intersect: false },
		plugins: {
			legend: {
				display: keys.length > 1,
				position: "top",
				align: "end",
				labels: {
					boxWidth: 8,
					boxHeight: 8,
					borderRadius: 4,
					usePointStyle: true,
					pointStyle: "circle",
					color: "#94A3B8",
					font: { size: 11, weight: "500" },
					padding: 16,
				},
			},
			tooltip: {
				backgroundColor: "#1e293b",
				titleColor: "#94a3b8",
				bodyColor: "#f8fafc",
				borderColor: "#334155",
				borderWidth: 1,
				padding: { x: 12, y: 10 },
				cornerRadius: 8,
				titleFont: { size: 11 },
				bodyFont: { size: 13, weight: "600" },
			},
			zoom: {
				zoom: {
					wheel: { enabled: true, speed: 0.08 },
					pinch: { enabled: true },
					mode: "x",
				},
				pan: { enabled: true, mode: "x" },
			},
		},
		scales: {
			x: {
				grid: { display: false },
				border: { display: false },
				ticks: {
					color: "#94A3B8",
					font: { size: 11 },
					maxTicksLimit: 8,
					maxRotation: 0,
				},
			},
			y: {
				grid: { color: "#f1f5f9" },
				border: { display: false },
				ticks: { color: "#94A3B8", font: { size: 11 }, maxTicksLimit: 5 },
			},
		},
	};

	return (
		<div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
			<div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
				<div className="flex items-center gap-2">
					{/* Single colored accent dot next to title */}
					<span
						className="w-2 h-2 rounded-full flex-shrink-0"
						style={{ background: accent }}
					/>
					<h3 className="text-sm font-semibold text-slate-700">{title}</h3>
				</div>
				<span className="text-xs text-slate-300 italic hidden sm:block">
					scroll to zoom · drag to pan
				</span>
			</div>
			<div className="p-4 overflow-x-auto">
				<div className="min-w-[480px]">
					<Line data={chartData} options={options} />
				</div>
			</div>
		</div>
	);
};

export default ZoomableChart;
