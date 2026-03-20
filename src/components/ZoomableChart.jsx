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
import { useRef, useState } from "react";

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
	const chartRef = useRef(null);
	const [hidden, setHidden] = useState({});

	if (!Array.isArray(data) || data.length === 0) {
		return (
			<div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-center min-h-44">
				<p className="text-sm text-slate-400">No data available</p>
			</div>
		);
	}

	const keys = Object.keys(data[0]).filter((k) => k !== "time");

	const toggleDataset = (index) => {
		const chart = chartRef.current;
		if (!chart) return;
		const meta = chart.getDatasetMeta(index);
		meta.hidden = !meta.hidden;
		chart.update();
		setHidden((prev) => ({ ...prev, [index]: meta.hidden }));
	};

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
			legend: { display: false },
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
			{/* Header */}
			<div className="px-5 pt-3 pb-2 border-b border-slate-100">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 min-w-0">
						<span
							className="w-2 h-2 rounded-full flex-shrink-0"
							style={{ background: accent }}
						/>
						<h3 className="text-sm font-semibold text-slate-700 truncate">
							{title}
						</h3>
					</div>
					<span className="text-xs text-slate-300 italic hidden md:block flex-shrink-0 ml-2">
						scroll to zoom · drag to pan
					</span>
				</div>

				{/* Clickable custom legend */}
				{keys.length > 1 && (
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
						{keys.map((key, i) => {
							const isHidden = !!hidden[i];
							return (
								<button
									key={key}
									onClick={() => toggleDataset(i)}
									className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-150"
									style={{ opacity: isHidden ? 0.35 : 1 }}
								>
									<span
										className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all"
										style={{
											background: isHidden
												? "#cbd5e1"
												: PALETTE[i % PALETTE.length].line,
										}}
									/>
									<span
										className="text-xs font-medium transition-colors"
										style={{ color: isHidden ? "#cbd5e1" : "#94a3b8" }}
									>
										{key.replace(/_/g, " ").toUpperCase()}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>

			{/* Chart */}
			<div className="p-4 overflow-x-auto">
				<div className="min-w-[480px]">
					<Line ref={chartRef} data={chartData} options={options} />
				</div>
			</div>
		</div>
	);
};

export default ZoomableChart;
