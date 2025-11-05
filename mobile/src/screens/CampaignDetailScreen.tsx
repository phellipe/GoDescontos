import { View, Text, StyleSheet } from 'react-native';

export default function CampaignDetailScreen({ route }: any) {
  const { id } = route.params;

  return (
    <View style={styles.container}>
      <Text>Campaign Detail: {id}</Text>
      <Text>TODO: Implement campaign details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
