import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Button,
  ActivityIndicator,
  Portal,
  Modal,
  RadioButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../../services/api';
import {
  AlocacoesService,
  ConflictError,
  AlocacaoTarefa,
} from '../../services/alocacoes.service';

interface Colaborador {
  id: string;
  nome_completo: string;
  cpf: string;
  status: 'livre' | 'ocupado' | 'alocando';
  alocacao_id?: string;
}

interface Ambiente {
  id: string;
  nome: string;
  area_m2: number;
  pavimento?: {
    id: string;
    nome: string;
  } | null;
  ocupado: boolean;
  colaborador_alocado?: {
    id: string;
    nome: string;
  };
  alocacao_id?: string;
}

interface ItemAmbiente {
  id: string;
  area_planejada?: number;
  area_item?: number;
  tabelaPreco?: {
    servico?: {
      nome?: string;
    };
  };
}

export const AlocacaoScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { sessao, obra } = route.params;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoTarefa[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [colaboradorSelecionadoId, setColaboradorSelecionadoId] = useState<string | null>(null);
  const [itemSelectorVisible, setItemSelectorVisible] = useState(false);
  const [itensAmbientePendentes, setItensAmbientePendentes] = useState<ItemAmbiente[]>([]);
  const [itemSelecionadoId, setItemSelecionadoId] = useState<string | null>(null);
  const [colaboradorPendente, setColaboradorPendente] = useState<Colaborador | null>(null);
  const [ambientePendente, setAmbientePendente] = useState<Ambiente | null>(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [alocacoesAtivas, stats, colaboradoresResp, ambientesResp] = await Promise.all([
        AlocacoesService.listarAtivas(sessao.id),
        AlocacoesService.obterEstatisticas(sessao.id),
        apiClient.getColaboradores(1, 200),
        apiClient.getAmbientesByObra(obra.id_obra || obra.id),
      ]);

      const colaboradoresData = colaboradoresResp.data.data || colaboradoresResp.data || [];
      const ambientesData = ambientesResp.data.data || ambientesResp.data || [];

      setAlocacoes(alocacoesAtivas);
      setEstatisticas(stats);

      const colaboradoresAtualizados = colaboradoresData.map((colab: any) => {
        const alocacao = alocacoesAtivas.find(a => a.id_colaborador === colab.id);
        if (alocacao) {
          return {
            ...colab,
            status: 'ocupado' as const,
            alocacao_id: alocacao.id,
          };
        }
        return {
          ...colab,
          status: 'livre' as const,
        };
      });

      const ambientesAtualizados = ambientesData.map((amb: any) => {
        const alocacao = alocacoesAtivas.find(a => a.id_ambiente === amb.id);
        if (alocacao) {
          return {
            ...amb,
            ocupado: true,
            colaborador_alocado: {
              id: alocacao.id_colaborador,
              nome: alocacao.colaborador.nome_completo,
            },
            alocacao_id: alocacao.id,
          };
        }
        return {
          ...amb,
          ocupado: false,
        };
      });

      setColaboradores(colaboradoresAtualizados);
      setAmbientes(ambientesAtualizados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Nao foi possivel carregar os dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const getColaboradorSelecionado = () =>
    colaboradores.find(c => c.id === colaboradorSelecionadoId) || null;

  const obterItensAmbiente = async (idAmbiente: string): Promise<ItemAmbiente[]> => {
    const response = await apiClient.getItensAmbienteByAmbiente(idAmbiente);
    const data = response.data?.data || response.data || [];
    return Array.isArray(data) ? data : [];
  };

  const getItemLabel = (item: ItemAmbiente) => {
    const nomeServico = item.tabelaPreco?.servico?.nome || `Item ${item.id.slice(0, 8)}`;
    const area = Number(item.area_planejada ?? item.area_item ?? 0);
    return `${nomeServico} (${area.toFixed(2)} m2)`;
  };

  const abrirSeletorItem = (
    colaborador: Colaborador,
    ambiente: Ambiente,
    itens: ItemAmbiente[]
  ) => {
    setColaboradorPendente(colaborador);
    setAmbientePendente(ambiente);
    setItensAmbientePendentes(itens);
    setItemSelecionadoId(itens[0]?.id || null);
    setItemSelectorVisible(true);
  };

  const fecharSeletorItem = () => {
    setItemSelectorVisible(false);
    setItensAmbientePendentes([]);
    setItemSelecionadoId(null);
    setColaboradorPendente(null);
    setAmbientePendente(null);
  };

  const executarCriacaoAlocacao = async (
    colaborador: Colaborador,
    ambiente: Ambiente,
    idItemAmbiente: string
  ) => {
    setColaboradores(prev =>
      prev.map(c =>
        c.id === colaborador.id ? { ...c, status: 'alocando' as const } : c
      )
    );

    try {
      const novaAlocacao = await AlocacoesService.criar({
        id_sessao: sessao.id,
        id_ambiente: ambiente.id,
        id_colaborador: colaborador.id,
        id_item_ambiente: idItemAmbiente,
      });

      setAlocacoes(prev => [...prev, novaAlocacao]);

      setColaboradores(prev =>
        prev.map(c =>
          c.id === colaborador.id
            ? { ...c, status: 'ocupado' as const, alocacao_id: novaAlocacao.id }
            : c
        )
      );

      setAmbientes(prev =>
        prev.map(a =>
          a.id === ambiente.id
            ? {
                ...a,
                ocupado: true,
                colaborador_alocado: {
                  id: colaborador.id,
                  nome: colaborador.nome_completo,
                },
                alocacao_id: novaAlocacao.id,
              }
            : a
        )
      );

      Alert.alert('Sucesso', `${colaborador.nome_completo} alocado para ${ambiente.nome}`);
      setColaboradorSelecionadoId(null);

      const stats = await AlocacoesService.obterEstatisticas(sessao.id);
      setEstatisticas(stats);
    } catch (error: any) {
      setColaboradores(prev =>
        prev.map(c =>
          c.id === colaborador.id ? { ...c, status: 'livre' as const } : c
        )
      );

      if (error.codigo === 'AMBIENTE_OCUPADO') {
        const conflito = error as ConflictError;
        Alert.alert('Ambiente Ocupado', conflito.message);
      } else if (error.codigo === 'COLABORADOR_OCUPADO') {
        const conflito = error as ConflictError;
        Alert.alert('Colaborador Ocupado', conflito.message);
      } else {
        Alert.alert('Erro', error.message || 'Nao foi possivel criar a alocacao');
      }
    }
  };

  const handleDrop = async (colaborador: Colaborador, ambiente: Ambiente) => {
    if (!colaborador || !ambiente) return;

    if (colaborador.status !== 'livre') {
      Alert.alert('Colaborador ocupado', 'Finalize a tarefa atual primeiro.');
      return;
    }

    if (ambiente.ocupado) {
      Alert.alert(
        'Ambiente Ocupado',
        `Este ambiente esta em uso por ${ambiente.colaborador_alocado?.nome}.`
      );
      return;
    }

    await criarAlocacao(colaborador, ambiente);
  };

  const handleAlocarNoAmbiente = async (ambiente: Ambiente) => {
    const colaborador = getColaboradorSelecionado();
    if (!colaborador) {
      Alert.alert('Selecione um colaborador', 'Escolha um colaborador livre antes de alocar.');
      return;
    }
    await handleDrop(colaborador, ambiente);
  };

  const criarAlocacao = async (colaborador: Colaborador, ambiente: Ambiente) => {
    try {
      const itens = await obterItensAmbiente(ambiente.id);
      if (itens.length === 0) {
        Alert.alert(
          'Item de ambiente ausente',
          'Este ambiente nao possui item de ambiente cadastrado para alocacao 4.1.'
        );
        return;
      }

      if (itens.length > 1) {
        abrirSeletorItem(colaborador, ambiente, itens);
        return;
      }

      await executarCriacaoAlocacao(colaborador, ambiente, String(itens[0].id));
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Nao foi possivel preparar a alocacao');
    }
  };

  const confirmarAlocacaoComItem = async () => {
    if (!colaboradorPendente || !ambientePendente || !itemSelecionadoId) {
      Alert.alert('Selecao incompleta', 'Selecione um item para continuar.');
      return;
    }

    const colaborador = colaboradorPendente;
    const ambiente = ambientePendente;
    const itemId = itemSelecionadoId;

    fecharSeletorItem();
    await executarCriacaoAlocacao(colaborador, ambiente, itemId);
  };

  const handleConcluirAlocacao = async (alocacao: AlocacaoTarefa) => {
    Alert.alert(
      'Concluir Tarefa',
      `Deseja finalizar a alocacao de ${alocacao.colaborador.nome_completo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Concluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await AlocacoesService.concluir(alocacao.id, {});

              setAlocacoes(prev => prev.filter(a => a.id !== alocacao.id));

              setColaboradores(prev =>
                prev.map(c =>
                  c.id === alocacao.id_colaborador
                    ? { ...c, status: 'livre' as const, alocacao_id: undefined }
                    : c
                )
              );

              setAmbientes(prev =>
                prev.map(a =>
                  a.id === alocacao.id_ambiente
                    ? {
                        ...a,
                        ocupado: false,
                        colaborador_alocado: undefined,
                        alocacao_id: undefined,
                      }
                    : a
                )
              );

              const stats = await AlocacoesService.obterEstatisticas(sessao.id);
              setEstatisticas(stats);
            } catch (error) {
              Alert.alert('Erro', 'Nao foi possivel concluir a tarefa');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Carregando alocacoes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        {estatisticas && (
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="account-group" size={24} color="#1976d2" />
                  <Text style={styles.statValue}>{estatisticas.colaboradores_ativos}</Text>
                  <Text style={styles.statLabel}>Ativos</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="door-open" size={24} color="#FF9800" />
                  <Text style={styles.statValue}>{estatisticas.ambientes_ativos}</Text>
                  <Text style={styles.statLabel}>Em Uso</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                  <Text style={styles.statValue}>{estatisticas.concluidas}</Text>
                  <Text style={styles.statLabel}>Concluidas</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>
              <Icon name="account-group" size={20} /> Colaboradores
            </Title>
            <Paragraph style={styles.sectionHint}>
              Selecione um colaborador livre e aloque em um ambiente disponivel
            </Paragraph>

            {colaboradores.map(colaborador => (
              <View
                key={colaborador.id}
              >
                <Card
                  style={[
                    styles.colaboradorCard,
                    colaborador.status === 'ocupado' && styles.colaboradorOcupado,
                    colaborador.status === 'alocando' && styles.colaboradorAlocando,
                  ]}
                >
                  <Card.Content style={styles.colaboradorContent}>
                    <View style={styles.colaboradorInfo}>
                      <Icon
                        name={
                          colaborador.status === 'livre'
                            ? 'account-check'
                            : colaborador.status === 'alocando'
                            ? 'account-arrow-right'
                            : 'account-clock'
                        }
                        size={28}
                        color={
                          colaborador.status === 'livre'
                            ? '#4CAF50'
                            : colaborador.status === 'alocando'
                            ? '#2196F3'
                            : '#FF9800'
                        }
                      />
                      <View style={styles.colaboradorTexts}>
                        <Text style={styles.colaboradorNome}>{colaborador.nome_completo}</Text>
                        <Text style={styles.colaboradorCpf}>{colaborador.cpf}</Text>
                      </View>
                    </View>
                    <Chip
                      mode="flat"
                      style={{
                        backgroundColor:
                          colaborador.status === 'livre'
                            ? '#4CAF50'
                            : colaborador.status === 'alocando'
                            ? '#2196F3'
                            : '#FF9800',
                      }}
                      textStyle={{ color: '#fff', fontSize: 11 }}
                    >
                      {colaborador.status === 'livre' && 'LIVRE'}
                      {colaborador.status === 'ocupado' && 'OCUPADO'}
                      {colaborador.status === 'alocando' && 'ALOCANDO...'}
                    </Chip>
                  </Card.Content>
                  {colaborador.status === 'livre' && (
                    <Card.Actions>
                      <Button
                        mode={colaboradorSelecionadoId === colaborador.id ? 'contained' : 'outlined'}
                        onPress={() =>
                          setColaboradorSelecionadoId(prev =>
                            prev === colaborador.id ? null : colaborador.id
                          )
                        }
                      >
                        {colaboradorSelecionadoId === colaborador.id ? 'Selecionado' : 'Selecionar'}
                      </Button>
                    </Card.Actions>
                  )}
                </Card>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Title style={styles.sectionTitle}>
              <Icon name="door" size={20} /> Ambientes
            </Title>
            <Paragraph style={styles.sectionHint}>
              Escolha o ambiente desejado para a alocacao
            </Paragraph>

            {ambientes.map(ambiente => (
              <View
                key={ambiente.id}
              >
                  <Card
                    style={[
                      styles.ambienteCard,
                      ambiente.ocupado && styles.ambienteOcupado,
                    ]}
                  >
                    <Card.Content>
                      <View style={styles.ambienteHeader}>
                        <Text style={styles.ambienteNome}>{ambiente.nome}</Text>
                        <Chip
                          mode="flat"
                          style={{
                            backgroundColor: ambiente.ocupado ? '#F44336' : '#4CAF50',
                          }}
                          textStyle={{ color: '#fff', fontSize: 10 }}
                        >
                          {ambiente.ocupado ? 'OCUPADO' : 'DISPONIVEL'}
                        </Chip>
                      </View>
                      <Text style={styles.ambienteInfo}>
                        {ambiente.pavimento?.nome || 'Pavimento'} - {ambiente.area_m2} m2
                      </Text>
                      {ambiente.ocupado && (
                        <Text style={styles.ambienteOcupadoText}>
                          Em uso por: {ambiente.colaborador_alocado?.nome}
                        </Text>
                      )}
                    </Card.Content>
                    {!ambiente.ocupado && (
                      <Card.Actions>
                        <Button
                          mode="contained"
                          onPress={() => handleAlocarNoAmbiente(ambiente)}
                          disabled={!colaboradorSelecionadoId}
                        >
                          {colaboradorSelecionadoId ? 'Alocar selecionado aqui' : 'Selecione um colaborador'}
                        </Button>
                      </Card.Actions>
                    )}
                  </Card>
              </View>
            ))}
          </View>

          {alocacoes.length > 0 && (
            <View style={styles.section}>
              <Title style={styles.sectionTitle}>
                <Icon name="clipboard-text-clock" size={20} /> Tarefas em andamento
              </Title>

              {alocacoes.map(alocacao => (
                <Card key={alocacao.id} style={styles.alocacaoCard}>
                  <Card.Content>
                    <View style={styles.alocacaoHeader}>
                      <Text style={styles.alocacaoNome}>
                        {alocacao.colaborador.nome_completo}
                      </Text>
                      <Chip icon="clock" mode="outlined" compact>
                        {new Date(alocacao.hora_inicio).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Chip>
                    </View>
                    <Text style={styles.alocacaoAmbiente}>
                      {alocacao.ambiente.nome} ({alocacao.ambiente.area_m2} m2)
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() =>
                        navigation.navigate('RDOForm', {
                          obra,
                          alocacaoItem: {
                            id_alocacao_item: alocacao.id,
                            id_colaborador: alocacao.id_colaborador,
                            id_item_ambiente: alocacao.id_item_ambiente || undefined,
                            area_planejada: alocacao.ambiente.area_m2,
                          },
                        })
                      }
                      style={styles.btnCriarRdo}
                      icon="file-document-edit"
                    >
                      Criar RDO
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => handleConcluirAlocacao(alocacao)}
                      style={styles.btnConcluir}
                      icon="check"
                    >
                      Concluir
                    </Button>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>

        <Portal>
          <Modal
            visible={itemSelectorVisible}
            onDismiss={fecharSeletorItem}
            contentContainerStyle={styles.itemModalContainer}
          >
            <Card>
              <Card.Content>
                <Title>Selecione o item do ambiente</Title>
                <Paragraph style={styles.itemModalSubtitle}>
                  Este ambiente possui mais de um item. Escolha qual item sera alocado.
                </Paragraph>

                {itensAmbientePendentes.map(item => (
                  <View key={item.id} style={styles.itemOptionRow}>
                    <RadioButton
                      value={item.id}
                      status={itemSelecionadoId === item.id ? 'checked' : 'unchecked'}
                      onPress={() => setItemSelecionadoId(item.id)}
                    />
                    <Text style={styles.itemOptionText}>{getItemLabel(item)}</Text>
                  </View>
                ))}
              </Card.Content>
              <Card.Actions>
                <Button onPress={fecharSeletorItem}>Cancelar</Button>
                <Button mode="contained" onPress={confirmarAlocacaoComItem}>
                  Confirmar alocacao
                </Button>
              </Card.Actions>
            </Card>
          </Modal>
        </Portal>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statsCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  colaboradorCard: {
    marginBottom: 8,
    elevation: 1,
  },
  colaboradorOcupado: {
    backgroundColor: '#FFF3E0',
  },
  colaboradorAlocando: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  colaboradorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colaboradorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colaboradorTexts: {
    marginLeft: 12,
    flex: 1,
  },
  colaboradorNome: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  colaboradorCpf: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  ambienteCard: {
    marginBottom: 10,
    elevation: 2,
  },
  ambienteOcupado: {
    backgroundColor: '#FFEBEE',
  },
  ambienteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ambienteNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  ambienteInfo: {
    fontSize: 13,
    color: '#666',
  },
  ambienteOcupadoText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 6,
    fontStyle: 'italic',
  },
  ambienteHover: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  alocacaoCard: {
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#FFF9C4',
  },
  alocacaoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alocacaoNome: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  alocacaoAmbiente: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  btnConcluir: {
    backgroundColor: '#4CAF50',
  },
  btnCriarRdo: {
    marginBottom: 8,
  },
  dragging: {
    opacity: 0.7,
  },
  dragReleased: {
    opacity: 1,
  },
  hoverDragging: {
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  itemModalContainer: {
    margin: 20,
  },
  itemModalSubtitle: {
    marginBottom: 12,
    color: '#666',
  },
  itemOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemOptionText: {
    flex: 1,
    color: '#333',
  },
});
