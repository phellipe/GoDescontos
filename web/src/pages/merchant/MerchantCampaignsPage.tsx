import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import api from '@/services/api';

export default function MerchantCampaignsPage() {
  // TODO: Get merchantId from user profile
  const merchantId = 'merchant-id-here';

  const { data, isLoading } = useQuery(
    ['merchantCampaigns', merchantId],
    async () => {
      const response = await api.get(`/merchant/campaigns?merchantId=${merchantId}`);
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

  const campaigns = data || [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Minhas Campanhas</h1>
          <p className="text-gray-600 mt-2">{campaigns.length} campanhas no total</p>
        </div>
        <Link
          to="/merchant/campaigns/create"
          className="btn btn-primary"
        >
          + Nova Campanha
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
            Todas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Ativas
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Rascunho
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Encerradas
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Você ainda não criou nenhuma campanha.</p>
          <Link
            to="/merchant/campaigns/create"
            className="btn btn-primary inline-block"
          >
            Criar Primeira Campanha
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign: any) => (
            <div key={campaign.id} className="card hover:shadow-lg transition">
              <div className="flex gap-6">
                {/* Image */}
                <div className="w-48 h-32 bg-gray-200 rounded-lg flex-shrink-0">
                  {campaign.imageUrl ? (
                    <img
                      src={campaign.imageUrl}
                      alt={campaign.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Sem imagem
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {campaign.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {campaign.shortDescription || campaign.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        campaign.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {campaign.status === 'PUBLISHED'
                        ? 'Ativa'
                        : campaign.status === 'DRAFT'
                        ? 'Rascunho'
                        : 'Encerrada'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Preço</div>
                      <div className="font-semibold">
                        <span className="text-gray-400 line-through mr-2">
                          R$ {Number(campaign.priceOriginal).toFixed(2)}
                        </span>
                        <span className="text-green-600">
                          R$ {Number(campaign.pricePromo).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Desconto</div>
                      <div className="font-semibold text-red-600">-{campaign.discountPercent}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Cupons</div>
                      <div className="font-semibold">
                        {campaign.redeemedQuantity}/{campaign.totalQuantity}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Visualizações</div>
                      <div className="font-semibold">{campaign.viewCount}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      to={`/merchant/campaigns/${campaign.id}`}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      Ver Detalhes
                    </Link>
                    <Link
                      to={`/merchant/campaigns/${campaign.id}/edit`}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      Editar
                    </Link>
                    {campaign.status === 'DRAFT' && (
                      <button className="text-green-600 hover:underline text-sm font-semibold">
                        Publicar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
