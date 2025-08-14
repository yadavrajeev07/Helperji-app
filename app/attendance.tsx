import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "./config";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Button,
  Alert,
} from "react-native";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { format } from "date-fns"; // this will be used for CSV formatting

const API_BASE = `${ API_BASE_URL}/api/staff`;

export default function AttendanceScreen() {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all staff
  useEffect(() => {
    axios
      .get(`${API_BASE}/all`)
      .then((res) => setStaffList(res.data))
      .catch((err) => console.error("Staff Fetch Error:", err));
  }, []);

  // Fetch attendance of selected staff
  const fetchAttendance = async (staffId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/${staffId}`);
      const data = res.data;
      setSelectedStaff({ id: staffId, name: data.name });
      setAttendance(data.attendance || []);
    } catch (err) {
      console.error("Attendance Fetch Error:", err);
    }
    setLoading(false);
  };

  // Export current staff's attendance to CSV
  const exportToCSV = async () => {
    if (!attendance.length) {
      return Alert.alert("No data", "No attendance to export.");
    }

    try {
      const csv =
        "Punch In,Punch Out\n" +
        attendance
          .map((entry) => {
            const punchIn = entry.punchIn
              ? format(new Date(entry.punchIn), "dd-MM-yyyy HH:mm:ss")
              : "";
            const punchOut = entry.punchOut
              ? format(new Date(entry.punchOut), "dd-MM-yyyy HH:mm:ss")
              : "";
            return `${punchIn},${punchOut}`;
          })
          .join("\n");

      const fileUri =
        FileSystem.documentDirectory +
        `${selectedStaff.name}_attendance.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("CSV Export Error:", error);
      Alert.alert("Error", "Failed to export CSV");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        {selectedStaff
          ? `${selectedStaff.name}'s Attendance`
          : "Select a Staff"}
      </Text>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#3b82f6"
          style={{ marginVertical: 20 }}
        />
      )}

      {!selectedStaff ? (
        <ScrollView>
          {staffList.map((staff) => (
            <TouchableOpacity
              key={staff._id}
              onPress={() => fetchAttendance(staff._id)}
              style={styles.entry}
            >
              <Text style={styles.date}>{staff.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <ScrollView>
          <View style={{ marginBottom: 10 }}>
            <Button
              title="📤 Export to CSV"
              onPress={exportToCSV}
              color="#0ea5e9"
            />
          </View>

          {attendance.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#6b7280" }}>
              No attendance found.
            </Text>
          ) : (
            attendance.map((entry, index) => (
              <View key={index} style={styles.entry}>
                <View>
                  <Text style={styles.date}>
                    🕒 In:{" "}
                    {entry.punchIn
                      ? formatDateTime(entry.punchIn)
                      : "--"}
                  </Text>
                  <Text style={styles.date}>
                    🏁 Out:{" "}
                    {entry.punchOut
                      ? formatDateTime(entry.punchOut)
                      : "--"}
                  </Text>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            onPress={() => {
              setSelectedStaff(null);
              setAttendance([]);
            }}
            style={[
              styles.entry,
              { backgroundColor: "#e2e8f0", justifyContent: "center" },
            ]}
          >
            <Text
              style={{
                color: "#334155",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              🔙 Back
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

// ✅ Custom formatter (renamed to avoid conflict)
function formatDateTime(isoString: string) {
  const date = new Date(isoString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#334155",
  },
  entry: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: "#1e293b",
  },
});


