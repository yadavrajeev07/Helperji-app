import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RoleScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/helperji.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome!</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/admin/login')}
      >
        <Text style={styles.buttonText}>Admin Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/staff/staff-login')}
      >
        <Text style={styles.buttonText}>Staff Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RoleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 280,
    height: 280,
    marginBottom: 2,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#e91c1a', // red
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#fdd835', // yellow
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
