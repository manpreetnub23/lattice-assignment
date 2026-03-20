import { useState, useEffect } from "react";

const GEO_OPTIONS = {
	enableHighAccuracy: false,
	timeout: 8000,
	maximumAge: 300000,
};

let memoryCachedLocation = null;

export const useGeolocation = () => {
	const [location, setLocation] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!navigator.geolocation) {
			setError("Geolocation is not supported in this browser.");
			return;
		}

		const cached = memoryCachedLocation;
		if (cached) setLocation(cached);

		navigator.geolocation.getCurrentPosition(
			(pos) => {
				const next = {
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
				};
				setLocation(next);
				memoryCachedLocation = next;
				setError(null);
			},
			(err) => {
				if (!cached) setError(err.message);
			},
			GEO_OPTIONS,
		);
	}, []);
	return { location, error };
};
