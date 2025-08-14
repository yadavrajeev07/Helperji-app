import React from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";

export default function AdminDashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📍 Live Staff Locations</Text>
        <Button
          title="View Map"
          color="#ef4444"
          onPress={() => router.push("/admin/LocationRoute")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📆 Attendance</Text>
        <Button
          title="View Attendance"
          color="#ef4444"
          onPress={() => router.push("/attendance")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>👥 All Staff</Text>
        <Button
          title="View Staff"
          color="#ef4444"
          onPress={() => router.push("/staff")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>➕ Create New Staff</Text>
        <Button
          title="Create Staff ID"
          color="#22c55e"
          onPress={() => router.push("/staff/create-staff")}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🗑️ Delete Staff</Text>
        <Button
          title="Delete Staff"
          color="#dc2626"
          onPress={() => router.push("/admin/delete-staff")}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  heading: {
    marginTop: 50,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#dc2626",
  },
  card: {
    backgroundColor: "#fef2f2",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#7f1d1d",
  },
});
