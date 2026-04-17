import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  ActivityIndicator,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../services/api';

interface ResumoFinanceiro {
  total_lotes: number;
  total_pago: number;
  total_pendente: number;
  por_status?: Record<string, number>;
}

interface LotePagamento {
  id: string;
  descricao: string;
  data_competencia: string;
  data_pagamento?: string;
  valor_total: number;
  qtd_medicoes: number;
  status: string;
}

const STATUS_COR: Record<string, string> = {
  RASCUNHO: '#607d8b',
  AGUARDANDO_APROVACAO: '#ff9800',
  APROVADO: '#1976d2',
  PROCESSANDO: '#9c27b0',
  PAGO: '#4caf50',
  CANCELADO: '#f44336',
};

const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  AGUARDANDO_APROVACAO: 'Aguardando',
  APROVADO: 'Aprovado',
  PROCESSANDO: 'Processando',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
};

const formatCurrency = (v: number | string) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (d: string) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('pt-BR');
};

export const FinanceiroScreen = ({ navigation }: any) => {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [lotes, setLotes] = useState<LotePagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const carregarDados = useCallback(async () => {
    try {
      // Carregar lotes de pagamento
      const [lotesRes, resumoRes] = await Promise.all([
        apiClient.getClient().get('/financeiro/lotes', { params: { limit: 50 } }),
        apiClient.getClient().get('/financeiro/resumo').catch(() => ({ data: null })),
      ]);

      const listaLotes = Array.isArray(lotesRes.data) ? lotesRes.data : lotesRes.data?.data ?? [];
      setLotes(listaLotes);

      if (resumoRes.data) {
        setResumo(resumoRes.data);
      } else {
        // Calcular resumo a partir dos lotes
        const r = listaLotes.reduce(
          (acc: ResumoFinanceiro, l: LotePagamento) => {
            acc.total_lotes++;
            if (l.status === 'PAGO') acc.total_pago += Number(l.valor_total);
            else acc.total_pendente += Number(l.valor_total);
            return acc;
          },
          { total_lotes: 0, total_pago: 0, total_pendente: 0 },
        );
        setResumo(r);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar dados financeiros.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      carregarDados();
    }, [carregarDados]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const atalhos = [
    {
      label: 'Vales de\nAdiantamento',
      icon: 'cash-multiple',
      color: '#1976d2',
      tela: 'ValesAdiantamento',
    },
    {
      label: 'Medições\nColaborador',
      icon: 'chart-box-outline',
      color: '#388e3c',
      tela: 'Medicoes',
    },
    {
      label: 'Relatórios\nFinanceiros',
      icon: 'file-chart-outline',
      color: '#f57c00',
      tela: 'Dashboard',
    },
    {
      label: 'Aprovações\nde Preços',
      icon: 'check-decagram-outline',
      color: '#8e24aa',
      tela: 'Precos',
    },
  ];

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" color="#1976d2" /></View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Cards de resumo */}
      {resumo && (
        <View style={styles.resumoRow}>
          <View style={styles.resumoCard}>
            <Text style={styles.resumoValor}>{resumo.total_lotes}</Text>
            <Text style={styles.resumoLabel}>Lotes</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: '#e8f5e9' }]}>
            <Text style={[styles.resumoValor, { color: '#2e7d32' }]}>{formatCurrency(resumo.total_pago)}</Text>
            <Text style={styles.resumoLabel}>Total Pago</Text>
          </View>
          <View style={[styles.resumoCard, { backgroundColor: '#fff3e0' }]}>
            <Text style={[styles.resumoValor, { color: '#e65100' }]}>{formatCurrency(resumo.total_pendente)}</Text>
            <Text style={styles.resumoLabel}>Pendente</Text>
          </View>
        </View>
      )}

      {/* Atalhos */}
      <Text style={styles.sectionTitle}>Acesso Rápido</Text>
      <View style={styles.atalhoGrid}>
        {atalhos.map((a) => (
          <TouchableOpacity
            key={a.tela}
            style={styles.atalhoCard}
            onPress={() => navigation.navigate(a.tela)}
          >
            <MaterialCommunityIcons name={a.icon} size={32} color={a.color} />
            <Text style={styles.atalhoLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lotes de pagamento */}
      <Text style={styles.sectionTitle}>Últimos Lotes de Pagamento</Text>
      {lotes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum lote cadastrado.</Text>
        </View>
      ) : (
        lotes.slice(0, 10).map((lote) => (
          <Card key={lote.id} style={styles.card}>
            <Card.Content>
              <View style={styles.loteHeader}>
                <Text style={styles.loteDesc}>{lote.descricao || `Lote #${lote.id.slice(0, 8)}`}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COR[lote.status] ?? '#999' }]}>
                  <Text style={styles.badgeText}>{STATUS_LABEL[lote.status] ?? lote.status}</Text>
                </View>
              </View>
              <Text style={styles.sub}>
                Competência: {formatDate(lote.data_competencia)}
                {lote.data_pagamento ? ` · Pago: ${formatDate(lote.data_pagamento)}` : ''}
              </Text>
              <View style={styles.loteValores}>
                <Text style={styles.valorTotal}>{formatCurrency(lote.valor_total)}</Text>
                <Text style={styles.qtdMedicoes}>{lote.qtd_medicoes} medições</Text>
              </View>
            </Card.Content>
          </Card>
        ))
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  resumoRow: { flexDirection: 'row', padding: 12, gap: 8 },
  resumoCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
  },
  resumoValor: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  resumoLabel: { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  atalhoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8, marginBottom: 4 },
  atalhoCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
  },
  atalhoLabel: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 6 },
  card: { marginHorizontal: 12, marginBottom: 8, borderRadius: 8 },
  loteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  loteDesc: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 8 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  sub: { fontSize: 12, color: '#666', marginBottom: 4 },
  loteValores: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  valorTotal: { fontSize: 16, fontWeight: '700', color: '#1976d2' },
  qtdMedicoes: { fontSize: 12, color: '#888' },
  empty: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#999', fontSize: 15 },
});
