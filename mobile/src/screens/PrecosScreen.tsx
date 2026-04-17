import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  ActivityIndicator,
  IconButton,
  Chip,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';
import { useAppSelector } from '../hooks/redux';

interface Obra {
  id: string;
  nome: string;
}

interface Servico {
  id: number;
  nome: string;
  categoria?: string;
}

interface TabelaPreco {
  id: string;
  id_obra: string;
  id_servico_catalogo: number;
  preco_custo: number;
  preco_venda: number;
  margem_percentual?: number;
  status_aprovacao: 'RASCUNHO' | 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  observacoes?: string;
  obra?: { nome?: string };
  servico?: { nome?: string };
}

const STATUS_COR: Record<string, string> = {
  RASCUNHO: '#607d8b',
  PENDENTE: '#ff9800',
  APROVADO: '#4caf50',
  REJEITADO: '#f44336',
};

const formatCurrency = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const emptyForm = {
  id_obra: '',
  id_servico_catalogo: '',
  preco_custo: '',
  preco_venda: '',
  observacoes: '',
};

export const PrecosScreen = () => {
  const { usuario } = useAppSelector((state) => state.auth);
  const perfil = (usuario as any)?.perfil ?? (usuario as any)?.papel ?? '';
  const isAdmin = ['ADMIN', 'GESTOR', 'admin', 'gestor'].includes(perfil);

  const [precos, setPrecos] = useState<TabelaPreco[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroObra, setFiltroObra] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [aprovacaoVisible, setAprovacaoVisible] = useState(false);
  const [editando, setEditando] = useState<TabelaPreco | null>(null);
  const [aprovando, setAprovando] = useState<TabelaPreco | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [obsAprovacao, setObsAprovacao] = useState('');
  const [seletorVisible, setSeletorVisible] = useState<'obra' | 'serv' | null>(null);

  const carregarAuxiliar = useCallback(async () => {
    try {
      const [obrasRes, servicosRes] = await Promise.all([
        apiClient.getClient().get('/obras', { params: { limit: 200 } }),
        apiClient.getClient().get('/servicos-catalogo', { params: { limit: 200 } }),
      ]);
      const listaO = Array.isArray(obrasRes.data) ? obrasRes.data : obrasRes.data?.data ?? [];
      setObras(listaO.map((o: any) => ({ id: o.id ?? o.id_obra, nome: o.nome })));
      const listaS = Array.isArray(servicosRes.data) ? servicosRes.data : servicosRes.data?.data ?? [];
      setServicos(listaS);
    } catch {/* silencia */}
  }, []);

  const carregar = useCallback(async () => {
    try {
      const params: any = {};
      if (filtroObra) params.idObra = filtroObra;
      const { data } = await apiClient.getClient().get('/precos', { params });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setPrecos(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os preços.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroObra]);

  useEffect(() => { carregarAuxiliar(); }, [carregarAuxiliar]);
  useFocusEffect(useCallback(() => { setLoading(true); carregar(); }, [carregar]));

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ ...emptyForm, id_obra: filtroObra });
    setModalVisible(true);
  };

  const abrirEditar = (p: TabelaPreco) => {
    setEditando(p);
    setForm({
      id_obra: p.id_obra,
      id_servico_catalogo: String(p.id_servico_catalogo),
      preco_custo: String(p.preco_custo),
      preco_venda: String(p.preco_venda),
      observacoes: p.observacoes ?? '',
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.id_obra) { Alert.alert('Atenção', 'Selecione uma obra.'); return; }
    if (!form.id_servico_catalogo) { Alert.alert('Atenção', 'Selecione um serviço.'); return; }
    if (!form.preco_custo || !form.preco_venda) { Alert.alert('Atenção', 'Informe preço custo e venda.'); return; }

    const payload: any = {
      preco_custo: Number(form.preco_custo),
      preco_venda: Number(form.preco_venda),
    };
    if (!editando) {
      payload.id_obra = form.id_obra;
      payload.id_servico_catalogo = Number(form.id_servico_catalogo);
    }
    if (form.observacoes.trim()) payload.observacoes = form.observacoes;

    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/precos/${editando.id}`, payload);
      } else {
        await apiClient.getClient().post('/precos', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar preço.');
    } finally {
      setSalvando(false);
    }
  };

  const submeterAprovacao = async (p: TabelaPreco) => {
    try {
      await apiClient.getClient().patch(`/precos/${p.id}/submeter`);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao submeter para aprovação.');
    }
  };

  const abrirAprovacao = (p: TabelaPreco) => {
    setAprovando(p);
    setObsAprovacao('');
    setAprovacaoVisible(true);
  };

  const aprovar = async (status: 'APROVADO' | 'REJEITADO') => {
    if (!aprovando) return;
    try {
      setSalvando(true);
      await apiClient.getClient().patch(`/precos/${aprovando.id}/aprovar`, {
        status,
        observacoes: obsAprovacao,
      });
      setAprovacaoVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha na aprovação.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (p: TabelaPreco) => {
    Alert.alert('Excluir Preço', 'Deseja excluir este preço?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.getClient().delete(`/precos/${p.id}`);
            carregar();
          } catch { Alert.alert('Erro', 'Falha ao excluir preço.'); }
        },
      },
    ]);
  };

  const nomeObra = (id: string) => obras.find((o) => o.id === id)?.nome ?? id;
  const nomeServico = (id: number) => servicos.find((s) => s.id === id)?.nome ?? `Serviço ${id}`;

  const renderItem = ({ item }: { item: TabelaPreco }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nome}>{item.servico?.nome ?? nomeServico(item.id_servico_catalogo)}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COR[item.status_aprovacao] ?? '#999' }]}>
          <Text style={styles.badgeText}>{item.status_aprovacao}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{item.obra?.nome ?? nomeObra(item.id_obra)}</Text>
      <View style={styles.precoRow}>
        <Text style={styles.precoLabel}>Custo:</Text>
        <Text style={styles.precoValor}>{formatCurrency(item.preco_custo)}</Text>
        <Text style={[styles.precoLabel, { marginLeft: 16 }]}>Venda:</Text>
        <Text style={[styles.precoValor, { color: '#2e7d32' }]}>{formatCurrency(item.preco_venda)}</Text>
      </View>
      {item.margem_percentual != null ? (
        <Text style={styles.margem}>Margem: {Number(item.margem_percentual).toFixed(1)}%</Text>
      ) : null}
      <Divider style={{ marginVertical: 8 }} />
      <View style={styles.cardActions}>
        {item.status_aprovacao === 'RASCUNHO' && (
          <Button compact mode="outlined" onPress={() => submeterAprovacao(item)} style={styles.actionBtn}>
            Submeter
          </Button>
        )}
        {isAdmin && item.status_aprovacao === 'PENDENTE' && (
          <Button compact mode="contained" onPress={() => abrirAprovacao(item)} style={styles.actionBtn}>
            Avaliar
          </Button>
        )}
        {['RASCUNHO', 'REJEITADO'].includes(item.status_aprovacao) && (
          <IconButton icon="pencil-outline" size={20} onPress={() => abrirEditar(item)} />
        )}
        {item.status_aprovacao === 'RASCUNHO' && (
          <IconButton icon="trash-can-outline" size={20} iconColor="#f44336" onPress={() => excluir(item)} />
        )}
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Filtro por obra */}
      <View style={styles.filtroBar}>
        <Text style={styles.filtroLabel}>Obra:</Text>
        <Button
          mode={filtroObra ? 'contained' : 'outlined'}
          compact
          onPress={() => setSeletorVisible('obra')}
          style={styles.filtroBtn}
        >
          {filtroObra ? nomeObra(filtroObra) : 'Todas'}
        </Button>
        {filtroObra ? <IconButton icon="close" size={18} onPress={() => setFiltroObra('')} /> : null}
      </View>

      <FlatList
        data={precos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>Nenhum preço cadastrado.</Text></View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={abrirCriar} label="Novo" color="#fff" />

      {/* Seletor obra */}
      <Portal>
        <Modal visible={seletorVisible === 'obra'} onDismiss={() => setSeletorVisible(null)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitulo}>Selecionar Obra</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <Button mode="outlined" onPress={() => { setFiltroObra(''); setSeletorVisible(null); }} style={{ marginBottom: 8 }}>Todas</Button>
            {obras.map((o) => (
              <Button key={o.id} mode={filtroObra === o.id ? 'contained' : 'outlined'}
                onPress={() => { setFiltroObra(o.id); setSeletorVisible(null); }}
                style={{ marginBottom: 6 }}>{o.nome}</Button>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal criar/editar */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text style={styles.modalTitulo}>{editando ? 'Editar Preço' : 'Novo Preço'}</Text>
              {!editando && (
                <>
                  <Text style={styles.fieldLabel}>Obra *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {obras.map((o) => (
                      <Chip key={o.id} selected={form.id_obra === o.id}
                        onPress={() => setForm((f) => ({ ...f, id_obra: o.id }))}
                        style={styles.chipOption}>{o.nome}</Chip>
                    ))}
                  </ScrollView>
                  <Text style={styles.fieldLabel}>Serviço *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {servicos.map((s) => (
                      <Chip key={s.id} selected={form.id_servico_catalogo === String(s.id)}
                        onPress={() => setForm((f) => ({ ...f, id_servico_catalogo: String(s.id) }))}
                        style={styles.chipOption}>{s.nome}</Chip>
                    ))}
                  </ScrollView>
                </>
              )}
              <TextInput label="Preço Custo (R$) *" value={form.preco_custo}
                onChangeText={(v) => setForm((f) => ({ ...f, preco_custo: v }))}
                style={styles.input} mode="outlined" keyboardType="numeric" />
              <TextInput label="Preço Venda (R$) *" value={form.preco_venda}
                onChangeText={(v) => setForm((f) => ({ ...f, preco_venda: v }))}
                style={styles.input} mode="outlined" keyboardType="numeric" />
              <TextInput label="Observações" value={form.observacoes}
                onChangeText={(v) => setForm((f) => ({ ...f, observacoes: v }))}
                style={styles.input} mode="outlined" multiline numberOfLines={2} />
              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}>Salvar</Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </Portal>

      {/* Modal aprovação */}
      <Portal>
        <Modal visible={aprovacaoVisible} onDismiss={() => setAprovacaoVisible(false)} contentContainerStyle={styles.modal}>
          <Text style={styles.modalTitulo}>Avaliar Preço</Text>
          {aprovando && (
            <>
              <Text style={styles.sub}>{aprovando.servico?.nome ?? ''}</Text>
              <Text style={styles.sub}>{aprovando.obra?.nome ?? nomeObra(aprovando.id_obra)}</Text>
              <View style={styles.precoRow}>
                <Text>Custo: {formatCurrency(aprovando.preco_custo)}</Text>
                <Text style={{ marginLeft: 16 }}>Venda: {formatCurrency(aprovando.preco_venda)}</Text>
              </View>
            </>
          )}
          <TextInput label="Observações" value={obsAprovacao}
            onChangeText={setObsAprovacao} style={[styles.input, { marginTop: 12 }]} mode="outlined" multiline />
          <View style={styles.modalActions}>
            <Button onPress={() => setAprovacaoVisible(false)}>Cancelar</Button>
            <Button mode="outlined" textColor="#f44336" onPress={() => aprovar('REJEITADO')} loading={salvando}>Rejeitar</Button>
            <Button mode="contained" onPress={() => aprovar('APROVADO')} loading={salvando}>Aprovar</Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  filtroBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', elevation: 1 },
  filtroLabel: { fontSize: 13, color: '#555', marginRight: 8 },
  filtroBtn: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 8, elevation: 1, padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  sub: { fontSize: 12, color: '#666', marginBottom: 4 },
  precoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  precoLabel: { fontSize: 12, color: '#888' },
  precoValor: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginLeft: 4 },
  margem: { fontSize: 12, color: '#555', marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  actionBtn: { marginRight: 8 },
  chipOption: { marginRight: 6 },
  emptyText: { color: '#999', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976d2' },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1976d2', marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 8 },
});
