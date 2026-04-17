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
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';

interface Obra {
  id: string;
  nome: string;
}

interface Ambiente {
  id: string;
  nome: string;
  pavimento?: { nome?: string; obra?: { nome?: string } };
}

interface ItemAmbiente {
  id: string;
  id_ambiente: string;
  nome_elemento?: string;
  area_planejada: number;
  status?: string;
  progresso?: number;
  ambiente?: Ambiente;
  tabelaPreco?: { servico?: { nome?: string } };
}

const emptyForm = {
  id_ambiente: '',
  nome_elemento: '',
  area_planejada: '',
};

export const ItensAmbienteScreen = () => {
  const [itens, setItens] = useState<ItemAmbiente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroObra, setFiltroObra] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<ItemAmbiente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [seletorVisible, setSeletorVisible] = useState<'obra' | 'amb' | null>(null);

  const carregarObras = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/obras', { params: { limit: 200 } });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setObras(lista.map((o: any) => ({ id: o.id ?? o.id_obra, nome: o.nome })));
    } catch {/* silencia */}
  }, []);

  const carregarAmbientes = useCallback(async (idObra: string) => {
    if (!idObra) { setAmbientes([]); return; }
    try {
      const { data } = await apiClient.getClient().get(`/ambientes/obra/${idObra}`);
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setAmbientes(lista);
    } catch {/* silencia */}
  }, []);

  const carregar = useCallback(async () => {
    try {
      let url = '/itens-ambiente';
      if (filtroObra) url = `/itens-ambiente/obra/${filtroObra}`;
      const { data } = await apiClient.getClient().get(url);
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setItens(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os itens de ambiente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroObra]);

  useEffect(() => { carregarObras(); }, [carregarObras]);
  useEffect(() => { carregarAmbientes(filtroObra); }, [filtroObra, carregarAmbientes]);
  useFocusEffect(useCallback(() => { setLoading(true); carregar(); }, [carregar]));

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ ...emptyForm });
    setModalVisible(true);
  };

  const abrirEditar = (item: ItemAmbiente) => {
    setEditando(item);
    setForm({
      id_ambiente: item.id_ambiente,
      nome_elemento: item.nome_elemento ?? '',
      area_planejada: String(item.area_planejada),
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!editando && !form.id_ambiente) {
      Alert.alert('Atenção', 'Selecione um ambiente.');
      return;
    }
    if (!form.area_planejada) {
      Alert.alert('Atenção', 'Área planejada é obrigatória.');
      return;
    }
    const payload: any = {
      area_planejada: Number(form.area_planejada),
    };
    if (!editando) payload.id_ambiente = form.id_ambiente;
    if (form.nome_elemento.trim()) payload.nome_elemento = form.nome_elemento;

    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/itens-ambiente/${editando.id}`, { area_planejada: payload.area_planejada });
      } else {
        await apiClient.getClient().post('/itens-ambiente', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar item.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (item: ItemAmbiente) => {
    Alert.alert('Excluir Item', `Deseja excluir este item?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.getClient().delete(`/itens-ambiente/${item.id}`);
            carregar();
          } catch { Alert.alert('Erro', 'Falha ao excluir item.'); }
        },
      },
    ]);
  };

  const nomeObra = (id: string) => obras.find((o) => o.id === id)?.nome ?? id;

  const renderItem = ({ item }: { item: ItemAmbiente }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name="format-list-text" size={28} color="#1976d2" style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome_elemento ?? item.tabelaPreco?.servico?.nome ?? 'Item'}</Text>
          <Text style={styles.sub}>
            {item.ambiente?.pavimento?.obra?.nome ?? ''}{item.ambiente?.nome ? ` › ${item.ambiente.nome}` : ''}
          </Text>
          <Text style={styles.detalhe}>{item.area_planejada} m²</Text>
          {item.status ? (
            <Chip compact style={styles.chip} textStyle={{ fontSize: 11 }}>{item.status}</Chip>
          ) : null}
        </View>
        <View style={styles.actions}>
          <IconButton icon="pencil-outline" size={20} onPress={() => abrirEditar(item)} />
          <IconButton icon="trash-can-outline" size={20} iconColor="#f44336" onPress={() => excluir(item)} />
        </View>
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
        {filtroObra ? (
          <IconButton icon="close" size={18} onPress={() => setFiltroObra('')} />
        ) : null}
      </View>

      <FlatList
        data={itens}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>Nenhum item encontrado.</Text></View>
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
              <Text style={styles.modalTitulo}>{editando ? 'Editar Item' : 'Novo Item de Ambiente'}</Text>
              {!editando && (
                <>
                  <Text style={styles.fieldLabel}>Ambiente *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {ambientes.length === 0 ? (
                      <Text style={styles.detalhe}>Selecione uma obra no filtro primeiro.</Text>
                    ) : ambientes.map((a) => (
                      <Chip key={a.id} selected={form.id_ambiente === a.id}
                        onPress={() => setForm((f) => ({ ...f, id_ambiente: a.id }))}
                        style={styles.chipOption}>
                        {a.nome}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}
              <TextInput label="Nome do Elemento" value={form.nome_elemento}
                onChangeText={(v) => setForm((f) => ({ ...f, nome_elemento: v }))}
                style={styles.input} mode="outlined" />
              <TextInput label="Área Planejada (m²) *" value={form.area_planejada}
                onChangeText={(v) => setForm((f) => ({ ...f, area_planejada: v }))}
                style={styles.input} mode="outlined" keyboardType="numeric" />
              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}>Salvar</Button>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
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
  card: { backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  detalhe: { fontSize: 12, color: '#888', marginTop: 1 },
  chip: { alignSelf: 'flex-start', marginTop: 4, height: 22 },
  chipOption: { marginRight: 6 },
  actions: { flexDirection: 'row' },
  emptyText: { color: '#999', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976d2' },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1976d2', marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
});
