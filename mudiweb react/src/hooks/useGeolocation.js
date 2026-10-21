import { useState, useEffect, useCallback } from 'react';
import { updateDriverLiveLocation } from '../services/fleetService';

export const useGeolocation = (driverUid = null) => {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador.');
      setLoading(false);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        setCoords(newCoords);
        setLoading(false);
        setError(null);

        if (driverUid) {
          updateDriverLiveLocation(driverUid, newCoords);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      options
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [driverUid]);

  const requestImmediateFix = useCallback(() => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        setCoords(newCoords);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return { coords, error, loading, requestImmediateFix };
};

export default useGeolocation;
