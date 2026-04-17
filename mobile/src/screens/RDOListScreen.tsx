import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Card, Button, Chip, FAB, Portal, Modal, RadioButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { sincronizarRDOs, carregarRDOsLocais } from '../store/slices/rdoSlice';
import { SessoesService } from '../services/sessoes.service';
import { AlocacoesService } from '../services/alocacoes.service';
import { apiClient } from '../services/api';
import { SM_COLORS } from '../theme/colors';

export const RDOListScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const { rdos, syncStatus } = useAppSelector((state) => state.rdo);
  const { usuario } = useAppSelector((state) => state.auth);
  const [seletorAlocacaoVisible, setSeletorAlocacaoVisible] = useState(false);
  const [alocacoesPendentes, setAlocacoesPendentes] = useState<any[]>([]);
  const [alocacaoSelecionadaId, setAlocacaoSelecionadaId] = useState<string | null>(null);
  const [obraPendente, setObraPendente] = useState<any>(null);

  useEffect(() => {
    // Carregar RDOs do localStorage ao abrir
    dispatch(carregarRDOsLocais());
  }, [dispatch]);

  const handleSincronizar = async () => {
    try {
      await dispatch(sincronizarRDOs()).unwrap();
      Alert.alert('Sucesso', 'RDOs sincronizados com sucesso');
    } catch (error: any) {
      Alert.alert('Erro', error || 'Falha ao sincronizar');
    }
  };

  const abrirRDOFormComAlocacao = (alocacao: any, obraData: any) => {
    navigation.navigate('Obras', {
      screen: 'RDOForm',
      params: {
        obra: {
          ...obraData,
          id: obraData.id || obraData.id_obra,
          id_obra: obraData.id_obra || obraData.id,
          nome: obraData.nome || 'Obra',
        },
        alocacaoItem: {
          id_alocacao_item: alocacao.id,
          id_colaborador: alocacao.id_colaborador,
          id_item_ambiente: alocacao.id_item_ambiente || undefined,
          area_planejada: Number(
            alocacao.item_ambiente?.area_planejada || alocacao.ambiente?.area_m2 || 0
          ),
        },
      },
    });
  };

  const fecharSeletorAlocacao = () => {
    setSeletorAlocacaoVisible(false);
    setAlocacoesPendentes([]);
    setAlocacaoSelecionadaId(null);
    setObraPendente(null);
  };

  const confirmarSeletorAlocacao = () => {
    if (!alocacaoSelecionadaId || !obraPendente) {
      Alert.alert('Selecao obrigatoria', 'Escolha uma alocacao para continuar.');
      return;
    }

    const alocacao = alocacoesPendentes.find(item => item.id === alocacaoSelecionadaId);
    if (!alocacao) {
      Alert.alert('Erro', 'Alocacao selecionada nao encontrada.');
      return;
    }

    fecharSeletorAlocacao();
    abrirRDOFormComAlocacao(alocacao, obraPendente);
  };

  const getAlocacaoLabel = (alocacao: any) => {
    const colaborador = alocacao.colaborador?.nome_completo || 'Colaborador';
    const ambiente = alocacao.ambiente?.nome || 'Ambiente';
    const inicio = alocacao.hora_inicio
      ? new Date(alocacao.hora_inicio).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '--:--';
    return `${colaborador} • ${ambiente} • ${inicio}`;
  };

  const handleNovoRDO = async () => {
    const idEncarregado = (usuario as any)?.id_usuario || (usuario as any)?.id;
    if (!idEncarregado) {
      navigation.navigate('Obras');
      return;
    }

    try {
      const sessaoAberta = await SessoesService.buscarSessaoAberta(idEncarregado);
      if (!sessaoAberta?.id || !sessaoAberta?.id_obra) {
        navigation.navigate('Obras');
        return;
      }

      const alocacoesAtivas = await AlocacoesService.listarAtivas(sessaoAberta.id);
      const obraResp = await apiClient.getObraById(sessaoAberta.id_obra);
      const obraData = obraResp.data?.data || obraResp.data || {};
      const obraNormalizada = {
        ...obraData,
        id: obraData.id || sessaoAberta.id_obra,
        id_obra: obraData.id_obra || obraData.id || sessaoAberta.id_obra,
        nome: obraData.nome || 'Obra',
      };

      if (!alocacoesAtivas.length) {
        Alert.alert(
          'Sem alocacao ativa',
          'Nao ha alocacao em andamento para pre-preencher o RDO. Deseja ir direto para Alocacao desta sessao?',
          [
            { text: 'Escolher Obra', onPress: () => navigation.navigate('Obras') },
            {
              text: 'Ir para Alocacao',
              onPress: () =>
                navigation.navigate('Obras', {
                  screen: 'Alocacao',
                  params: {
                    sessao: sessaoAberta,
                    obra: obraNormalizada,
                  },
                }),
            },
          ]
        );
        return;
      }

      if (alocacoesAtivas.length === 1) {
        abrirRDOFormComAlocacao(alocacoesAtivas[0], obraNormalizada);
        return;
      }

      setAlocacoesPendentes(alocacoesAtivas);
      setAlocacaoSelecionadaId(alocacoesAtivas[0]?.id || null);
      setObraPendente(obraNormalizada);
      setSeletorAlocacaoVisible(true);
    } catch (error: any) {
      Alert.alert(
        'Aviso',
        'Nao foi possivel localizar contexto de alocacao ativa. Abrindo selecao de obra.'
      );
      navigation.navigate('Obras');
    }
  };

  const handleEditarRDO = async (rdo: any) => {
    const idObra = rdo.id_obra;
    if (!idObra) {
      Alert.alert('Erro', 'RDO sem obra vinculada.');
      return;
    }

    try {
      const obraResp = await apiClient.getObraById(idObra);
      const obraData = obraResp.data?.data || obraResp.data || {};

      navigation.navigate('Obras', {
        screen: 'RDOForm',
        params: {
          obra: {
            ...obraData,
            id: obraData.id || idObra,
            id_obra: obraData.id_obra || obraData.id || idObra,
            nome: obraData.nome || 'Obra',
          },
          rdoDraft: rdo,
        },
      });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar a obra para edicao do RDO.');
    }
  };

  const handleVisualizarRDO = async (rdo: any) => {
    const idObra = rdo.id_obra;
    if (!idObra) {
      Alert.alert('Erro', 'RDO sem obra vinculada.');
      return;
    }

    try {
      const obraResp = await apiClient.getObraById(idObra);
      const obraData = obraResp.data?.data || obraResp.data || {};

      navigation.navigate('Obras', {
        screen: 'RDOForm',
        params: {
          obra: {
            ...obraData,
            id: obraData.id || idObra,
            id_obra: obraData.id_obra || obraData.id || idObra,
            nome: obraData.nome || 'Obra',
          },
          rdoDraft: rdo,
          readOnly: true,
        },
      });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar a obra para visualizacao do RDO.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return '#FF9800';
      case 'enviado':
        return '#2196F3';
      case 'sincronizado':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return '📝 Rascunho';
      case 'enviado':
        return '📤 Enviado';
      case 'sincronizado':
        return '✅ Sincronizado';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusItem}>
          <MaterialCommunityIcons
            name={syncStatus.isOnline ? 'wifi' : 'wifi-off'}
            size={24}
            color={syncStatus.isOnline ? '#4CAF50' : '#F44336'}
          />
          <Text style={styles.statusText}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <MaterialCommunityIcons name="file-document" size={24} color="#2196F3" />
          <Text style={styles.statusText}>
            {syncStatus.pendingRDOs} pendentes
          </Text>
        </View>

        {syncStatus.lastSync && (
          <View style={styles.statusItem}>
            <MaterialCommunityIcons name="sync" size={20} color="#4CAF50" />
            <Text style={styles.statusText}>
              Sincronizado
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Sincronização Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.syncCardHeader}>
              <Text style={styles.cardTitle}>🔄 Sincronização</Text>
              {syncStatus.isSyncing && <ActivityIndicator color="#2196F3" />}
            </View>

            {syncStatus.lastSync && (
              <Text style={styles.syncDate}>
                Última sincronização: {new Date(syncStatus.lastSync).toLocaleString('pt-BR')}
              </Text>
            )}

            {syncStatus.syncError && (
              <Text style={styles.errorText}>Erro: {syncStatus.syncError}</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSincronizar}
              disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              style={styles.syncButton}
              icon="sync"
            >
              {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </Card.Content>
        </Card>

        {/* RDOs List */}
        <Text style={styles.sectionTitle}>RDOs Salvos ({rdos.length})</Text>

        {rdos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="file-document-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Nenhum RDO salvo</Text>
                <Text style={styles.emptySubtext}>Comece criando um novo RDO</Text>
              </View>
            </Card.Content>
          </Card>
        ) : (
          rdos.map((rdo) => (
            <Card key={rdo.id_rdo} style={styles.card}>
              <Card.Content>
                <View style={styles.rdoHeader}>
                  <Text style={styles.rdoDate}>
                    {new Date(rdo.data).toLocaleDateString('pt-BR')}
                  </Text>
                  <Chip
                    label={getStatusLabel(rdo.status)}
                    style={{ backgroundColor: getStatusColor(rdo.status) }}
                    textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
                  />
                </View>

                <View style={styles.rdoDetails}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Horas</Text>
                    <Text style={styles.detailValue}>{rdo.horas_trabalhadas.toFixed(1)}h</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Área</Text>
                    <Text style={styles.detailValue}>{rdo.area_pintada.toFixed(1)}m²</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Produtividade</Text>
                    <Text style={styles.detailValue}>
                      {(rdo.area_pintada / rdo.horas_trabalhadas).toFixed(1)}m²/h
                    </Text>
                  </View>
                </View>

                <Text style={styles.observacoes} numberOfLines={2}>
                  {rdo.observacoes || 'Sem observações'}
                </Text>

                <View style={styles.rdoActions}>
                  {rdo.status !== 'sincronizado' && (
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleEditarRDO(rdo)}>
                      <MaterialCommunityIcons name="pencil" size={18} color="#2196F3" />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleVisualizarRDO(rdo)}>
                    <MaterialCommunityIcons name="eye" size={18} color="#666" />
                    <Text style={styles.actionText}>Visualizar</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleNovoRDO}
        label="Novo RDO"
      />

      <Portal>
        <Modal
          visible={seletorAlocacaoVisible}
          onDismiss={fecharSeletorAlocacao}
          contentContainerStyle={styles.alocacaoModalContainer}
        >
          <Card>
            <Card.Content>
              <Text style={styles.alocacaoModalTitle}>Escolha a alocacao para o RDO</Text>
              <Text style={styles.alocacaoModalSubtitle}>
                Voce possui mais de uma alocacao ativa no momento.
              </Text>

              {alocacoesPendentes.map(alocacao => (
                <View key={alocacao.id} style={styles.alocacaoOptionRow}>
                  <RadioButton
                    value={alocacao.id}
                    status={alocacaoSelecionadaId === alocacao.id ? 'checked' : 'unchecked'}
                    onPress={() => setAlocacaoSelecionadaId(alocacao.id)}
                  />
                  <Text style={styles.alocacaoOptionText}>{getAlocacaoLabel(alocacao)}</Text>
                </View>
              ))}
            </Card.Content>
            <Card.Actions>
              <Button onPress={fecharSeletorAlocacao}>Cancelar</Button>
              <Button mode="contained" onPress={confirmarSeletorAlocacao}>
                Continuar
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
  statusHeader: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 12,
    elevation: 2,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollView: {
    padding: 12,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  syncCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  syncDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  syncButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  emptyCard: {
    elevation: 0,
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#bbb',
    marginTop: 4,
  },
  rdoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rdoDate: {
    fontSize: 14,
    fontWeight: '600',
    color: SM_COLORS.primary,
  },
  rdoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: SM_COLORS.primary,
  },
  observacoes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  rdoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  alocacaoModalContainer: {
    margin: 20,
  },
  alocacaoModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  alocacaoModalSubtitle: {
    color: '#666',
    marginBottom: 12,
  },
  alocacaoOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alocacaoOptionText: {
    flex: 1,
    color: '#333',
    fontSize: 13,
  },
});
