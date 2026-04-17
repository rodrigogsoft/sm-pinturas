import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Chip,
  ActivityIndicator,
  Divider,
  Portal,
  Modal,
  IconButton,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ExcedenteWizard } from '../components/ExcedenteWizard';
import { MedicoesService } from '../services/medicoes.service';

interface AlocacaoParaMedicao {
  id: string;
  id_sessao?: string;
  id_colaborador?: string;
  id_item_ambiente?: string;
  item_ambiente?: {
    id?: string;
    area_item?: number;
    area_planejada?: number;
    item?: {
      id?: string;
      nome?: string;
      unidade?: string;
    };
    ambiente?: {
      id?: string;
      nome?: string;
      pavimento?: {
        nome?: string;
        obra?: {
          id?: string;
          nome?: string;
        };
      };
    };
  };
  colaborador?: {
    id?: string;
    nome_completo?: string;
  };
  ambiente?: {
    id?: string;
    nome?: string;
    pavimento?: {
      nome?: string;
      obra?: {
        id?: string;
        nome?: string;
      };
    };
  };
  nome_obra?: string;
  nome_ambiente?: string;
  nome_servico?: string;
  data_inicio: string;
  data_conclusao: string | null;
  status: string;
}

interface Medicao {
  id: number;
  qtd_executada: number;
  data_medicao: string;
  justificativa_excedente?: string;
  foto_excedente?: string;
}

/**
 * RF06 - Tela de Medições
 * 
 * Funcionalidades:
 * - Lista alocações concluídas sem medição
 * - Permite registrar medição
 * - Integra com RF08 (ExcedenteWizard) quando qtd > área planejada
 * - Validações de margem de tolerância
 */
