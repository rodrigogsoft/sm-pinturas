import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Portal,
  Modal,
  Chip,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ExcedenteFormData {
  qtd_executada: number;
  area_planejada: number;
  justificativa: string;
  foto_evidencia: string | null;
}

interface ExcedenteWizardProps {
  visible: boolean;
  areaPlaneada: number;
  onDismiss: () => void;
  onConfirm: (data: ExcedenteFormData) => void;
}

/**
 * RF08 - Wizard de Excedentes
 * 
 * Fluxo:
 * 1. Detecta que qtd_executada > area_planejada
 * 2. Abre modal exigindo:
 *    - Justificativa (mínimo 20 caracteres)
 *    - Foto de evidência
 * 3. Não permite prosseguir sem os dois
 */
export const ExcedenteWizard: React.FC<ExcedenteWizardProps> = ({
  visible,
  areaPlaneada,
  onDismiss,
  onConfirm,
}) => {
  const [step, setStep] = useState(1); // 1: Info, 2: Justificativa, 3: Foto
  const [qtdExecutada, setQtdExecutada] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const excedente = parseFloat(qtdExecutada) - areaPlaneada;
  const percentualExcedente = ((excedente / areaPlaneada) * 100).toFixed(1);

  const tirarFoto = async () => {
    try {
      // Mock: image-picker nao instalado
      setFotoUri('mock://foto-evidencia');
      Alert.alert('Sucesso', 'Foto mock gerada! Agora confirme a medicao.');
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Falha ao gerar foto mock');
    }
  };

  const validarEConfirmar = () => {
    // Validação: Justificativa mínima
    if (!justificativa || justificativa.trim().length < 20) {
      Alert.alert('Validação', 'A justificativa deve ter no mínimo 20 caracteres');
      return;
    }

    // Validação: Foto obrigatória
    if (!fotoUri) {
      Alert.alert('Validação', 'É obrigatório tirar uma foto de evidência do excedente');
      return;
    }

    // Tudo OK, confirmar
    onConfirm({
      qtd_executada: parseFloat(qtdExecutada),
      area_planejada: areaPlaneada,
      justificativa: justificativa.trim(),
      foto_evidencia: fotoUri,
    });

    // Reset
    setStep(1);
    setQtdExecutada('');
    setJustificativa('');
    setFotoUri(null);
  };

  const handleCancel = () => {
    setStep(1);
    setQtdExecutada('');
    setJustificativa('');
    setFotoUri(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleCancel}
        contentContainerStyle={styles.modalContainer}
      >
        <Card style={styles.card}>
          <Card.Content>
            {/* Step 1: Informações sobre o excedente */}
            {step === 1 && (
              <>
                <View style={styles.header}>
                  <Icon name="alert" size={48} color="#FF9800" />
                  <Title style={styles.title}>Excedente Detectado!</Title>
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Área Planejada:</Text>
                    <Text style={styles.value}>{areaPlaneada.toFixed(2)} m²</Text>
                  </View>
                  
                  <TextInput
                    label="Quantidade Executada (m²)"
                    mode="outlined"
                    keyboardType="decimal-pad"
                    value={qtdExecutada}
                    onChangeText={setQtdExecutada}
                    style={styles.input}
                  />

                  {parseFloat(qtdExecutada) > areaPlaneada && (
                    <>
                      <View style={styles.excedenteBox}>
                        <Icon name="trending-up" size={24} color="#F44336" />
                        <View style={styles.excedenteInfo}>
                          <Text style={styles.excedenteLabel}>Excedente:</Text>
                          <Text style={styles.excedenteValue}>
                            +{excedente.toFixed(2)} m² ({percentualExcedente}%)
                          </Text>
                        </View>
                      </View>

                      <Card style={styles.warningCard}>
                        <Card.Content>
                          <Paragraph style={styles.warningText}>
                            ⚠️ <Text style={styles.bold}>RF08 - Validação de Excedentes:</Text>
                            {'\n\n'}
                            Quando a medição excede a área planejada, é obrigatório:
                            {'\n'}• Justificativa detalhada (mín. 20 caracteres)
                            {'\n'}• Foto de evidência do local
                          </Paragraph>
                        </Card.Content>
                      </Card>
                    </>
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={handleCancel} style={styles.button}>
                    Cancelar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setStep(2)}
                    disabled={!qtdExecutada || parseFloat(qtdExecutada) <= areaPlaneada}
                    style={styles.button}
                  >
                    Próximo
                  </Button>
                </View>
              </>
            )}

            {/* Step 2: Justificativa */}
            {step === 2 && (
              <>
                <View style={styles.header}>
                  <Icon name="text-box" size={48} color="#2196F3" />
                  <Title style={styles.title}>Justificativa Obrigatória</Title>
                </View>

                <Paragraph style={styles.description}>
                  Explique o motivo do excedente de <Text style={styles.bold}>{excedente.toFixed(2)} m²</Text>:
                </Paragraph>

                <TextInput
                  label="Justificativa"
                  mode="outlined"
                  multiline
                  numberOfLines={5}
                  value={justificativa}
                  onChangeText={setJustificativa}
                  placeholder="Ex: Área real medida no local difere do projeto inicial. Cliente solicitou pintura adicional na área X."
                  style={styles.textArea}
                />

                <View style={styles.characterCount}>
                  <Text style={justificativa.length >= 20 ? styles.countValid : styles.countInvalid}>
                    {justificativa.length} / 20 caracteres mínimos
                  </Text>
                  {justificativa.length >= 20 && (
                    <Icon name="check-circle" size={20} color="#4CAF50" />
                  )}
                </View>

                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={() => setStep(1)} style={styles.button}>
                    Voltar
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => setStep(3)}
                    disabled={justificativa.length < 20}
                    style={styles.button}
                  >
                    Próximo
                  </Button>
                </View>
              </>
            )}

            {/* Step 3: Foto de Evidência */}
            {step === 3 && (
              <>
                <View style={styles.header}>
                  <Icon name="camera" size={48} color="#4CAF50" />
                  <Title style={styles.title}>Foto de Evidência</Title>
                </View>

                <Paragraph style={styles.description}>
                  Tire uma foto do local para comprovar o excedente:
                </Paragraph>

                {!fotoUri ? (
                  <TouchableOpacity style={styles.cameraButton} onPress={tirarFoto}>
                    <Icon name="camera-plus" size={64} color="#666" />
                    <Text style={styles.cameraText}>Tirar Foto</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.photoContainer}>
                    <Image source={{ uri: fotoUri }} style={styles.photo} resizeMode="cover" />
                    <Button
                      mode="outlined"
                      icon="camera-retake"
                      onPress={tirarFoto}
                      style={styles.retakeButton}
                    >
                      Nova Foto
                    </Button>
                  </View>
                )}

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Resumo:</Text>
                  <View style={styles.summaryRow}>
                    <Icon name="ruler" size={20} color="#666" />
                    <Text style={styles.summaryText}>
                      Excedente: <Text style={styles.bold}>+{excedente.toFixed(2)} m²</Text>
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Icon name="check-circle" size={20} color={justificativa.length >= 20 ? '#4CAF50' : '#999'} />
                    <Text style={styles.summaryText}>Justificativa: {justificativa.length} caracteres</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Icon name="camera" size={20} color={fotoUri ? '#4CAF50' : '#999'} />
                    <Text style={styles.summaryText}>Foto: {fotoUri ? 'Capturada ✓' : 'Pendente'}</Text>
                  </View>
                </View>

                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={() => setStep(2)} style={styles.button}>
                    Voltar
                  </Button>
                  <Button
                    mode="contained"
                    icon="check"
                    onPress={validarEConfirmar}
                    disabled={!fotoUri}
                    style={styles.button}
                  >
                    Confirmar Medição
                  </Button>
                </View>
              </>
            )}
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  card: {
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBox: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  excedenteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  excedenteInfo: {
    marginLeft: 12,
  },
  excedenteLabel: {
    fontSize: 12,
    color: '#666',
  },
  excedenteValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F44336',
  },
  warningCard: {
    backgroundColor: '#FFF9C4',
    marginVertical: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    marginBottom: 8,
  },
  characterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  countValid: {
    color: '#4CAF50',
    fontSize: 12,
  },
  countInvalid: {
    color: '#F44336',
    fontSize: 12,
  },
  cameraButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  cameraText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  photoContainer: {
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
