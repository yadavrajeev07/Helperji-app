import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  AppState,
  AppStateStatus,
} from "react-native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";
interface AttendanceEntry {
  punchIn: string;
  punchOut?: string;
  totalHours?: string;
}

interface StaffData {
  name: string;
  attendance: AttendanceEntry[];
}

export default function StaffProfileScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const staffId = typeof params.staffId === "string" ? params.staffId : null;

  const [staffName, setStaffName] = useState("");
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [currentWorkDuration, setCurrentWorkDuration] = useState<string>("");
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const intervalRef = useRef<number | null>(null);
  const workStartTimeRef = useRef<Date | null>(null);

  const API = `${API_BASE_URL}/api`;

  // Check if staff is already logged in
  const checkLoginStatus = async () => {
    try {
      const loggedInStaffId = await AsyncStorage.getItem('loggedInStaffId');
      if (loggedInStaffId && loggedInStaffId === staffId) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  };

  // Set staff as logged in
  const setStaffLoggedIn = async (id: string) => {
    try {
      await AsyncStorage.setItem('loggedInStaffId', id);
    } catch (error) {
      console.error("Error setting login status:", error);
    }
  };

  // Clear staff login
  const clearStaffLogin = async () => {
    try {
      await AsyncStorage.removeItem('loggedInStaffId');
    } catch (error) {
      console.error("Error clearing login status:", error);
    }
  };

  // Fetch staff profile data from server
  const fetchStaffProfile = async () => {
    if (!staffId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API}/staff/${staffId}`);
      const data = res.data;

      setStaffName(data.name || "");
      setAttendance(data.attendance || []);

      const lastEntry = data.attendance?.at(-1);
      const punchedIn = Boolean(lastEntry && !lastEntry.punchOut);
      setIsPunchedIn(punchedIn);

      // Check if staff should be logged in
      const isLoggedIn = await checkLoginStatus();
      if (punchedIn && isLoggedIn) {
        startTracking(); // Resume location tracking
      }
    } catch (error) {
      console.error("Fetch staff error:", error);
      Alert.alert("Error", "Failed to load staff data");
    } finally {
      setLoading(false);
    }
  };

  // Request location permission
  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Location access is required");
      return false;
    }
    return true;
  };

  // Request background location permission
  const requestBackgroundLocationPermission = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Background Location Required",
        "Please enable background location to continue tracking when app is minimized."
      );
      return false;
    }
    return true;
  };

  // Start live location tracking with background support
  const startTracking = async () => {
    const granted = await requestLocationPermission();
    if (!granted) return;

    // Request background permission for continuous tracking
    await requestBackgroundLocationPermission();

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // every 10 seconds
        distanceInterval: 10, // every 10 meters
      },
      async (loc) => {
        const { latitude, longitude, accuracy } = loc.coords;

        // ✅ Ignore inaccurate points
        if (typeof accuracy === "number" && accuracy < 50) {
          console.log("✅ Accurate location:", latitude, longitude, "Accuracy:", accuracy);
          lastLocationRef.current = { lat: latitude, lng: longitude };
          
          // ✅ Immediately send location update when app is in background
          // This ensures location is tracked even when app is minimized
          try {
            await axios.post(`${API}/staff/location`, {
              staffId,
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString(),
            });
            console.log("📍 Location sent to server:", new Date().toISOString());
          } catch (err) {
            console.error("Background location push failed:", err);
          }
        } else {
          console.warn("❌ Inaccurate location skipped:", accuracy);
        }
      }
    );

    setWatcher(subscription);

    // ✅ Push latest location to server every 5 minutes as fallback
    intervalRef.current = setInterval(async () => {
      const last = lastLocationRef.current;
      if (!last || !staffId) return;

      try {
        await axios.post(`${API}/staff/location`, {
          staffId,
          lat: last.lat,
          lng: last.lng,
          timestamp: new Date().toISOString(),
        });
        console.log("⏰ Scheduled location push:", new Date().toISOString());
      } catch (err) {
        console.error("5-min location push failed:", err);
      }
    }, 5 * 60 * 1000); // 5 minutes
  };

  // Stop location tracking and push final location
  const stopTracking = async () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const last = lastLocationRef.current;
    if (last && staffId) {
      try {
        await axios.post(`${API}/staff/location`, {
          staffId,
          lat: last.lat,
          lng: last.lng,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Punch-out location send failed:", error);
      }
    }
  };

  // Handle Punch In / Out
  const handlePunch = async () => {
    if (!staffId) return;

    try {
      const route = isPunchedIn ? "punchout" : "punchin";

      if (isPunchedIn) {
        await stopTracking(); // Stop tracking before punch out
        await clearStaffLogin(); // Clear login status on punch out
      }

      const res = await axios.post(`${API}/staff/${route}`, { staffId });

      if (!isPunchedIn) {
        const permission = await requestLocationPermission();
        if (!permission) return;

        const location = await Location.getCurrentPositionAsync({});
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;

        await axios.post(`${API}/location/location`, {
          staffId,
          lat,
          lng,
          timestamp: new Date().toISOString(),
        });

        await setStaffLoggedIn(staffId); // Set login status on punch in
        startTracking(); // Start live + interval tracking
      }

      Alert.alert("Success", res.data?.message || "Punch recorded.");
      fetchStaffProfile();
    } catch (error) {
      console.error("Punch error:", error);
      Alert.alert("Error", "Punch action failed.");
    }
  };

  // Initial load and cleanup
  useEffect(() => {
    if (staffId) fetchStaffProfile();

    return () => {
      stopTracking(); // Cleanup on unmount
    };
  }, [staffId]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('loggedInStaffId');
      Alert.alert("Logged Out", "You have been successfully logged out.");
      router.replace("/staff/staff-login");
    } catch (error) {
      console.error("Logout error:", error);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#b91c1c" />
      ) : (
        <>
          <Text style={styles.name}>Welcome, {staffName}</Text>

          <TouchableOpacity style={styles.button} onPress={handlePunch}>
            <Text style={styles.buttonText}>
              {isPunchedIn ? "Punch Out" : "Punch In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Attendance History</Text>

          {attendance.length === 0 ? (
            <Text style={styles.noData}>No attendance records</Text>
          ) : (
            attendance.map((entry, index) => (
              <View key={index} style={styles.record}>
                <Text>Punch In: {new Date(entry.punchIn).toLocaleString()}</Text>
                <Text>
                  Punch Out:{" "}
                  {entry.punchOut
                    ? new Date(entry.punchOut).toLocaleString()
                    : "Still working..."}
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 20,
    textAlign: "center",
    color: "#b91c1c",
  },
  button: {
    backgroundColor: "#b91c1c",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  record: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  noData: {
    color: "#666",
    textAlign: "center",
  },
});
