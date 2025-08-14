import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator,Button } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { router } from "expo-router";
const API_URL = 'http://192.168.1.41:5000/api';

const LiveLocation = () => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch staff list on mount
  useEffect(() => {
    const fetchStaffList = async () => {
      try {
        const res = await axios.get(`${API_URL}/staff/all`);
        setStaffList(res.data);
      } catch (err) {
        console.error('Error fetching staff:', err);
      }
    };
    fetchStaffList();
  }, []);

  // Fetch selected staff location
  useEffect(() => {
    const fetchLocation = async () => {
      if (!selectedStaffId) return;
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/staff/location/${selectedStaffId}`);
        setLocation(res.data);
      } catch (err) {
        console.error('Error fetching location:', err);
        setLocation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
    const interval = setInterval(fetchLocation, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, [selectedStaffId]);

  return (
    
    <View style={styles.container}>
       <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 Live Route</Text>
              <Button
                title="View Map"
                color="#ef4444"
                onPress={() => router.push("/admin/LocationRoute")}
              />
            </View>
      <Text style={styles.title}>Live Staff Location</Text>

      <Picker
        selectedValue={selectedStaffId}
        onValueChange={(itemValue) => setSelectedStaffId(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Staff" value="" />
        {staffList.map((staff) => (
          <Picker.Item key={staff._id} label={staff.name} value={staff._id} />
        ))}
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : location ? (
        <View style={styles.locationBox}>
          <Text style={styles.info}>📍 Lat: {location.lat}</Text>
          <Text style={styles.info}>📍 Lng: {location.lng}</Text>
          <Text style={styles.timestamp}>🕒 {new Date(location.timestamp).toLocaleString()}</Text>
        </View>

        
      ) : selectedStaffId ? (
        <Text style={styles.info}>No location found for selected staff.</Text>
      ) : null}
    </View>
  );
};

export default LiveLocation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFDF8',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  picker: {
    height: 50,
    marginBottom: 20,
  },
  locationBox: {
    padding: 16,
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    marginTop: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});
