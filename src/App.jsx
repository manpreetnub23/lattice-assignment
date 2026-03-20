import CurrentWeather from "./pages/CurrentWeather";
import HistoricalWeather from "./pages/HistoricalWeather";
import { useState } from "react";

const NAV = [
	{
		id: "current",
		label: "Current",
		icon: (
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<circle cx="12" cy="12" r="5" />
				<line x1="12" y1="1" x2="12" y2="3" />
				<line x1="12" y1="21" x2="12" y2="23" />
				<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
				<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
				<line x1="1" y1="12" x2="3" y2="12" />
				<line x1="21" y1="12" x2="23" y2="12" />
				<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
				<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
			</svg>
		),
	},
	{
		id: "historical",
		label: "Historical",
		icon: (
			<svg
				width="15"
				height="15"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
			>
				<path d="M3 3v5h5" />
				<path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
				<polyline points="12 7 12 12 16 14" />
			</svg>
		),
	},
];

function App() {
	const [page, setPage] = useState("current");

	return (
		<div
			className="min-h-screen bg-slate-50"
			style={{
				backgroundImage:
					"radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
				backgroundSize: "28px 28px",
			}}
		>
			{/* Navbar */}
			<header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200">
				<div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
					{/* Brand */}
					<div className="flex items-center gap-2 flex-shrink-0">
						<div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
							<svg
								width="14"
								height="14"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
							</svg>
						</div>
						<span className="text-sm font-bold text-slate-800 tracking-tight hidden sm:block">
							WeatherDash
						</span>
					</div>

					{/* Nav tabs — centered, full width on mobile */}
					<nav className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 flex-1 sm:flex-none sm:mx-auto max-w-xs">
						{NAV.map(({ id, label, icon }) => (
							<button
								key={id}
								onClick={() => setPage(id)}
								className={`flex items-center justify-center gap-1.5 flex-1 sm:flex-none sm:px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
									page === id
										? "bg-white text-indigo-600 shadow-sm"
										: "text-slate-500 hover:text-slate-700"
								}`}
							>
								{icon}
								<span>{label}</span>
							</button>
						))}
					</nav>

					{/* Live badge */}
					<div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
						<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
						<span className="hidden sm:inline">Live</span>
					</div>
				</div>
			</header>

			<main>
				{page === "current" ? <CurrentWeather /> : <HistoricalWeather />}
			</main>
		</div>
	);
}

export default App;
