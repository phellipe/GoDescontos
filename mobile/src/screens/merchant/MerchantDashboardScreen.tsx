import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function MerchantDashboardScreen({ navigation }: any) {
  // TODO: Get merchantId from user profile
  const merchantId = 'merchant-id-here';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['merchantDashboard', merchantId],
    queryFn: async () => {
      const response = await api.get(`/merchant/analytics/dashboard?merchantId=${merchantId}`);
      return response.data.data;
    },
    enabled: !!merchantId,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Campanhas</Text>
          <Text style={styles.statValue}>{stats?.totalCampaigns || 0}</Text>
          <Text style={styles.statSubtext}>{stats?.activeCampaigns || 0} ativas</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Receita</Text>
          <Text style={styles.statValue}>R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cupons Usados</Text>
          <Text style={styles.statValue}>{stats?.totalCouponsRedeemed || 0}</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Conversão</Text>
          <Text style={styles.statValue}>{stats?.averageConversionRate?.toFixed(2) || 0}%</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ValidateCoupon')}
        >
          <Text style={styles.actionIcon}>✅</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Validar Cupom</Text>
            <Text style={styles.actionDescription}>Escanear QR code ou digitar código</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('MerchantCampaigns')}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Minhas Campanhas</Text>
            <Text style={styles.actionDescription}>Gerenciar campanhas ativas</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionIcon}>👥</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Clientes</Text>
            <Text style={styles.actionDescription}>Base de clientes</Text>
          </View>
          <Text style={styles.actionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Campaigns */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Campanhas Recentes</Text>

        {stats?.recentCampaigns?.map((campaign: any) => (
          <TouchableOpacity
            key={campaign.campaignId}
            style={styles.campaignCard}
            onPress={() =>
              navigation.navigate('MerchantCampaignDetail', { id: campaign.campaignId })
            }
          >
            <Text style={styles.campaignTitle}>{campaign.title}</Text>
            <View style={styles.campaignStats}>
              <Text style={styles.campaignStat}>👁️ {campaign.totalViews}</Text>
              <Text style={styles.campaignStat}>
                🎫 {campaign.redeemedCoupons}/{campaign.totalCoupons}
              </Text>
              <Text style={styles.campaignStat}>💰 R$ {campaign.revenue.toFixed(2)}</Text>
            </View>
            <View style={styles.campaignMeta}>
              <Text style={styles.conversionRate}>{campaign.conversionRate.toFixed(2)}% conversão</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginRight: '2%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#22c55e',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 24,
    color: '#3b82f6',
  },
  campaignCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  campaignStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  campaignStat: {
    fontSize: 12,
    color: '#666',
  },
  campaignMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  conversionRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
});
