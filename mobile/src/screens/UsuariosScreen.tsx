import React, { useCallback, useState } from 'react';
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
import { useAppSelector } from '../hooks/redux';
import { SM_COLORS } from '../theme/colors';

interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  id_perfil: number;
  ativo: boolean;
  perfil?: { nome?: string };
}

const PERFIS = [
  { id: 1, nome: 'Administrador' },
  { id: 2, nome: 'Gestor' },
  { id: 3, nome: 'Financeiro' },
  { id: 4, nome: 'Encarregado' },
];

const PERFIL_COR: Record<number, string> = {
  1: '#7b1fa2',
  2: '#1565c0',
  3: '#2e7d32',
  4: '#e65100',
};

const emptyForm = {
  nome_completo: '',
  email: '',
  password: '',
  id_perfil: '4',
};

export const UsuariosScreen = () => {
  const { usuario } = useAppSelector((state) => state.auth);
  const isAdmin = ['ADMIN', 'admin', '1'].includes(
    String((usuario as any)?.perfil?.id ?? (usuario as any)?.id_perfil ?? (usuario as any)?.papel ?? ''),
  );

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });

  const carregar = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/usuarios', { params: { limit: 200 } });
      const lista = Array.isArray(data) ? data : data?.data ?? [];
      setUsuarios(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => { setLoading(true); carregar(); }, [carregar]),
  );

  const onRefresh = () => { setRefreshing(true); carregar(); };

  const abrirCriar = () => {
    setEditando(null);
    setForm({ ...emptyForm });
    setModalVisible(true);
  };

  const abrirEditar = (u: Usuario) => {
    setEditando(u);
    setForm({
      nome_completo: u.nome_completo,
      email: u.email,
      password: '',
      id_perfil: String(u.id_perfil),
    });
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!form.nome_completo.trim()) { Alert.alert('Atenção', 'Nome é obrigatório.'); return; }
    if (!form.email.trim()) { Alert.alert('Atenção', 'E-mail é obrigatório.'); return; }
    if (!editando && !form.password.trim()) { Alert.alert('Atenção', 'Senha é obrigatória.'); return; }

    const payload: any = {
      nome_completo: form.nome_completo,
      email: form.email,
      id_perfil: Number(form.id_perfil),
    };
    if (form.password.trim()) payload.password = form.password;

    try {
      setSalvando(true);
      if (editando) {
        await apiClient.getClient().patch(`/usuarios/${editando.id}`, payload);
      } else {
        await apiClient.getClient().post('/auth/register', payload);
      }
      setModalVisible(false);
      carregar();
    } catch (err: any) {
      Alert.alert('Erro', err?.response?.data?.message ?? 'Falha ao salvar usuário.');
    } finally {
      setSalvando(false);
    }
  };

  const excluir = (u: Usuario) => {
    Alert.alert('Excluir Usuário', `Deseja excluir "${u.nome_completo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.getClient().delete(`/usuarios/${u.id}`);
            carregar();
          } catch { Alert.alert('Erro', 'Falha ao excluir usuário.'); }
        },
      },
    ]);
  };

  const nomePerfil = (id: number) => PERFIS.find((p) => p.id === id)?.nome ?? `Perfil ${id}`;

  const renderItem = ({ item }: { item: Usuario }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <MaterialCommunityIcons name="account-circle-outline" size={32} color={SM_COLORS.primary} style={styles.icon} />
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome_completo}</Text>
          <Text style={styles.sub}>{item.email}</Text>
          <View style={styles.rowChips}>
            <Chip
              compact
              style={[styles.chip, { backgroundColor: PERFIL_COR[item.id_perfil] + '22' }]}
              textStyle={{ color: PERFIL_COR[item.id_perfil], fontSize: 11 }}
            >
              {item.perfil?.nome ?? nomePerfil(item.id_perfil)}
            </Chip>
            <Chip
              compact
              style={[styles.chip, { backgroundColor: item.ativo ? '#e8f5e9' : '#fce4ec', marginLeft: 6 }]}
              textStyle={{ color: item.ativo ? '#2e7d32' : '#c62828', fontSize: 11 }}
            >
              {item.ativo ? 'Ativo' : 'Inativo'}
            </Chip>
          </View>
        </View>
        {isAdmin && (
          <View style={styles.actions}>
            <IconButton icon="pencil-outline" size={20} onPress={() => abrirEditar(item)} />
            <IconButton icon="trash-can-outline" size={20} iconColor="#f44336" onPress={() => excluir(item)} />
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={SM_COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.center}><Text style={styles.emptyText}>Nenhum usuário encontrado.</Text></View>
        }
      />

      {isAdmin && (
        <FAB icon="plus" style={styles.fab} onPress={abrirCriar} label="Novo" color="#fff" />
      )}

      <Portal>
        <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles.modal}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView>
              <Text style={styles.modalTitulo}>{editando ? 'Editar Usuário' : 'Novo Usuário'}</Text>
              <TextInput label="Nome Completo *" value={form.nome_completo}
                onChangeText={(v) => setForm((f) => ({ ...f, nome_completo: v }))}
                style={styles.input} mode="outlined" />
              <TextInput label="E-mail *" value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                style={styles.input} mode="outlined" keyboardType="email-address" autoCapitalize="none" />
              <TextInput
                label={editando ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
                value={form.password}
                onChangeText={(v) => setForm((f) => ({ ...f, password: v }))}
                style={styles.input} mode="outlined" secureTextEntry />
              <Text style={styles.fieldLabel}>Perfil de Acesso *</Text>
              <View style={styles.chipRow}>
                {PERFIS.map((p) => (
                  <Chip
                    key={p.id}
                    selected={form.id_perfil === String(p.id)}
                    onPress={() => setForm((f) => ({ ...f, id_perfil: String(p.id) }))}
                    style={styles.chipOption}
                  >
                    {p.nome}
                  </Chip>
                ))}
              </View>
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
  card: { backgroundColor: '#fff', borderRadius: 8, elevation: 1 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  icon: { marginRight: 12 },
  info: { flex: 1 },
  nome: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  sub: { fontSize: 12, color: '#666', marginTop: 2 },
  rowChips: { flexDirection: 'row', marginTop: 4 },
  chip: { height: 22 },
  actions: { flexDirection: 'row' },
  emptyText: { color: '#999', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: SM_COLORS.primary },
  modal: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: SM_COLORS.primary, marginBottom: 16 },
  input: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chipOption: { marginBottom: 4 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 12 },
});
