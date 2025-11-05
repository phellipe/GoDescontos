import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import api from '@/services/api';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: stats, isLoading: loadingStats } = useQuery(
    ['campaignStats', id],
    async () => {
      const response = await api.get(`/merchant/analytics/campaign/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
    }
  );

  const { data: campaign, isLoading: loadingCampaign } = useQuery(
    ['campaign', id],
    async () => {
      const response = await api.get(`/campaigns/${id}`);
      return response.data.data;
    },
    {
      enabled: !!id,
    }
  );

  if (loadingStats || loadingCampaign) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link to="/merchant/campaigns" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Voltar para Campanhas
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Info */}
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{campaign?.title}</h1>

            {campaign?.imageUrl && (
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}

            <div className="mb-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  campaign?.status === 'PUBLISHED'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {campaign?.status === 'PUBLISHED' ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{campaign?.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-500">Preço Original</div>
                <div className="text-xl font-semibold line-through text-gray-400">
                  R$ {Number(campaign?.priceOriginal).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Preço Promocional</div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {Number(campaign?.pricePromo).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Termos e Condições</h3>
              <p className="text-gray-700 text-sm">{campaign?.terms || 'Sem termos especificados'}</p>
            </div>
          </div>

          {/* Recent Coupons */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Cupons Recentes</h2>
            {/* TODO: Add coupon history list */}
            <p className="text-gray-500">Lista de cupons resgatados recentemente</p>
          </div>
        </div>

        {/* Sidebar with Stats */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Estatísticas</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Visualizações</span>
                <span className="text-2xl font-bold">{stats?.totalViews || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxa de Conversão</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.conversionRate?.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cupons Disponíveis</span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats?.availableCoupons || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cupons Reservados</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {stats?.reservedCoupons || 0}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cupons Usados</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats?.redeemedCoupons || 0}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Receita Gerada</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {stats?.revenue?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Taxa de Redenção</span>
                <span className="text-xl font-bold">
                  {stats?.redemptionRate?.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Favoritos</span>
                <span className="text-xl font-bold">❤️ {stats?.favorites || 0}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="card">
            <h3 className="font-semibold mb-3">Progresso de Cupons</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-green-600 h-4 rounded-full"
                style={{
                  width: `${stats?.totalCoupons ? (stats.redeemedCoupons / stats.totalCoupons) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600">
              {stats?.redeemedCoupons} de {stats?.totalCoupons} cupons usados
            </p>
          </div>

          {/* Actions */}
          <div className="card">
            <h3 className="font-semibold mb-3">Ações</h3>
            <div className="space-y-2">
              <Link
                to={`/merchant/campaigns/${id}/edit`}
                className="block w-full text-center btn btn-primary"
              >
                Editar Campanha
              </Link>
              <button className="block w-full text-center px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50">
                Compartilhar
              </button>
              <button className="block w-full text-center px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50">
                Pausar Campanha
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
