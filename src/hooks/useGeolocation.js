import { useState, useEffect } from "react";
export const useGeolocation = () => {
	const [location, setLocation] = useState(null);
	const [error, setError] = useState(null);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLocation({
					lat: pos.coords.latitude,
					lon: pos.coords.longitude,
				});
			},
			(err) => {
				setError(err.message);
			},
		);
	}, []);
	return { location, error };
};