export const MedicoesScreen: React.FC = () => {
  const [alocacoes, setAlocacoes] = useState<AlocacaoParaMedicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlocacao, setSelectedAlocacao] = useState<AlocacaoParaMedicao | null>(null);
  const [qtdExecutada, setQtdExecutada] = useState('');
  const [showExcedenteWizard, setShowExcedenteWizard] = useState(false);
  const [medicaoModal, setMedicaoModal] = useState(false);

  useEffect(() => {
    carregarAlocacoesConcluidas();
  }, []);

  const toNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getAreaPlanejada = (alocacao: AlocacaoParaMedicao): number =>
    toNumber(alocacao.item_ambiente?.area_planejada ?? alocacao.item_ambiente?.area_item);

  const getUnidade = (alocacao: AlocacaoParaMedicao): string =>
    alocacao.item_ambiente?.item?.unidade || 'm²';

  const getNomeServico = (alocacao: AlocacaoParaMedicao): string =>
    alocacao.item_ambiente?.item?.nome || alocacao.nome_servico || 'Serviço';

  const getNomeObra = (alocacao: AlocacaoParaMedicao): string =>
    alocacao.item_ambiente?.ambiente?.pavimento?.obra?.nome ||
    alocacao.ambiente?.pavimento?.obra?.nome ||
    alocacao.nome_obra ||
    'Obra';

  const getNomeAmbiente = (alocacao: AlocacaoParaMedicao): string =>
    alocacao.item_ambiente?.ambiente?.nome ||
    alocacao.ambiente?.nome ||
    alocacao.nome_ambiente ||
    'Ambiente';

  const carregarAlocacoesConcluidas = async () => {
    try {
      setLoading(true);
      // Buscar alocações com status CONCLUIDO e sem medição
      const resultado = await MedicoesService.listarAlocacoesSemMedicao();
      setAlocacoes(resultado);
    } catch (error) {
      console.error('Erro ao carregar alocações:', error);
      Alert.alert('Erro', 'Falha ao carregar alocações concluídas');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarAlocacoesConcluidas();
    setRefreshing(false);
  };

  const abrirModalMedicao = (alocacao: AlocacaoParaMedicao) => {
    setSelectedAlocacao(alocacao);
    setQtdExecutada('');
    setMedicaoModal(true);
  };

  const fecharModalMedicao = () => {
    setSelectedAlocacao(null);
    setQtdExecutada('');
    setMedicaoModal(false);
  };

  const verificarExcedente = () => {
    if (!selectedAlocacao) return;

    const qtd = parseFloat(qtdExecutada);
    const areaPlaneada = getAreaPlanejada(selectedAlocacao);

    // RF08: Se exceder área planejada, abrir wizard
    if (qtd > areaPlaneada) {
      setMedicaoModal(false);
      setShowExcedenteWizard(true);
      return;
    }

    // Medição normal (sem excedente)
    registrarMedicaoNormal();
  };

  const registrarMedicaoNormal = async () => {
    if (!selectedAlocacao) return;

    try {
      const qtd = parseFloat(qtdExecutada);
      const areaPlanejada = getAreaPlanejada(selectedAlocacao);
      const idItemAmbiente = selectedAlocacao.id_item_ambiente || selectedAlocacao.item_ambiente?.id;
      const idColaborador = selectedAlocacao.id_colaborador || selectedAlocacao.colaborador?.id;
      const percentualConclusao =
        areaPlanejada > 0 ? Number(((qtd / areaPlanejada) * 100).toFixed(2)) : undefined;

      await MedicoesService.criar({
        id_alocacao: selectedAlocacao.id,
        id_alocacao_item: selectedAlocacao.id,
        id_colaborador: idColaborador,
        id_item_ambiente: idItemAmbiente,
        qtd_executada: qtd,
        area_planejada: areaPlanejada || undefined,
        percentual_conclusao_item: percentualConclusao,
        data_medicao: new Date().toISOString(),
      });

      Alert.alert('Sucesso', 'Medição registrada com sucesso!');
      fecharModalMedicao();
      await carregarAlocacoesConcluidas();
    } catch (error) {
      console.error('Erro ao registrar medição:', error);
      Alert.alert('Erro', 'Falha ao registrar medição');
    }
  };

  const handleExcedenteConfirm = async (data: any) => {
    if (!selectedAlocacao) return;

    try {
      // Upload da foto primeiro
      let fotoUrl = null;
      if (data.foto_evidencia) {
        fotoUrl = await MedicoesService.uploadFoto(data.foto_evidencia);
      }

      // Criar medição com excedente
      const areaPlanejada = getAreaPlanejada(selectedAlocacao);
      const idItemAmbiente = selectedAlocacao.id_item_ambiente || selectedAlocacao.item_ambiente?.id;
      const idColaborador = selectedAlocacao.id_colaborador || selectedAlocacao.colaborador?.id;
      const percentualConclusao =
        areaPlanejada > 0
          ? Number(((data.qtd_executada / areaPlanejada) * 100).toFixed(2))
          : undefined;

      await MedicoesService.criar({
        id_alocacao: selectedAlocacao.id,
        id_alocacao_item: selectedAlocacao.id,
        id_colaborador: idColaborador,
        id_item_ambiente: idItemAmbiente,
        qtd_executada: data.qtd_executada,
        area_planejada: areaPlanejada || undefined,
        percentual_conclusao_item: percentualConclusao,
        data_medicao: new Date().toISOString(),
        justificativa: data.justificativa,
        foto_evidencia_url: fotoUrl,
        justificativa_excedente: data.justificativa,
        foto_excedente: fotoUrl,
      });

      Alert.alert(
        'Excedente Registrado',
        'A medição foi registrada e o excedente será analisado pelo gestor.',
      );

      setShowExcedenteWizard(false);
      setSelectedAlocacao(null);
      await carregarAlocacoesConcluidas();
    } catch (error) {
      console.error('Erro ao registrar excedente:', error);
      Alert.alert('Erro', 'Falha ao registrar medição com excedente');
    }
  };

  const calcularDiasDesdeConlusao = (dataConclusao: string): number => {
    const hoje = new Date();
    const conclusao = new Date(dataConclusao);
    const diff = hoje.getTime() - conclusao.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const renderAlocacaoCard = (alocacao: AlocacaoParaMedicao) => {
    const diasPendente = alocacao.data_conclusao
      ? calcularDiasDesdeConlusao(alocacao.data_conclusao)
      : 0;
    const urgente = diasPendente > 3;

    return (
      <Card key={alocacao.id} style={[styles.card, urgente && styles.cardUrgente]}>
        <Card.Content>
          {/* Cabeçalho */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Icon
                name="checkbox-marked-circle"
                size={24}
                color={urgente ? '#F44336' : '#4CAF50'}
              />
              <View style={styles.headerText}>
                <Text style={styles.obraText}>
                  {getNomeObra(alocacao)}
                </Text>
                <Text style={styles.localText}>
                  {alocacao.item_ambiente?.ambiente?.pavimento?.nome || 'Pavimento'} -{' '}
                  {getNomeAmbiente(alocacao)}
                </Text>
              </View>
            </View>
            {urgente && (
              <Chip icon="alert" mode="flat" style={styles.chipUrgente} textStyle={styles.chipUrgenteText}>
                Urgente
              </Chip>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Detalhes do Item */}
          <View style={styles.itemBox}>
            <Icon name="format-paint" size={20} color="#666" />
            <Text style={styles.itemText}>{getNomeServico(alocacao)}</Text>
          </View>

          {/* Área Planejada */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Icon name="ruler-square" size={18} color="#666" />
              <Text style={styles.infoLabel}>Área Planejada:</Text>
            </View>
            <Text style={styles.infoValue}>
              {getAreaPlanejada(alocacao).toFixed(2)}{' '}
              {getUnidade(alocacao)}
            </Text>
          </View>

          {/* Data de Conclusão */}
          {alocacao.data_conclusao && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon name="calendar-check" size={18} color="#666" />
                <Text style={styles.infoLabel}>Concluído há:</Text>
              </View>
              <Text style={[styles.infoValue, urgente && styles.textUrgente]}>
                {diasPendente} {diasPendente === 1 ? 'dia' : 'dias'}
              </Text>
            </View>
          )}

          {urgente && (
            <View style={styles.alertBox}>
              <Icon name="alert-circle" size={18} color="#F44336" />
              <Text style={styles.alertText}>
                RF09: Tarefa concluída há mais de 3 dias sem medição
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions>
          <Button
            mode="contained"
            icon="clipboard-text"
            onPress={() => abrirModalMedicao(alocacao)}
          >
            Registrar Medição
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando medições pendentes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Medições Pendentes</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{alocacoes.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxUrgente]}>
            <Text style={styles.statNumber}>
              {alocacoes.filter(a => a.data_conclusao && calcularDiasDesdeConlusao(a.data_conclusao) > 3).length}
            </Text>
            <Text style={styles.statLabel}>Urgentes</Text>
          </View>
        </View>
      </View>

      {/* Lista de Alocações */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {alocacoes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="check-all" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Nenhuma medição pendente</Text>
            <Text style={styles.emptySubtext}>
              Todas as tarefas concluídas já possuem medição
            </Text>
          </View>
        ) : (
          alocacoes.map(renderAlocacaoCard)
        )}
      </ScrollView>

      {/* Modal de Medição Normal */}
      <Portal>
        <Modal
          visible={medicaoModal}
          onDismiss={fecharModalMedicao}
          contentContainerStyle={styles.modalContainer}
        >
          <Card>
            <Card.Content>
              <View style={styles.modalHeader}>
                <Icon name="clipboard-text" size={32} color="#2196F3" />
                <Text style={styles.modalTitle}>Registrar Medição</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={fecharModalMedicao}
                  style={styles.closeButton}
                />
              </View>

              {selectedAlocacao && (
                <>
                  <Text style={styles.modalSubtitle}>
                    {getNomeServico(selectedAlocacao)}
                  </Text>
                  <Text style={styles.modalLocation}>
                    {getNomeObra(selectedAlocacao)} - {getNomeAmbiente(selectedAlocacao)}
                  </Text>

                  <View style={styles.areaBox}>
                    <Text style={styles.areaLabel}>Área Planejada:</Text>
                    <Text style={styles.areaValue}>
                      {getAreaPlanejada(selectedAlocacao).toFixed(2)} {getUnidade(selectedAlocacao)}
                    </Text>
                  </View>

                  <TextInput
                    label={`Quantidade Executada (${getUnidade(selectedAlocacao)})`}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    value={qtdExecutada}
                    onChangeText={setQtdExecutada}
                    style={styles.input}
                  />

                  {qtdExecutada && parseFloat(qtdExecutada) > getAreaPlanejada(selectedAlocacao) && (
                    <View style={styles.warningBox}>
                      <Icon name="alert" size={20} color="#FF9800" />
                      <Text style={styles.warningText}>
                        Excedente detectado! Será necessário justificar e tirar foto.
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card.Content>

            <Card.Actions style={styles.modalActions}>
              <Button mode="outlined" onPress={fecharModalMedicao}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={verificarExcedente}
                disabled={!qtdExecutada || parseFloat(qtdExecutada) <= 0}
              >
                Continuar
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>

      {/* Wizard de Excedentes (RF08) */}
      {selectedAlocacao && (
        <ExcedenteWizard
          visible={showExcedenteWizard}
          areaPlaneada={getAreaPlanejada(selectedAlocacao)}
          onDismiss={() => {
            setShowExcedenteWizard(false);
            setSelectedAlocacao(null);
          }}
          onConfirm={handleExcedenteConfirm}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statBoxUrgente: {
    backgroundColor: '#FFEBEE',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardUrgente: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  obraText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  localText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  chipUrgente: {
    backgroundColor: '#FFEBEE',
  },
  chipUrgenteText: {
    color: '#F44336',
    fontSize: 11,
  },
  divider: {
    marginVertical: 12,
  },
  itemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  textUrgente: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 6,
    marginTop: 12,
  },
  alertText: {
    fontSize: 12,
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    margin: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  modalLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  areaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  areaLabel: {
    fontSize: 14,
    color: '#666',
  },
  areaValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  input: {
    marginBottom: 12,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#F57C00',
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
