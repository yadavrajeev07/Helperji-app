import React, { useEffect, useState } from "react";
import MapView, { Polyline, Marker } from "react-native-maps";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import axios from "axios";
import { API_BASE_URL } from "./config";
type LocationPoint = {
  latitude: number;
  longitude: number;
  type: "punch-in" | "live" | "punch-out";
};

type Props = {
  staffId: string;
};

const LocationMap: React.FC<Props> = ({ staffId }) => {
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLocationHistory();
  }, []);

  const fetchLocationHistory = async () => {
    try {
     const res = await axios.get(`${API_BASE_URL}/api/staff/route/${staffId}`);
const { punchInLocation, punchOutLocation, route } = res.data;


      if (!punchInLocation || !punchOutLocation || !route || route.length < 2) {
        setLocations([]);
        setLoading(false);
        return;
      }

      const enrichedRoute: LocationPoint[] = [
        { ...punchInLocation, type: "punch-in" },
        ...route.slice(1, -1).map((loc: any) => ({ ...loc, type: "live" })),
        { ...punchOutLocation, type: "punch-out" },
      ];

      setLocations(enrichedRoute);
    } catch (error) {
      console.error("Failed to fetch route data:", error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (!locations.length) {
    return (
      <View style={styles.center}>
        <Text>No location data available.</Text>
      </View>
    );
  }

  const punchIn = locations.find((loc) => loc.type === "punch-in");
  const punchOut = locations.find((loc) => loc.type === "punch-out");
  const liveLocations = locations.filter((loc) => loc.type === "live");

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: punchIn?.latitude || 28.6139,
        longitude: punchIn?.longitude || 77.209,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {punchIn && (
        <Marker
          coordinate={{
            latitude: punchIn.latitude,
            longitude: punchIn.longitude,
          }}
          title="Punch In"
          pinColor="blue"
        />
      )}

      {punchOut && (
        <Marker
          coordinate={{
            latitude: punchOut.latitude,
            longitude: punchOut.longitude,
          }}
          title="Punch Out"
          pinColor="red"
        />
      )}

      {liveLocations.length > 0 && (
        <>
          <Polyline
            coordinates={liveLocations.map((loc) => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor="green"
            strokeWidth={3}
          />

          {liveLocations.map((loc, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              pinColor="green"
            />
          ))}
        </>
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LocationMap;
