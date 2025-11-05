import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import ImageUpload from '@/components/ImageUpload';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // TODO: Get merchantId from user profile
  const merchantId = 'merchant-id-here';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    shortDescription: '',
    priceOriginal: '',
    pricePromo: '',
    category: 'Alimentação',
    tags: '',
    city: '',
    state: '',
    startAt: '',
    endAt: '',
    totalQuantity: '100',
    terms: '',
    imageUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = {
        merchantId,
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription || undefined,
        priceOriginal: parseFloat(formData.priceOriginal),
        pricePromo: parseFloat(formData.pricePromo),
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        city: formData.city,
        state: formData.state,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: new Date(formData.endAt).toISOString(),
        totalQuantity: parseInt(formData.totalQuantity),
        terms: formData.terms || undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      const response = await api.post('/merchant/campaigns', data);
      const campaign = response.data.data;

      alert('Campanha criada com sucesso!');
      navigate(`/merchant/campaigns/${campaign.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar campanha');
    } finally {
      setLoading(false);
    }
  };

  const discountPercent = formData.priceOriginal && formData.pricePromo
    ? Math.round(((parseFloat(formData.priceOriginal) - parseFloat(formData.pricePromo)) / parseFloat(formData.priceOriginal)) * 100)
    : 0;

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nova Campanha</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Título da Campanha *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="Ex: Pizza Grande + Refrigerante 2L"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Descrição Curta
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Resumo em uma linha"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Descrição Completa *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows={4}
                required
                placeholder="Descreva todos os detalhes da promoção..."
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Categoria *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="Alimentação">Alimentação</option>
                <option value="Fitness">Fitness</option>
                <option value="Beleza">Beleza & Estética</option>
                <option value="Serviços">Serviços</option>
                <option value="Entretenimento">Entretenimento</option>
                <option value="Educação">Educação</option>
                <option value="Saúde">Saúde</option>
                <option value="Viagens">Viagens</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="pizza, delivery, italiano"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Preços</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Preço Original *
              </label>
              <input
                type="number"
                name="priceOriginal"
                value={formData.priceOriginal}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                min="0"
                required
                placeholder="89.90"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Preço Promocional *
              </label>
              <input
                type="number"
                name="pricePromo"
                value={formData.pricePromo}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                step="0.01"
                min="0"
                required
                placeholder="49.90"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Desconto
              </label>
              <div className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-2xl font-bold text-red-600">
                {discountPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Localização</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Cidade *
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="São Paulo"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Estado (UF) *
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Validade</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Data de Início *
              </label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Data de Término *
              </label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Quantidade de Cupons *
              </label>
              <input
                type="number"
                name="totalQuantity"
                value={formData.totalQuantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                min="1"
                required
              />
            </div>
          </div>
        </div>

        {/* Terms & Image */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Termos e Imagem</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Termos e Condições
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
                rows={3}
                placeholder="Ex: Válido de segunda a quinta. Não acumulativo com outras promoções..."
              />
            </div>

            <div>
              <ImageUpload
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                label="Imagem da Campanha"
                placeholder="Clique para fazer upload da imagem da campanha"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn btn-primary py-3 text-lg"
          >
            {loading ? 'Criando...' : 'Criar Campanha'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/merchant/campaigns')}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> A campanha será criada como rascunho. Após a criação, você
            poderá revisá-la e publicá-la quando estiver pronta.
          </p>
        </div>
      </form>
    </div>
  );
}
