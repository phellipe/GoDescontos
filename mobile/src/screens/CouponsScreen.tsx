import { View, Text, StyleSheet } from 'react-native';

export default function CouponsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Cupons</Text>
      <Text>TODO: Implement coupons list</Text>
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
    marginBottom: 16,
  },
});
