import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.label}>Nome:</Text>
      <Text style={styles.value}>{user?.name}</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{user?.email}</Text>
      <TouchableOpacity style={styles.button} onPress={clearAuth}>
        <Text style={styles.buttonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
  },
  value: {
    fontSize: 18,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 40,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
