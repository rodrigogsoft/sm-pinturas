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

interface Pavimento {
  id: string;
  nome: string;
  id_obra: string;
}

interface Ambiente {
  id: string;
  id_pavimento: string;
  nome: string;
  area_m2?: number;
  descricao?: string;
  pavimento?: { nome?: string; obra?: { nome?: string } };
}

const emptyForm = {
  id_pavimento: '',
  nome: '',
  area_m2: '',
  descricao: '',
};

export const AmbientesScreen = () => {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [pavimentos, setPavimentos] = useState<Pavimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroPav, setFiltroPav] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Ambiente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [seletorVisible, setSeletorVisible] = useState<'obra' | 'pav' | null>(null);

  const carregarObras = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/obras', { params: { limit: 200 } });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setObras(lista.map((o: any) => ({ id: o.id ?? o.id_obra, nome: o.nome })));
    } catch {/* silencia */}
  }, []);

  const carregarPavimentos = useCallback(async (idObra?: string) => {
    try {
      const params: any = { limit: 200 };
      if (idObra) params.id_obra = idObra;
      const { data } = await apiClient.getClient().get('/pavimentos', { params });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setPavimentos(lista.map((p: any) => ({ id: p.id, nome: p.nome, id_obra: p.id_obra })));
    } catch {/* silencia */}
  }, []);

  const carregar = useCallback(async () => {
    try {
      let url = '/ambientes';
      if (filtroObra) url = `/ambientes/obra/${filtroObra}`;
      else if (filtroPav) url = `/ambientes/pavimento/${filtroPav}`;
      const { data } = await apiClient.getClient().get(url);
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setAmbientes(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os ambientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroObra, filtroPav]);

  useEffect(() => { carregarObras(); }, [carregarObras]);
  useEffect(() => { carregarPavimentos(filtroObra); }, [filtroObra, carregarPavimentos]);
  useFocusEffect(
    useCallback(() => { setLoading(true); carregar(); }, [carregar]),
  );

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ id_pavimento: filtroPav, nome: '', area_m2: '', descricao: '' });
    setModalVisible(true);
  };

  const abrirEditar = (a: Ambiente) => {
    setEditando(a);
    setForm({
      id_pavimento: a.id_pavimento,
      nome: a.nome,
      area_m2: a.area_m2 != null ? String(a.area_m2) : '',
      descricao: a.descricao ?? '',
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.id_pavimento) { Alert.alert('Atenção', 'Selecione um pavimento.'); return; }
    if (!form.nome.trim()) { Alert.alert('Atenção', 'Nome é obrigatório.'); return; }
    const payload: any = { nome: form.nome };
    if (!editando) payload.id_pavimento = form.id_pavimento;
    if (form.area_m2) payload.area_m2 = Number(form.area_m2);
    if (form.descricao.trim()) payload.descricao = form.descricao;
    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/ambientes/${editando.id}`, payload);
      } else {
        await apiClient.getClient().post('/ambientes', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar ambiente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (a: Ambiente) => {
    Alert.alert('Excluir Ambiente', `Deseja excluir "${a.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.getClient().delete(`/ambientes/${a.id}`);
            carregar();
          } catch { Alert.alert('Erro', 'Falha ao excluir ambiente.'); }
        },
      },
    ]);
  };

  const nomeObra = (id: string) => obras.find((o) => o.id === id)?.nome ?? id;
  const nomePav = (id: string) => pavimentos.find((p) => p.id === id)?.nome ?? id;

  const renderItem = ({ item }: { item: Ambiente }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name="floor-plan" size={28} color="#1976d2" style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.sub}>
            {item.pavimento?.obra?.nome ?? ''}{item.pavimento?.nome ? ` › ${item.pavimento.nome}` : ''}
          </Text>
          {item.area_m2 != null ? (
            <Text style={styles.detalhe}>{item.area_m2} m²</Text>
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
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtros */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtroBar}>
        <Button
          mode={filtroObra ? 'contained' : 'outlined'}
          compact
          onPress={() => setSeletorVisible('obra')}
          style={styles.filtroBtn}
        >
          {filtroObra ? nomeObra(filtroObra) : 'Filtrar por Obra'}
        </Button>
        {filtroObra ? (
          <Button compact mode="outlined" onPress={() => setSeletorVisible('pav')} style={styles.filtroBtn}>
            {filtroPav ? nomePav(filtroPav) : 'Filtrar por Pavimento'}
          </Button>
        ) : null}
        {filtroObra ? (
          <IconButton icon="close" size={18} onPress={() => { setFiltroObra(''); setFiltroPav(''); }} />
        ) : null}
      </ScrollView>

      <FlatList
        data={ambientes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>Nenhum ambiente encontrado.</Text></View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={abrirCriar} label="Novo" color="#fff" />

      {/* Seletor de obra */}
      <Portal>
        <Modal
          visible={seletorVisible === 'obra'}
          onDismiss={() => setSeletorVisible(null)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitulo}>Selecionar Obra</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <Button mode="outlined" onPress={() => { setFiltroObra(''); setFiltroPav(''); setSeletorVisible(null); }} style={{ marginBottom: 8 }}>
              Todas as obras
            </Button>
            {obras.map((o) => (
              <Button key={o.id} mode={filtroObra === o.id ? 'contained' : 'outlined'}
                onPress={() => { setFiltroObra(o.id); setFiltroPav(''); setSeletorVisible(null); }}
                style={{ marginBottom: 6 }}>
                {o.nome}
              </Button>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Seletor de pavimento */}
      <Portal>
        <Modal
          visible={seletorVisible === 'pav'}
          onDismiss={() => setSeletorVisible(null)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitulo}>Selecionar Pavimento</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <Button mode="outlined" onPress={() => { setFiltroPav(''); setSeletorVisible(null); }} style={{ marginBottom: 8 }}>
              Todos os pavimentos
            </Button>
            {pavimentos.map((p) => (
              <Button key={p.id} mode={filtroPav === p.id ? 'contained' : 'outlined'}
                onPress={() => { setFiltroPav(p.id); setSeletorVisible(null); }}
                style={{ marginBottom: 6 }}>
                {p.nome}
              </Button>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal criar/editar */}
      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text style={styles.modalTitulo}>{editando ? 'Editar Ambiente' : 'Novo Ambiente'}</Text>
              {!editando && (
                <>
                  <Text style={styles.fieldLabel}>Pavimento *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {pavimentos.map((p) => (
                      <Chip key={p.id} selected={form.id_pavimento === p.id}
                        onPress={() => setForm((f) => ({ ...f, id_pavimento: p.id }))}
                        style={styles.chipOption}>
                        {p.nome}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}
              <TextInput label="Nome *" value={form.nome} onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))} style={styles.input} mode="outlined" />
              <TextInput label="Área (m²)" value={form.area_m2} onChangeText={(v) => setForm((f) => ({ ...f, area_m2: v }))} style={styles.input} mode="outlined" keyboardType="numeric" />
              <TextInput label="Descrição" value={form.descricao} onChangeText={(v) => setForm((f) => ({ ...f, descricao: v }))} style={styles.input} mode="outlined" multiline numberOfLines={2} />
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
  filtroBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', elevation: 1, maxHeight: 56 },
  filtroBtn: { marginRight: 8 },
  card: { backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  detalhe: { fontSize: 12, color: '#888', marginTop: 1 },
  actions: { flexDirection: 'row' },
  chipOption: { marginRight: 6 },
  emptyText: { color: '#999', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976d2' },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#1976d2', marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
});
