import { useQuery } from 'react-query';
import api from '@/services/api';

export default function HomePage() {
  const { data, isLoading } = useQuery('campaigns', async () => {
    const response = await api.get('/campaigns');
    return response.data.data;
  });

  return (
    <div className="container py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">GoDescontos</h1>
        <p className="text-gray-600 mt-2">As melhores promoções perto de você</p>
      </header>

      {isLoading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((campaign: any) => (
            <div key={campaign.id} className="card">
              <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
              <p className="text-gray-600 mb-4">{campaign.shortDescription}</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gray-400 line-through">R$ {campaign.priceOriginal}</span>
                  <span className="text-2xl font-bold text-green-600 ml-2">
                    R$ {campaign.pricePromo}
                  </span>
                </div>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  -{campaign.discountPercent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
