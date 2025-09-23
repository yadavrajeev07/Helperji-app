import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/role");
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/helperji_logo.png')} style={styles.logo} />
      <Text style={styles.text}></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black',
  },
  logo: {
    width: 280, height: 280, resizeMode: 'contain',
  },
  text: {
    marginTop: 16, fontSize: 24, fontWeight: 'bold', color: '#d32f2f',
  },
});

