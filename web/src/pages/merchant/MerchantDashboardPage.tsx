import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

export default function MerchantDashboardPage() {
  const user = useAuthStore((state) => state.user);

  // TODO: Get merchantId from user profile
  const merchantId = 'merchant-id-here'; // This should come from user data

  const { data: stats, isLoading } = useQuery(
    ['merchantDashboard', merchantId],
    async () => {
      const response = await api.get(`/merchant/analytics/dashboard?merchantId=${merchantId}`);
      return response.data.data;
    },
    {
      enabled: !!merchantId,
    }
  );

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bem-vindo de volta, {user?.name}</p>
        </div>
        <Link
          to="/merchant/campaigns/create"
          className="btn btn-primary"
        >
          + Nova Campanha
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Total de Campanhas</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.totalCampaigns || 0}</div>
          <div className="text-sm text-green-600 mt-2">
            {stats?.activeCampaigns || 0} ativas
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Receita Total</div>
          <div className="text-3xl font-bold text-gray-900">
            R$ {stats?.totalRevenue?.toFixed(2) || '0.00'}
          </div>
          <div className="text-sm text-gray-500 mt-2">Cupons resgatados</div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Cupons Resgatados</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.totalCouponsRedeemed || 0}
          </div>
          <div className="text-sm text-gray-500 mt-2">Total de conversões</div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-2">Taxa de Conversão</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats?.averageConversionRate?.toFixed(2) || '0'}%
          </div>
          <div className="text-sm text-gray-500 mt-2">{stats?.totalViews || 0} visualizações</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/merchant/campaigns" className="card hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">📊 Minhas Campanhas</h3>
          <p className="text-gray-600">Gerenciar campanhas ativas e inativas</p>
        </Link>

        <Link to="/merchant/validate" className="card hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">✅ Validar Cupom</h3>
          <p className="text-gray-600">Escanear QR code ou digitar código</p>
        </Link>

        <Link to="/merchant/customers" className="card hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">👥 Clientes</h3>
          <p className="text-gray-600">Gerenciar base de clientes</p>
        </Link>
      </div>

      {/* Recent Campaigns */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Campanhas Recentes</h2>

        {!stats?.recentCampaigns || stats.recentCampaigns.length === 0 ? (
          <p className="text-gray-500">Nenhuma campanha criada ainda.</p>
        ) : (
          <div className="space-y-4">
            {stats.recentCampaigns.map((campaign: any) => (
              <div
                key={campaign.campaignId}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>👁️ {campaign.totalViews} visualizações</span>
                      <span>🎫 {campaign.redeemedCoupons}/{campaign.totalCoupons} cupons usados</span>
                      <span>💰 R$ {campaign.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">
                      {campaign.conversionRate.toFixed(2)}% conversão
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.redemptionRate.toFixed(2)}% redenção
                    </div>
                  </div>
                </div>
                <Link
                  to={`/merchant/campaigns/${campaign.campaignId}`}
                  className="text-blue-600 text-sm mt-2 inline-block hover:underline"
                >
                  Ver detalhes →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
