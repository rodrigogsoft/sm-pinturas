import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { apiClient } from '../services/api';

interface ObraProgresso {
  id: string;
  nome: string;
  status: string;
  progresso: number;
  endereco_completo: string;
}

interface PavimentoProgresso {
  id: string;
  nome: string;
  progresso: number;
  status_progresso: string;
  ambientes?: AmbienteProgresso[];
}

interface AmbienteProgresso {
  id: string;
  nome: string;
  progresso: number;
  status_progresso: string;
}

const BAR_COLORS = {
  ABERTO: '#E0E0E0',
  EM_PROGRESSO: '#2196F3',
  CONCLUIDO: '#4CAF50',
};

const ProgressBar = ({
  valor,
  status,
}: {
  valor: number;
  status?: string;
}) => {
  const cor =
    BAR_COLORS[(status as keyof typeof BAR_COLORS) ?? 'ABERTO'] ?? '#2196F3';
  return (
    <View style={styles.progressBg}>
      <View
        style={[
          styles.progressFill,
          { width: `${Math.min(valor, 100)}%`, backgroundColor: cor },
        ]}
      />
    </View>
  );
};

export const DashboardObrasScreen = ({ navigation }: any) => {
  const [obras, setObras] = useState<ObraProgresso[]>([]);
  const [obraExpandida, setObraExpandida] = useState<string | null>(null);
  const [pavimentos, setPavimentos] = useState<Record<string, PavimentoProgresso[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPavs, setLoadingPavs] = useState<string | null>(null);

  const carregarObras = useCallback(async () => {
    try {
      const { data } = await apiClient.getClient().get('/obras');
      const ativas = (Array.isArray(data) ? data : []).filter(
        (o: ObraProgresso) => o.status === 'ATIVA' && !(o as any).deletado,
      );
      setObras(ativas);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as obras.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregarObras();
    }, [carregarObras]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarObras();
  };

  const expandirObra = async (idObra: string) => {
    if (obraExpandida === idObra) {
      setObraExpandida(null);
      return;
    }
    setObraExpandida(idObra);

    if (!pavimentos[idObra]) {
      setLoadingPavs(idObra);
      try {
        const { data } = await apiClient.getClient().get(
          `/pavimentos/obra/${idObra}`,
        );
        setPavimentos((prev) => ({ ...prev, [idObra]: data }));
      } catch {
        /* silencia */
      } finally {
        setLoadingPavs(null);
      }
    }
  };

  const renderObra = ({ item }: { item: ObraProgresso }) => {
    const expandida = obraExpandida === item.id;
    const pavs = pavimentos[item.id] ?? [];
    const carregandoPavs = loadingPavs === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => expandirObra(item.id)} activeOpacity={0.8}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="office-building" size={20} color="#1976d2" />
            <Text style={styles.nomeObra}>{item.nome}</Text>
            <MaterialCommunityIcons
              name={expandida ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </View>

          <Text style={styles.endereco} numberOfLines={1}>
            {item.endereco_completo}
          </Text>

          <View style={styles.progressRow}>
            <ProgressBar
              valor={Number(item.progresso || 0)}
              status={Number(item.progresso || 0) >= 100 ? 'CONCLUIDO' : 'EM_PROGRESSO'}
            />
            <Text style={styles.progressLabel}>
              {Number(item.progresso || 0).toFixed(1)}%
            </Text>
          </View>
        </TouchableOpacity>

        {/* Detalhe de pavimentos */}
        {expandida && (
          <View style={styles.detalhe}>
            {carregandoPavs ? (
              <ActivityIndicator size="small" color="#1976d2" style={{ margin: 8 }} />
            ) : pavs.length === 0 ? (
              <Text style={styles.semDados}>Sem pavimentos cadastrados.</Text>
            ) : (
              pavs.map((pav) => (
                <View key={pav.id} style={styles.pavimento}>
                  <Text style={styles.nomePavimento}>{pav.nome}</Text>
                  <View style={styles.progressRow}>
                    <ProgressBar
                      valor={Number(pav.progresso || 0)}
                      status={pav.status_progresso}
                    />
                    <Text style={styles.progressLabelSm}>
                      {Number(pav.progresso || 0).toFixed(0)}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <FlatList
      data={obras}
      keyExtractor={(item) => item.id}
      renderItem={renderObra}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Text style={styles.titulo}>Dashboard — Progresso das Obras</Text>
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <MaterialCommunityIcons name="briefcase-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Nenhuma obra ativa encontrada.</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  list: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nomeObra: { fontSize: 15, fontWeight: '700', color: '#212121', flex: 1 },
  endereco: { fontSize: 12, color: '#888', marginBottom: 8 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  progressBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabel: { fontSize: 13, fontWeight: '700', color: '#333', minWidth: 44 },
  progressLabelSm: { fontSize: 12, color: '#555', minWidth: 36 },
  detalhe: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  pavimento: { marginBottom: 8 },
  nomePavimento: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 2 },
  semDados: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
});
