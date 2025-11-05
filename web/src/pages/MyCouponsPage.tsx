import { useQuery } from 'react-query';
import { useState } from 'react';
import api from '@/services/api';

export default function MyCouponsPage() {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

  const { data: coupons, isLoading } = useQuery('myCoupons', async () => {
    const response = await api.get('/coupons/my');
    return response.data.data;
  });

  const handleShowQR = async (couponId: string) => {
    try {
      const response = await api.get(`/coupons/${couponId}/qr`);
      setSelectedCoupon(response.data.data);
    } catch (error) {
      console.error('Error loading QR code:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Meus Cupons</h1>

      {!coupons || coupons.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Você ainda não tem cupons.</p>
          <a href="/" className="btn btn-primary inline-block">
            Ver Promoções
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon: any) => {
            const isExpired = new Date(coupon.expiresAt) < new Date();
            const isRedeemed = coupon.status === 'REDEEMED';

            return (
              <div key={coupon.id} className="card">
                <div className="flex gap-6">
                  {/* Campaign Image */}
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0">
                    {coupon.campaign.imageUrl ? (
                      <img
                        src={coupon.campaign.imageUrl}
                        alt={coupon.campaign.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        🎫
                      </div>
                    )}
                  </div>

                  {/* Coupon Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {coupon.campaign.title}
                        </h3>
                        <p className="text-sm text-gray-600">{coupon.campaign.merchant.name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          isRedeemed
                            ? 'bg-green-100 text-green-800'
                            : isExpired
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isRedeemed ? 'Usado' : isExpired ? 'Expirado' : 'Disponível'}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {Number(coupon.campaign.pricePromo).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Valor original: R$ {Number(coupon.campaign.priceOriginal).toFixed(2)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm text-gray-600">
                        <strong>Código:</strong> <span className="font-mono">{coupon.code}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Válido até:</strong>{' '}
                        {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                      </div>
                      {isRedeemed && coupon.redeemedAt && (
                        <div className="text-sm text-green-600">
                          <strong>Usado em:</strong>{' '}
                          {new Date(coupon.redeemedAt).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>

                    {!isRedeemed && !isExpired && (
                      <button
                        onClick={() => handleShowQR(coupon.id)}
                        className="btn btn-primary"
                      >
                        Mostrar QR Code
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      {selectedCoupon && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCoupon(null)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">QR Code do Cupom</h2>

              {selectedCoupon.qrCodeUrl && (
                <img
                  src={selectedCoupon.qrCodeUrl}
                  alt="QR Code"
                  className="w-full max-w-sm mx-auto mb-4"
                />
              )}

              <div className="mb-4">
                <div className="text-lg font-semibold">{selectedCoupon.campaign.title}</div>
                <div className="text-gray-600">{selectedCoupon.campaign.merchant.name}</div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600">Código do Cupom</div>
                <div className="text-2xl font-mono font-bold">{selectedCoupon.code}</div>
              </div>

              <div className="text-3xl font-bold text-green-600 mb-4">
                R$ {Number(selectedCoupon.campaign.pricePromo).toFixed(2)}
              </div>

              <div className="text-sm text-gray-600 mb-6">
                <p className="mb-2">
                  <strong>Endereço:</strong> {selectedCoupon.campaign.merchant.city},{' '}
                  {selectedCoupon.campaign.merchant.state}
                </p>
                {selectedCoupon.campaign.merchant.phone && (
                  <p>
                    <strong>Telefone:</strong> {selectedCoupon.campaign.merchant.phone}
                  </p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  📱 Mostre este QR code ou o código ao estabelecimento para resgatar seu cupom.
                </p>
              </div>

              <button
                onClick={() => setSelectedCoupon(null)}
                className="btn btn-primary w-full"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
