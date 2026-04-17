import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { FAB, Card, Chip, Button, Modal, Portal, TextInput, Menu } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { apiClient } from '../services/api';
import { SessoesService } from '../services/sessoes.service';
import { GeolocationService } from '../services/geolocation.service';
import { Obra } from '../types';
import { SM_COLORS } from '../theme/colors';

const STATUS_OPCOES = ['PLANEJAMENTO', 'ATIVA', 'SUSPENSA', 'CONCLUIDA'];

interface ObraForm {
  nome: string;
  status: string;
  endereco: string;
  area_total: string;
  valor_contrato: string;
  data_previsao_termino: string;
}

const FORM_VAZIO: ObraForm = {
  nome: '',
  status: 'PLANEJAMENTO',
  endereco: '',
  area_total: '',
  valor_contrato: '',
  data_previsao_termino: '',
};

export const ObrasScreen = ({ navigation }: any) => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alocacaoLoadingId, setAlocacaoLoadingId] = useState<string | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [obraEditando, setObraEditando] = useState<Obra | null>(null);
  const [form, setForm] = useState<ObraForm>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [menuStatusAberto, setMenuStatusAberto] = useState(false);
  const { usuario } = useAppSelector((state) => state.auth);

  const carregarObras = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getObras(1, 100, {
        status: ['ATIVA', 'PLANEJAMENTO'],
      });

      const listaRaw = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
        ? response.data.data
        : response.data && typeof response.data === 'object'
        ? [response.data]
        : [];

      const obrasNormalizadas: Obra[] = listaRaw.map((obra: any) => ({
        ...obra,
        id_obra: String(obra.id_obra ?? obra.id),
        endereco: obra.endereco ?? obra.endereco_completo ?? '-',
        data_previsao_termino:
          obra.data_previsao_termino ??
          obra.data_previsao_fim ??
          obra.data_conclusao ??
          new Date().toISOString(),
        area_total: Number(obra.area_total ?? 0),
        valor_contrato: Number(obra.valor_contrato ?? 0),
      }));

      setObras(obrasNormalizadas);
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao carregar obras');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await carregarObras();
    setRefreshing(false);
  }, [carregarObras]);

  useFocusEffect(
    useCallback(() => {
      carregarObras();
    }, [carregarObras])
  );

  const statusColors: Record<string, string> = {
    planejada: '#FFC107',
    em_progresso: '#4CAF50',
    pausada: '#FF9800',
    finalizada: '#9C27B0',
    PLANEJAMENTO: '#FFC107',
    ATIVA: '#4CAF50',
    SUSPENSA: '#FF9800',
    CONCLUIDA: '#9C27B0',
  };

  const confirmarCapturaSemValidacao = () =>
    new Promise<boolean>((resolve) => {
      Alert.alert(
        'Aviso',
        'Esta obra nao possui coordenadas cadastradas. A localizacao sera capturada sem validacao de proximidade.',
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Continuar', onPress: () => resolve(true) },
        ]
      );
    });

  const abrirModalCriar = () => {
    setObraEditando(null);
    setForm(FORM_VAZIO);
    setModalVisivel(true);
  };

  const abrirModalEditar = (obra: Obra) => {
    setObraEditando(obra);
    setForm({
      nome: obra.nome,
      status: obra.status,
      endereco: obra.endereco,
      area_total: String(obra.area_total),
      valor_contrato: String(obra.valor_contrato),
      data_previsao_termino: obra.data_previsao_termino
        ? obra.data_previsao_termino.split('T')[0]
        : '',
    });
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setObraEditando(null);
    setForm(FORM_VAZIO);
  };

  const salvar = async () => {
    if (!form.nome.trim()) {
      Alert.alert('Validação', 'Nome da obra é obrigatório.');
      return;
    }
    try {
      setSalvando(true);
      const payload: any = {
        nome: form.nome.trim(),
        status: form.status,
        endereco: form.endereco.trim() || undefined,
        area_total: form.area_total ? parseFloat(form.area_total) : undefined,
        valor_contrato: form.valor_contrato ? parseFloat(form.valor_contrato) : undefined,
        data_previsao_termino: form.data_previsao_termino || undefined,
      };
      const client = apiClient.getClient();
      if (obraEditando) {
        await client.patch(`/obras/${obraEditando.id_obra}`, payload);
      } else {
        await client.post('/obras', payload);
      }
      fecharModal();
      await carregarObras();
    } catch (error: any) {
      Alert.alert('Erro', error?.response?.data?.message || 'Falha ao salvar obra.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (obra: Obra) => {
    Alert.alert('Excluir Obra', `Deseja excluir a obra "${obra.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            const client = apiClient.getClient();
            await client.delete(`/obras/${obra.id_obra}`);
            await carregarObras();
          } catch {
            Alert.alert('Erro', 'Falha ao excluir obra.');
          }
        },
      },
    ]);
  };

  const abrirAlocacao = async (obra: Obra) => {
    const idEncarregado = (usuario as any)?.id_usuario || (usuario as any)?.id;
    if (!idEncarregado) {
      Alert.alert('Erro', 'Usuario nao encontrado na sessao atual');
      return;
    }

    setAlocacaoLoadingId(obra.id_obra);

    try {
      const sessaoAberta = await SessoesService.buscarSessaoAberta(idEncarregado);
      if (sessaoAberta) {
        if (sessaoAberta.id_obra && sessaoAberta.id_obra !== obra.id_obra) {
          Alert.alert(
            'Sessao Aberta',
            'Existe uma sessao aberta para outra obra. Encerre-a antes de iniciar outra.'
          );
          return;
        }

        navigation.navigate('Alocacao', { sessao: sessaoAberta, obra });
        return;
      }

      let geo_lat: number | undefined;
      let geo_long: number | undefined;

      if (obra.geo_lat && obra.geo_long) {
        const resultado = await GeolocationService.obterEValidarLocalizacao(
          obra.geo_lat,
          obra.geo_long
        );

        if (!resultado.proximidade.valida) {
          Alert.alert(
            'Fora da Area',
            resultado.proximidade.mensagem + '\n\nAproxime-se para continuar.'
          );
          return;
        }

        geo_lat = resultado.coords.latitude;
        geo_long = resultado.coords.longitude;
      } else {
        const confirmar = await confirmarCapturaSemValidacao();
        if (!confirmar) return;

        const coords = await GeolocationService.getCurrentPosition();
        geo_lat = coords.latitude;
        geo_long = coords.longitude;
      }

      const novaSessao = await SessoesService.criarSessao({
        id_encarregado: idEncarregado,
        id_obra: obra.id_obra,
        data_sessao: new Date().toISOString().split('T')[0],
        hora_inicio: new Date().toISOString(),
        geo_lat,
        geo_long,
      });

      navigation.navigate('Alocacao', { sessao: novaSessao, obra });
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao abrir alocacao');
    } finally {
      setAlocacaoLoadingId(null);
    }
  };

  const renderObraCard = ({ item }: { item: Obra }) => (
    <View style={styles.cardContainer}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.titulo} numberOfLines={1}>
              {item.nome}
            </Text>
            <Chip
              label={String(item.status).replace('_', ' ')}
              style={{
                backgroundColor: statusColors[item.status] || '#9C27B0',
              }}
              textStyle={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}
            />
          </View>

          <Text style={styles.endereco} numberOfLines={1}>
            📍 {item.endereco}
          </Text>

          <View style={styles.detalhesRow}>
            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Área</Text>
              <Text style={styles.detalheValor}>{item.area_total.toFixed(1)} m²</Text>
            </View>
            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Valor</Text>
              <Text style={styles.detalheValor}>
                R$ {(item.valor_contrato / 1000).toFixed(1)}k
              </Text>
            </View>
            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Previsão</Text>
              <Text style={styles.detalheValor}>
                {new Date(item.data_previsao_termino).toLocaleDateString('pt-BR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('RDOForm', { obra: item })}
              style={[styles.actionButton, { flex: 2 }]}
              icon="file-document"
            >
              Novo RDO
            </Button>
            <Button
              mode="outlined"
              onPress={() => abrirAlocacao(item)}
              style={[styles.actionButton, { flex: 2 }]}
              icon="account-group"
              loading={alocacaoLoadingId === item.id_obra}
              disabled={alocacaoLoadingId === item.id_obra}
            >
              Alocar
            </Button>
            <Button
              mode="text"
              onPress={() => abrirModalEditar(item)}
              style={[styles.actionButton, { flex: 1 }]}
              icon="pencil"
            >
              {''}
            </Button>
            <Button
              mode="text"
              onPress={() => excluir(item)}
              style={[styles.actionButton, { flex: 1 }]}
              icon="delete"
              textColor="#d32f2f"
            >
              {''}
            </Button>
          </View>
        </Card.Content>
      </Card>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={SM_COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={obras}
        keyExtractor={(item) => item.id_obra}
        renderItem={renderObraCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-open" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma obra disponível</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        label="Nova Obra"
        onPress={abrirModalCriar}
      />

      <Portal>
        <Modal
          visible={modalVisivel}
          onDismiss={fecharModal}
          contentContainerStyle={styles.modal}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitulo}>
              {obraEditando ? 'Editar Obra' : 'Nova Obra'}
            </Text>

            <TextInput
              label="Nome da Obra *"
              value={form.nome}
              onChangeText={(v) => setForm({ ...form, nome: v })}
              style={styles.input}
              mode="outlined"
            />

            <Text style={styles.labelCampo}>Status</Text>
            <Menu
              visible={menuStatusAberto}
              onDismiss={() => setMenuStatusAberto(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setMenuStatusAberto(true)}
                  style={styles.input}
                  icon="chevron-down"
                  contentStyle={{ flexDirection: 'row-reverse' }}
                >
                  {form.status}
                </Button>
              }
            >
              {STATUS_OPCOES.map((s) => (
                <Menu.Item
                  key={s}
                  title={s}
                  onPress={() => { setForm({ ...form, status: s }); setMenuStatusAberto(false); }}
                />
              ))}
            </Menu>

            <TextInput
              label="Endereço"
              value={form.endereco}
              onChangeText={(v) => setForm({ ...form, endereco: v })}
              style={styles.input}
              mode="outlined"
            />
            <TextInput
              label="Área Total (m²)"
              value={form.area_total}
              onChangeText={(v) => setForm({ ...form, area_total: v })}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
            />
            <TextInput
              label="Valor do Contrato (R$)"
              value={form.valor_contrato}
              onChangeText={(v) => setForm({ ...form, valor_contrato: v })}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
            />
            <TextInput
              label="Previsão de Término (AAAA-MM-DD)"
              value={form.data_previsao_termino}
              onChangeText={(v) => setForm({ ...form, data_previsao_termino: v })}
              style={styles.input}
              mode="outlined"
              placeholder="2025-12-31"
            />

            <View style={styles.modalBotoes}>
              <Button mode="outlined" onPress={fecharModal} style={{ flex: 1, marginRight: 8 }}>
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={salvar}
                loading={salvando}
                disabled={salvando}
                style={{ flex: 1 }}
              >
                Salvar
              </Button>
            </View>
          </ScrollView>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 12,
  },
  card: {
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  endereco: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  detalhesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  detalheItem: {
    alignItems: 'center',
  },
  detalheLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  detalheValor: {
    fontSize: 13,
    fontWeight: '600',
    color: SM_COLORS.primary,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: SM_COLORS.primary,
  },
  input: {
    marginBottom: 12,
  },
  labelCampo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 4,
  },
  modalBotoes: {
    flexDirection: 'row',
    marginTop: 16,
  },
});
