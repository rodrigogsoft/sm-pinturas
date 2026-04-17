import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../services/api';
import { SM_COLORS } from '../theme/colors';

interface ValeAdiantamento {
  id: string;
  id_colaborador: string;
  valor_solicitado: number;
  valor_aprovado?: number;
  status: string;
  motivo?: string;
  observacoes?: string;
  created_at: string;
  colaborador?: { nome_completo?: string };
}

const STATUS_COR: Record<string, string> = {
  SOLICITADO: '#FF9800',
  APROVADO: '#4CAF50',
  PAGO: '#2196F3',
  PARCIALMENTE_COMPENSADO: '#9C27B0',
  COMPENSADO: '#607D8B',
  CANCELADO: '#F44336',
};

const formatCurrency = (valor: number) =>
  Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ValesAdiantamentoScreen = () => {
  const [vales, setVales] = useState<ValeAdiantamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/vale-adiantamento');
      setVales(Array.isArray(data) ? data : data?.data ?? []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os vales.');
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

  const renderItem = ({ item }: { item: ValeAdiantamento }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nomeColaborador}>
          {item.colaborador?.nome_completo ?? 'Colaborador'}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COR[item.status] ?? '#999' },
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <MaterialCommunityIcons name="currency-brl" size={16} color="#666" />
        <Text style={styles.valor}>
          Solicitado: {formatCurrency(item.valor_solicitado)}
        </Text>
      </View>

      {item.valor_aprovado !== undefined && (
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="check-circle-outline" size={16} color="#4CAF50" />
          <Text style={styles.valorAprovado}>
            Aprovado: {formatCurrency(item.valor_aprovado)}
          </Text>
        </View>
      )}

      {item.motivo ? (
        <Text style={styles.motivo}>Motivo: {item.motivo}</Text>
      ) : null}

      <Text style={styles.data}>
        {new Date(item.created_at).toLocaleDateString('pt-BR')}
      </Text>
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
    <FlatList
      data={vales}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.center}>
          <MaterialCommunityIcons name="cash-remove" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Nenhum vale encontrado.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#999', marginTop: 8, fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nomeColaborador: { fontSize: 15, fontWeight: '700', color: '#212121', flex: 1 },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  valor: { fontSize: 14, color: '#444' },
  valorAprovado: { fontSize: 14, color: '#4CAF50', fontWeight: '600' },
  motivo: { fontSize: 13, color: '#666', fontStyle: 'italic', marginTop: 4 },
  data: { fontSize: 12, color: '#999', marginTop: 6, textAlign: 'right' },
});
