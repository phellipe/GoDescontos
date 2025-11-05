import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@/services/api';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      alert('Cadastro realizado com sucesso! Faça login para continuar.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto card">
        <h2 className="text-2xl font-bold mb-2">Criar Conta</h2>
        <p className="text-gray-600 mb-6">
          Preencha os dados abaixo para criar sua conta no GoDescontos
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nome Completo</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Seu nome completo"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="seu@email.com"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Senha</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Mínimo 6 caracteres"
              minLength={6}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Confirmar Senha</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Digite a senha novamente"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Tipo de Conta</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="USER">Cliente</option>
              <option value="MERCHANT">Lojista</option>
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {formData.role === 'MERCHANT'
                ? 'Você poderá criar e gerenciar campanhas de descontos'
                : 'Você poderá comprar e resgatar cupons de desconto'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
