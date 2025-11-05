import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import api from '../../services/api';

export default function ValidateCouponScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleValidate = async () => {
    if (!code.trim()) {
      Alert.alert('Erro', 'Digite o código do cupom');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/coupons/${code}/redeem`);
      setResult(response.data.data);
      setCode('');
      Alert.alert('Sucesso!', 'Cupom validado com sucesso! ✅');
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.message || 'Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR scanner using expo-camera or expo-barcode-scanner
    Alert.alert('Scanner QR', 'Funcionalidade de scanner QR em desenvolvimento');
  };

  const handleReset = () => {
    setResult(null);
    setCode('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Validar Cupom</Text>
        <Text style={styles.subtitle}>
          Digite o código do cupom ou escaneie o QR code apresentado pelo cliente.
        </Text>

        {!result ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Código do Cupom</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(text) => setCode(text.toUpperCase())}
                placeholder="PIZZA-ABC123-001"
                placeholderTextColor="#999"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
                onPress={handleValidate}
                disabled={loading || !code.trim()}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Validando...' : 'Validar Cupom'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleScanQR}
              >
                <Text style={styles.buttonTextSecondary}>📷 Escanear QR</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✅</Text>
            </View>

            <Text style={styles.successTitle}>Cupom Validado!</Text>

            <View style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Código:</Text>
                <Text style={styles.resultValue}>{result.code}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cliente:</Text>
                <Text style={styles.resultValue}>{result.user?.name || 'N/A'}</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Campanha:</Text>
                <Text style={[styles.resultValue, styles.resultWrap]}>
                  {result.campaign?.title}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Valor:</Text>
                <Text style={[styles.resultValue, styles.resultPrice]}>
                  R$ {Number(result.campaign?.pricePromo).toFixed(2)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Resgatado em:</Text>
                <Text style={styles.resultValue}>
                  {new Date(result.redeemedAt).toLocaleString('pt-BR')}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleReset}
            >
              <Text style={styles.buttonText}>Validar Próximo Cupom</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Instruções</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              1. Peça ao cliente para mostrar o cupom
            </Text>
            <Text style={styles.instructionItem}>
              2. Escaneie o QR code ou digite o código
            </Text>
            <Text style={styles.instructionItem}>
              3. Verifique os dados da campanha
            </Text>
            <Text style={styles.instructionItem}>
              4. O cupom será marcado como usado (não pode ser reutilizado)
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonTextSecondary: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
  },
  resultWrap: {
    flex: 1,
    marginLeft: 8,
  },
  resultPrice: {
    color: '#22c55e',
    fontSize: 16,
  },
  instructionsCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
