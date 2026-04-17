import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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
  Searchbar,
  ActivityIndicator,
  Chip,
  IconButton,
  Switch,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';
import { SM_COLORS } from '../theme/colors';

interface Colaborador {
  id: string;
  nome_completo: string;
  cpf_nif: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo: boolean;
}

const emptyForm = {
  nome_completo: '',
  cpf_nif: '',
  email: '',
  telefone: '',
  data_nascimento: '',
  endereco: '',
  ativo: true,
};

export const ColaboradoresScreen = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const carregar = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/colaboradores', {
        params: { limit: 200 },
      });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setColaboradores(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os colaboradores.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
    setForm({ ...emptyForm });
    setModalVisible(true);
  };

  const abrirEditar = (c: Colaborador) => {
    setEditando(c);
    setForm({
      nome_completo: c.nome_completo,
      cpf_nif: c.cpf_nif,
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      data_nascimento: c.data_nascimento?.split('T')[0] ?? '',
      endereco: c.endereco ?? '',
      ativo: c.ativo,
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.nome_completo.trim()) {
      Alert.alert('Atenção', 'Nome completo é obrigatório.');
      return;
    }
    if (!form.cpf_nif.trim()) {
      Alert.alert('Atenção', 'CPF/NIF é obrigatório.');
      return;
    }
    const payload: any = {
      nome_completo: form.nome_completo,
      cpf_nif: form.cpf_nif,
      ativo: form.ativo,
    };
    if (form.email.trim()) payload.email = form.email;
    if (form.telefone.trim()) payload.telefone = form.telefone;
    if (form.data_nascimento.trim()) payload.data_nascimento = form.data_nascimento;
    if (form.endereco.trim()) payload.endereco = form.endereco;

    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/colaboradores/${editando.id}`, payload);
      } else {
        await apiClient.getClient().post('/colaboradores', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar colaborador.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (c: Colaborador) => {
    Alert.alert(
      'Excluir Colaborador',
      `Deseja excluir "${c.nome_completo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.getClient().delete(`/colaboradores/${c.id}`);
              carregar();
            } catch {
              Alert.alert('Erro', 'Falha ao excluir colaborador.');
            }
          },
        },
      ],
    );
  };

  const filtrados = colaboradores.filter((c) =>
    `${c.nome_completo} ${c.cpf_nif}`.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Colaborador }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons
          name="account-hard-hat-outline"
          size={32}
          color={SM_COLORS.primary}
          style={styles.icon}
        />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome_completo}</Text>
          <Text style={styles.sub}>{item.cpf_nif}</Text>
          {item.telefone ? <Text style={styles.detalhe}>{item.telefone}</Text> : null}
          <Chip
            compact
            style={[styles.chip, { backgroundColor: item.ativo ? '#e8f5e9' : '#fce4ec' }]}
            textStyle={{ color: item.ativo ? '#2e7d32' : '#c62828', fontSize: 11 }}
          >
            {item.ativo ? 'Ativo' : 'Inativo'}
          </Chip>
        </View>
        <View style={styles.actions}>
          <IconButton icon="pencil-outline" size={20} onPress={() => abrirEditar(item)} />
          <IconButton
            icon="trash-can-outline"
            size={20}
            iconColor="#f44336"
            onPress={() => excluir(item)}
          />
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

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar colaboradores..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Nenhum colaborador encontrado.</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={abrirCriar}
        label="Novo"
        color="#fff"
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text style={styles.modalTitulo}>
                {editando ? 'Editar Colaborador' : 'Novo Colaborador'}
              </Text>
              <TextInput
                label="Nome Completo *"
                value={form.nome_completo}
                onChangeText={(v) => setForm((f) => ({ ...f, nome_completo: v }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="CPF/NIF *"
                value={form.cpf_nif}
                onChangeText={(v) => setForm((f) => ({ ...f, cpf_nif: v }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
              <TextInput
                label="E-mail"
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                label="Telefone"
                value={form.telefone}
                onChangeText={(v) => setForm((f) => ({ ...f, telefone: v }))}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
              />
              <TextInput
                label="Data de Nascimento (AAAA-MM-DD)"
                value={form.data_nascimento}
                onChangeText={(v) => setForm((f) => ({ ...f, data_nascimento: v }))}
                style={styles.input}
                mode="outlined"
                placeholder="2000-01-31"
              />
              <TextInput
                label="Endereço"
                value={form.endereco}
                onChangeText={(v) => setForm((f) => ({ ...f, endereco: v }))}
                style={styles.input}
                mode="outlined"
              />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Ativo</Text>
                <Switch
                  value={form.ativo}
                  onValueChange={(v) => setForm((f) => ({ ...f, ativo: v }))}
                  color={SM_COLORS.primary}
                />
              </View>
              <View style={styles.modalActions}>
                <Button onPress={() => setModalVisible(false)} style={styles.btnCancelar}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={salvar}
                  loading={salvando}
                  disabled={salvando}
                >
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
  searchbar: { margin: 12, borderRadius: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 1,
    marginHorizontal: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  detalhe: { fontSize: 12, color: '#888', marginTop: 1 },
  chip: { alignSelf: 'flex-start', marginTop: 4, height: 22 },
  actions: { flexDirection: 'row' },
  emptyText: { color: '#999', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: SM_COLORS.primary,
  },
  modal: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: SM_COLORS.primary, marginBottom: 16 },
  input: { marginBottom: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: { fontSize: 15, color: '#333' },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  btnCancelar: { marginRight: 4 },
});
