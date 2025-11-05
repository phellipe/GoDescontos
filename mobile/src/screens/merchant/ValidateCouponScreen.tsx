import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import api from '../../services/api';

export default function ValidateCouponScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermission();
  }, []);

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
    if (hasPermission === null) {
      Alert.alert('Aguarde', 'Verificando permissões de câmera...');
      return;
    }
    if (hasPermission === false) {
      Alert.alert(
        'Permissão negada',
        'É necessário permitir o acesso à câmera para escanear QR codes.'
      );
      return;
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);

    try {
      // Try to parse QR code data (could be JSON or plain code)
      try {
        const parsed = JSON.parse(data);
        if (parsed.code) {
          setCode(parsed.code);
          setShowScanner(false);
          return;
        }
      } catch {
        // Not JSON, use as-is
      }

      // Use the scanned data directly as code
      setCode(data.toUpperCase());
      setShowScanner(false);
    } catch (err) {
      Alert.alert('Erro', 'Erro ao processar QR code');
    }
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

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Escanear QR Code</Text>
            <TouchableOpacity
              onPress={() => setShowScanner(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scannerView}>
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainText}>Escanear Novamente</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.scannerInstructions}>
            <Text style={styles.scannerInstructionsText}>
              Posicione o QR code do cupom dentro do quadro
            </Text>
          </View>
        </View>
      </Modal>
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
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#000',
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  scannerView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerInstructions: {
    padding: 20,
    backgroundColor: '#000',
  },
  scannerInstructionsText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});
