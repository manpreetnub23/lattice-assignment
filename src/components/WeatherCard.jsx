import styles from "../data/weatherCardStyles.json";
import { weatherCardIcons } from "./weatherCardIcons";

const WeatherCard = ({ title, value, unit }) => {
	const c = styles[title] || {
		iconBg: "bg-slate-100",
		iconColor: "text-slate-500",
	};
	const icon = weatherCardIcons[title];

	return (
		<div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
			<div className="flex items-center justify-between">
				<p className="text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight pr-2">
					{title}
				</p>
				<div
					className={`w-8 h-8 rounded-lg ${c.iconBg} ${c.iconColor} flex items-center justify-center flex-shrink-0`}
				>
					{icon}
				</div>
			</div>
			<div className="flex items-baseline gap-1">
				<span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
					{value}
				</span>
				{unit && (
					<span className="text-sm font-medium text-slate-400">{unit}</span>
				)}
			</div>
		</div>
	);
};

export default WeatherCard;

