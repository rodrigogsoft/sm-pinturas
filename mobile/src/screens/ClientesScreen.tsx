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
  Divider,
  IconButton,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';

interface Cliente {
  id: string;
  razao_social: string;
  cnpj_nif: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  dia_corte?: number;
}

const emptyForm = {
  razao_social: '',
  cnpj_nif: '',
  email: '',
  telefone: '',
  endereco: '',
  dia_corte: '10',
};

export const ClientesScreen = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const carregar = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/clientes', {
        params: { limit: 200 },
      });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setClientes(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os clientes.');
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

  const abrirEditar = (c: Cliente) => {
    setEditando(c);
    setForm({
      razao_social: c.razao_social,
      cnpj_nif: c.cnpj_nif,
      email: c.email ?? '',
      telefone: c.telefone ?? '',
      endereco: c.endereco ?? '',
      dia_corte: String(c.dia_corte ?? 10),
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.razao_social.trim()) {
      Alert.alert('Atenção', 'Razão social é obrigatória.');
      return;
    }
    if (!form.cnpj_nif.trim()) {
      Alert.alert('Atenção', 'CNPJ/NIF é obrigatório.');
      return;
    }
    const payload: any = {
      razao_social: form.razao_social,
      cnpj_nif: form.cnpj_nif,
      dia_corte: Number(form.dia_corte) || 10,
    };
    if (form.email.trim()) payload.email = form.email;
    if (form.telefone.trim()) payload.telefone = form.telefone;
    if (form.endereco.trim()) payload.endereco = form.endereco;

    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/clientes/${editando.id}`, payload);
      } else {
        await apiClient.getClient().post('/clientes', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar cliente.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (c: Cliente) => {
    Alert.alert(
      'Excluir Cliente',
      `Deseja excluir "${c.razao_social}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.getClient().delete(`/clientes/${c.id}`);
              carregar();
            } catch {
              Alert.alert('Erro', 'Falha ao excluir cliente.');
            }
          },
        },
      ],
    );
  };

  const filtrados = clientes.filter((c) =>
    `${c.razao_social} ${c.cnpj_nif}`.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: Cliente }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name="domain" size={32} color="#1976d2" style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.razao_social}</Text>
          <Text style={styles.sub}>{item.cnpj_nif}</Text>
          {item.email ? <Text style={styles.detalhe}>{item.email}</Text> : null}
          {item.telefone ? <Text style={styles.detalhe}>{item.telefone}</Text> : null}
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
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar clientes..."
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
            <Text style={styles.emptyText}>Nenhum cliente encontrado.</Text>
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
                {editando ? 'Editar Cliente' : 'Novo Cliente'}
              </Text>
              <TextInput
                label="Razão Social *"
                value={form.razao_social}
                onChangeText={(v) => setForm((f) => ({ ...f, razao_social: v }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="CNPJ/NIF *"
                value={form.cnpj_nif}
                onChangeText={(v) => setForm((f) => ({ ...f, cnpj_nif: v }))}
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
                label="Endereço"
                value={form.endereco}
                onChangeText={(v) => setForm((f) => ({ ...f, endereco: v }))}
                style={styles.input}
                mode="outlined"
              />
              <TextInput
                label="Dia de Corte"
                value={form.dia_corte}
                onChangeText={(v) => setForm((f) => ({ ...f, dia_corte: v }))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />
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
  actions: { flexDirection: 'row' },
  emptyText: { color: '#999', fontSize: 15 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1976d2',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: 16,
  },
  input: { marginBottom: 12 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  btnCancelar: { marginRight: 4 },
});
