// components/MapScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';

interface Location {
  lat: number;
  lng: number;
  timestamp: string;
}

interface Props {
  staffId: string;
}

const MapScreen: React.FC<Props> = ({ staffId }) => {
  const [loading, setLoading] = useState(true);
  const [punchIn, setPunchIn] = useState<Location | null>(null);
  const [punchOut, setPunchOut] = useState<Location | null>(null);
  const [liveLocation, setLiveLocation] = useState<Location | null>(null);
  const [route, setRoute] = useState<Location[]>([]);

  const baseURL = 'http://192.168.1.38:5000/api'; // ✅ Replace with your actual URL

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchLiveLocation, 10000); // live update every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const punchRes = await axios.get(`${baseURL}/staff/${staffId}`);
      const punchLocations = punchRes.data.punchLocations;
      const lastPunch = punchLocations[punchLocations.length - 1];

      setPunchIn(lastPunch?.punchInLocation);
      setPunchOut(lastPunch?.punchOutLocation || null);

      const historyRes = await axios.get(`${baseURL}/staff/location-history/${staffId}`);
      setRoute(historyRes.data.locationHistory);

      fetchLiveLocation();
    } catch (err) {
      console.error('Error fetching map data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveLocation = async () => {
    try {
      const res = await axios.get(`${baseURL}/staff/staff-location/${staffId}`);
      setLiveLocation(res.data);
    } catch (err) {
      console.error('Live location fetch error:', err);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="blue" style={{ flex: 1 }} />;

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: punchIn?.lat || 28.6,
        longitude: punchIn?.lng || 77.2,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      {punchIn && (
        <Marker coordinate={{ latitude: punchIn.lat, longitude: punchIn.lng }} pinColor="green" title="Punch In" />
      )}

      {liveLocation && (
        <Marker coordinate={{ latitude: liveLocation.lat, longitude: liveLocation.lng }} pinColor="blue" title="Live" />
      )}

      {punchOut && (
        <Marker coordinate={{ latitude: punchOut.lat, longitude: punchOut.lng }} pinColor="red" title="Punch Out" />
      )}

      {route.length > 1 && (
        <Polyline
          coordinates={route.map(loc => ({
            latitude: loc.lat,
            longitude: loc.lng,
          }))}
          strokeColor="#1e90ff"
          strokeWidth={3}
        />
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default MapScreen;
