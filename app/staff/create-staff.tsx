import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../config"
const StaffCreate = () => {
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState(""); // We'll send this as `email`
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleCreateStaff = async () => {
    if (!name || !staffId || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const response = await axios.post(`${ API_BASE_URL }/api/staff/create`, {
        name,
        email: staffId, // ✅ Correct key for backend
        password,
      });

      console.log("Staff created:", response.data);
      Alert.alert("Success", "Staff created successfully!");
      setName("");
      setStaffId("");
      setPassword("");
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.log("Create Staff Error:", error);
      if (error.response?.data?.message) {
        Alert.alert("Error", error.response.data.message);
      } else {
        Alert.alert("Error", "Failed to create staff.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Staff</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Staff Email"
        value={staffId}
        onChangeText={setStaffId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Create Staff" onPress={handleCreateStaff} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
});

export default StaffCreate;
