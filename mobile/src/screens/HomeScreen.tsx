import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function HomeScreen({ navigation }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await api.get('/campaigns');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('CampaignDetail', { id: item.id })}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.shortDescription}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>R$ {item.priceOriginal}</Text>
              <Text style={styles.promoPrice}>R$ {item.pricePromo}</Text>
              <Text style={styles.discount}>-{item.discountPercent}%</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#666',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
    marginRight: 8,
  },
  promoPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginRight: 8,
  },
  discount: {
    backgroundColor: '#ef4444',
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
