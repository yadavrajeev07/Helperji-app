import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert, StyleSheet } from "react-native";
 import { API_BASE_URL } from "../config";
import axios from "axios";

const API_URL = `${API_BASE_URL}`; 

interface Staff {
  _id: string;
  name: string;
  email: string;
}

const DeleteStaffScreen = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const fetchStaff = async () => {
    try {
       const response = await axios.get(`${ API_BASE_URL }/api/staff/all`);
      setStaffList(response.data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      Alert.alert("Failed to fetch staff list");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${ API_BASE_URL }/api/staff/delete/${id}`);
      Alert.alert("Staff deleted successfully");
      fetchStaff(); // Refresh list
    } catch (error) {
      console.error("Error deleting staff:", error);
      Alert.alert("Failed to delete staff");
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const renderItem = ({ item }: { item: Staff }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>{item.email}</Text>
      <Button title="Delete" color="red" onPress={() => handleDelete(item._id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Staff</Text>
      <FlatList
        data={staffList}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
};

export default DeleteStaffScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
