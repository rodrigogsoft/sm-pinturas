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
import { SM_COLORS } from '../theme/colors';

interface Obra {
  id: string;
  nome: string;
}

interface Pavimento {
  id: string;
  id_obra: string;
  nome: string;
  ordem: number;
  obra?: Obra;
}

const emptyForm = {
  id_obra: '',
  nome: '',
  ordem: '1',
};

export const PavimentosScreen = () => {
  const [pavimentos, setPavimentos] = useState<Pavimento[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroObra, setFiltroObra] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Pavimento | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [seletorObraVisible, setSeletorObraVisible] = useState(false);

  const carregarObras = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/obras', { params: { limit: 200 } });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setObras(lista.map((o: any) => ({ id: o.id ?? o.id_obra, nome: o.nome })));
    } catch {
      // silencia
    }
  }, []);

  const carregar = useCallback(async () => {
    try {
      const params: any = { limit: 200 };
      if (filtroObra) params.id_obra = filtroObra;
      const { data } = await apiClient.getClient().get('/pavimentos', { params });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setPavimentos(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os pavimentos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroObra]);

  useEffect(() => {
    carregarObras();
  }, [carregarObras]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregar();
    }, [carregar]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregar();
  };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ id_obra: filtroObra, nome: '', ordem: '1' });
    setModalVisible(true);
  };

  const abrirEditar = (p: Pavimento) => {
    setEditando(p);
    setForm({
      id_obra: p.id_obra,
      nome: p.nome,
      ordem: String(p.ordem),
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.id_obra) {
      Alert.alert('Atenção', 'Selecione uma obra.');
      return;
    }
    if (!form.nome.trim()) {
      Alert.alert('Atenção', 'Nome do pavimento é obrigatório.');
      return;
    }
    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/pavimentos/${editando.id}`, {
          nome: form.nome,
          ordem: Number(form.ordem) || 1,
        });
      } else {
        await apiClient.getClient().post('/pavimentos', {
          id_obra: form.id_obra,
          nome: form.nome,
          ordem: Number(form.ordem) || 1,
        });
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar pavimento.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (p: Pavimento) => {
    Alert.alert(
      'Excluir Pavimento',
      `Deseja excluir "${p.nome}"?\nTodos os ambientes vinculados serão removidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.getClient().delete(`/pavimentos/${p.id}`);
              carregar();
            } catch {
              Alert.alert('Erro', 'Falha ao excluir pavimento.');
            }
          },
        },
      ],
    );
  };

  const nomeObra = (id: string) => obras.find((o) => o.id === id)?.nome ?? id;

  const renderItem = ({ item }: { item: Pavimento }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name="layers-outline" size={28} color={SM_COLORS.primary} style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.sub}>{item.obra?.nome ?? nomeObra(item.id_obra)}</Text>
          <Chip compact style={styles.chip} textStyle={{ fontSize: 11 }}>
            Ordem {item.ordem}
          </Chip>
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SM_COLORS.primary} />
      </View>
    );
  }

  const obraFiltradaNome = filtroObra ? nomeObra(filtroObra) : null;

  return (
    <View style={styles.container}>
      {/* Filtro de obra */}
      <View style={styles.filtroRow}>
        <Text style={styles.filtroLabel}>Obra:</Text>
        <Button
          mode={filtroObra ? 'contained' : 'outlined'}
          compact
          onPress={() => setSeletorObraVisible(true)}
          style={styles.filtroBtn}
        >
          {obraFiltradaNome ?? 'Todas as obras'}
        </Button>
        {filtroObra ? (
          <IconButton icon="close" size={18} onPress={() => setFiltroObra('')} />
        ) : null}
      </View>

      <FlatList
        data={pavimentos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhum pavimento encontrado.</Text>
          </View>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={abrirCriar} label="Novo" color="#fff" />

      {/* Modal seletor de obra para filtro */}
      <Portal>
        <Modal
          visible={seletorObraVisible}
          onDismiss={() => setSeletorObraVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitulo}>Selecionar Obra</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            <Button
              mode="outlined"
              onPress={() => { setFiltroObra(''); setSeletorObraVisible(false); }}
              style={{ marginBottom: 8 }}
            >
              Todas as obras
            </Button>
            {obras.map((o) => (
              <Button
                key={o.id}
                mode={filtroObra === o.id ? 'contained' : 'outlined'}
                onPress={() => { setFiltroObra(o.id); setSeletorObraVisible(false); }}
                style={{ marginBottom: 6 }}
              >
                {o.nome}
              </Button>
            ))}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Modal criar/editar pavimento */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text style={styles.modalTitulo}>
                {editando ? 'Editar Pavimento' : 'Novo Pavimento'}
              </Text>
              {!editando && (
                <>
                  <Text style={styles.fieldLabel}>Obra *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {obras.map((o) => (
                      <Chip
                        key={o.id}
                        selected={form.id_obra === o.id}
                        onPress={() => setForm((f) => ({ ...f, id_obra: o.id }))}
                        style={styles.chipOption}
                      >
                        {o.nome}
                      </Chip>
                    ))}
                  </ScrollView>
                </>
              )}
              <TextInput
                label="Nome *"
                value={form.nome}
                onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Ordem"
                value={form.ordem}
                onChangeText={(v) => setForm((f) => ({ ...f, ordem: v }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
                <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}>
                  Salvar
                </Button>
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
  filtroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 1,
  },
  filtroLabel: { fontSize: 13, color: '#555', marginRight: 8 },
  filtroBtn: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  chip: { alignSelf: 'flex-start', marginTop: 4, height: 22 },
  chipOption: { marginRight: 6 },
  actions: { flexDirection: 'row' },
  emptyText: { color: '#999', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: SM_COLORS.primary },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: SM_COLORS.primary, marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
});
