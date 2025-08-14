import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Button,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import haversine from 'haversine-distance';
import { API_BASE_URL } from '../config';

interface LocationPoint {
  lat: number;
  lng: number;
  timestamp?: string;
}

interface Staff {
  _id: string;
  name: string;
  email: string;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}

export default function LocationRoute() {
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number; timestamp?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState<'from' | 'to' | null>(null);

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveLocation, setLiveLocation] = useState<LocationPoint | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Fetch all staff with timeout and error handling
  const fetchStaffList = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await axios.get(`${API_BASE_URL}/api/staff/all`, {
        signal: controller.signal,
        timeout: 10000
      });
      
      clearTimeout(timeoutId);
      setStaffList(response.data || []);
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        Alert.alert('Timeout', 'Staff loading timed out. Please check your connection.');
      } else if (error.response?.status === 404) {
        Alert.alert('Error', 'Staff API endpoint not found.');
      } else if (error.code === 'ECONNREFUSED') {
        Alert.alert('Connection Error', 'Unable to connect to server. Please check your network.');
      } else {
        Alert.alert('Error', 'Failed to load staff. Please try again.');
      }
      
      setStaffList([]);
      setLoading(false);
    }
  };

  // Fetch location history for selected staff
  const fetchLocationHistory = async () => {
    if (!selectedStaff) return;

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/staff/location-history/${selectedStaff._id}`;
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate.toISOString());
      if (toDate) params.append('to', toDate.toISOString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await axios.get(url);
      
      // Handle both direct array response and wrapped response
      let locationData: LocationPoint[] = [];
      if (Array.isArray(res.data)) {
        locationData = res.data;
      } else if (res.data.locationHistory) {
        locationData = res.data.locationHistory;
      } else if (res.data) {
        locationData = res.data;
      }

      const formatted = locationData.map((loc) => ({
        latitude: loc.lat,
        longitude: loc.lng,
        timestamp: loc.timestamp,
      }));

      setCoordinates(formatted);
      calculateDistanceAndTime(formatted);
      
      if (formatted.length === 0) {
        Alert.alert('No Data', 'No location history found for the selected period.');
      }
    } catch (err: any) {
      console.error('Failed to fetch location history:', err);
      Alert.alert('Error', 'Failed to fetch location history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch live location
  const fetchLiveLocation = async () => {
    if (!selectedStaff || !isLiveTracking) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/api/staff/location/${selectedStaff._id}`);
      const data = res.data;
      
      if (data.currentLocation) {
        setLiveLocation({
          lat: data.currentLocation.lat,
          lng: data.currentLocation.lng,
          timestamp: data.currentLocation.timestamp,
        });
      }
    } catch (err) {
      console.error('Failed to fetch live location:', err);
    }
  };

  const calculateDistanceAndTime = (
    coords: { latitude: number; longitude: number; timestamp?: string }[]
  ) => {
    let totalDist = 0;

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      totalDist += haversine(prev, curr);
    }

    setTotalDistance(totalDist / 1000);

    if (
      coords.length >= 2 &&
      coords[0].timestamp &&
      coords[coords.length - 1].timestamp
    ) {
      const start = new Date(coords[0].timestamp!).getTime();
      const end = new Date(coords[coords.length - 1].timestamp!).getTime();
      const diffMin = Math.floor((end - start) / (1000 * 60));

      const hrs = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      setTotalTime(`${hrs}h ${mins}m`);
    } else {
      setTotalTime('N/A');
    }
  };

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchLocationHistory();
    }
  }, [selectedStaff, fromDate, toDate]);

  useEffect(() => {
    if (isLiveTracking && selectedStaff) {
      const liveInterval = setInterval(fetchLiveLocation, 5000);
      return () => clearInterval(liveInterval);
    }
  }, [isLiveTracking, selectedStaff]);

  const onDateChange = (_: any, selectedDate?: Date) => {
    if (showPicker === 'from' && selectedDate) setFromDate(selectedDate);
    if (showPicker === 'to' && selectedDate) setToDate(selectedDate);
    setShowPicker(null);
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowStaffModal(false);
    setCoordinates([]);
    setLiveLocation(null);
  };

  const renderStaffModal = () => (
    <Modal
      visible={showStaffModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowStaffModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Staff</Text>
          <ScrollView>
            {staffList.map((staff) => (
              <TouchableOpacity
                key={staff._id}
                style={styles.staffItem}
                onPress={() => handleStaffSelect(staff)}
              >
                <Text style={styles.staffName}>{staff.name}</Text>
                <Text style={styles.staffEmail}>{staff.email}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button title="Close" onPress={() => setShowStaffModal(false)} />
        </View>
      </View>
    </Modal>
  );

  if (loading && !selectedStaff) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="blue" />
        <Text>Loading Staff...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header Controls */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.staffSelector}
          onPress={() => setShowStaffModal(true)}
        >
          <Text style={styles.staffSelectorText}>
            {selectedStaff ? selectedStaff.name : 'Select Staff'}
          </Text>
        </TouchableOpacity>

        {selectedStaff && (
          <View style={styles.controls}>
            <View style={styles.switchContainer}>
              <Text>Live Tracking</Text>
              <Switch
                value={isLiveTracking}
                onValueChange={setIsLiveTracking}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={isLiveTracking ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
          </View>
        )}
      </View>
 
      {/* Map */}
      {selectedStaff ? (
        <MapView
          style={styles.map}
          initialRegion={
            coordinates.length > 0
              ? {
                  latitude: coordinates[0].latitude,
                  longitude: coordinates[0].longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : liveLocation
              ? {
                  latitude: liveLocation.lat,
                  longitude: liveLocation.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }
              : {
                  latitude: 28.6139,
                  longitude: 77.2090,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }
          }
        >
          {/* Route polyline */}
          {coordinates.length > 0 && (
            <Polyline coordinates={coordinates} strokeColor="blue" strokeWidth={4} />
          )}

          {/* Route markers */}
          {coordinates.length > 0 && (
            <>
              <Marker coordinate={coordinates[0]} title="Start" pinColor="green" />
              <Marker
                coordinate={coordinates[coordinates.length - 1]}
                title="End"
                pinColor="red"
              />
            </>
          )}

          {/* Live location marker */}
          {isLiveTracking && liveLocation && (
            <Marker
              coordinate={{
                latitude: liveLocation.lat,
                longitude: liveLocation.lng,
              }}
              title={`${selectedStaff.name} - Live`}
              pinColor="purple"
            />
          )}
        </MapView>
      ) : (
        <View style={styles.center}>
          <Text>Please select a staff member to view location data</Text>
        </View>
      )}

      {/* Info Panel */}
      {selectedStaff && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>{selectedStaff.name}</Text>
          <Text>Total Distance: {totalDistance.toFixed(2)} km</Text>
          <Text>Total Duration: {totalTime}</Text>
          
          <View style={styles.dateRow}>
            <Button title="From Date" onPress={() => setShowPicker('from')} />
            <Button title="To Date" onPress={() => setShowPicker('to')} />
          </View>

          <View style={styles.buttonRow}>
            <Button title="Refresh Route" onPress={fetchLocationHistory} />
            <Button title="Clear Selection" onPress={() => setSelectedStaff(null)} />
          </View>

          {showPicker && (
            <DateTimePicker
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              value={(showPicker === 'from' ? fromDate : toDate) || new Date()}
              onChange={onDateChange}
            />
          )}
        </View>
      )}

      {renderStaffModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 10,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  staffSelector: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  staffSelectorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoPanel: {
    padding: 15,
    backgroundColor: '#f3f4f6',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  staffItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffEmail: {
    fontSize: 14,
    color: '#666',
  },
});
