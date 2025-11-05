import { useState } from 'react';
import api from '@/services/api';

export default function ValidateCouponPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post(`/coupons/${code}/redeem`);
      setResult(response.data.data);
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR scanner using a library like react-qr-reader
    alert('Scanner QR - Implementar com biblioteca de scanner');
  };

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Validar Cupom</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Verificar Cupom do Cliente</h2>
        <p className="text-gray-600 mb-6">
          Digite o código do cupom ou escaneie o QR code apresentado pelo cliente.
        </p>

        <form onSubmit={handleValidate} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Código do Cupom
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="PIZZA-ABC123-001"
              className="w-full px-4 py-3 border rounded-lg text-lg font-mono"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !code}
              className="flex-1 btn btn-primary py-3"
            >
              {loading ? 'Validando...' : 'Validar Cupom'}
            </button>
            <button
              type="button"
              onClick={handleScanQR}
              className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50"
            >
              📷 Escanear QR
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-100 border border-red-400 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="font-semibold text-red-900">Erro na Validação</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-green-100 border-2 border-green-500 rounded-lg">
            <div className="text-center mb-4">
              <span className="text-6xl">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-green-900 text-center mb-4">
              Cupom Validado com Sucesso!
            </h3>

            <div className="bg-white rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Código:</span>
                <span className="font-mono font-semibold">{result.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-semibold">{result.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Campanha:</span>
                <span className="font-semibold">{result.campaign?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-semibold text-green-600">
                  R$ {Number(result.campaign?.pricePromo).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resgatado em:</span>
                <span className="font-semibold">
                  {new Date(result.redeemedAt).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setCode('');
              }}
              className="w-full mt-4 btn btn-primary"
            >
              Validar Próximo Cupom
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="card mt-6">
        <h3 className="font-semibold text-lg mb-3">📋 Instruções</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Peça ao cliente para mostrar o cupom (QR code ou código)</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Escaneie o QR code com a câmera ou digite o código manualmente</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Verifique os dados da campanha e do cliente</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Após confirmação, o cupom será marcado como usado (não pode ser reutilizado)</span>
          </li>
        </ul>
      </div>

      {/* Stats */}
      <div className="card mt-6 bg-blue-50">
        <h3 className="font-semibold text-lg mb-3">💡 Dica</h3>
        <p className="text-gray-700">
          Para facilitar o atendimento, mantenha esta página aberta durante o expediente.
          Você pode adicionar um atalho na tela inicial do seu dispositivo para acesso rápido.
        </p>
      </div>
    </div>
  );
}
