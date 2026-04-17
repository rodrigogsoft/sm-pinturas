import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  SegmentedButtons,
  Text,
  Divider,
  DataTable,
  Menu,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import {
  relatoriosService,
  PeriodoEnum,
  MetricaRankingEnum,
  RelatorioExcedentes,
  RankingObras,
} from '../services/relatorios.service';
import { dashboardService, DashboardFinanceiro } from '../services/dashboard.service';
import { useAppSelector } from '../hooks/redux';
import { SM_COLORS } from '../theme/colors';

type TipoRelatorio = 'dashboard' | 'excedentes' | 'ranking';

export const RelatoriosScreen = ({ navigation }: any) => {
  const { usuario } = useAppSelector((state) => state.auth);
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('dashboard');
  const [periodo, setPeriodo] = useState<PeriodoEnum>(PeriodoEnum.MES);
  const [loading, setLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Dados dos relatórios
  const [dashboard, setDashboard] = useState<DashboardFinanceiro | null>(null);
  const [excedentes, setExcedentes] = useState<RelatorioExcedentes | null>(null);
  const [ranking, setRanking] = useState<RankingObras | null>(null);
  const [metricaRanking, setMetricaRanking] = useState<MetricaRankingEnum>(
    MetricaRankingEnum.MARGEM
  );

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      if (tipoRelatorio === 'dashboard') {
        const data = await dashboardService.getDashboardFinanceiro(periodo);
        setDashboard(data);
      } else if (tipoRelatorio === 'excedentes') {
        const data = await relatoriosService.getRelatorioExcedentes(periodo);
        setExcedentes(data);
      } else if (tipoRelatorio === 'ranking') {
        const data = await relatoriosService.getRankingObras(metricaRanking, 'DESC', 10, periodo);
        setRanking(data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoRelatorio, periodo, metricaRanking]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderDashboard = () => {
    if (!dashboard) {
      return (
        <View style={styles.emptyContainer}>
          <Text>Carregando dashboard...</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Métricas Gerais */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumo Financeiro</Title>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Obras Ativas</Text>
                <Text style={styles.metricValue}>{dashboard.metricas.obras_ativas}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Medições</Text>
                <Text style={styles.metricValue}>{dashboard.metricas.total_medicoes}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Receita Total</Text>
              <Text style={[styles.metricValue, styles.receita]}>
                {formatCurrency(dashboard.metricas.receita_total)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Custo Total</Text>
              <Text style={[styles.metricValue, styles.custo]}>
                {formatCurrency(dashboard.metricas.custo_total)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Lucro Bruto</Text>
              <Text style={[styles.metricValue, styles.lucro]}>
                {formatCurrency(dashboard.metricas.lucro_bruto)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Margem</Text>
              <Text style={[styles.metricValue, styles.margem]}>
                {formatPercent(dashboard.metricas.margem_percentual)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Por Obra */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Por Obra</Title>
            
            {dashboard.por_obra.map((obra, index) => (
              <View key={obra.obra_id} style={styles.obraItem}>
                {index > 0 && <Divider style={styles.divider} />}
                <Text style={styles.obraNome}>{obra.obra_nome}</Text>
                
                <View style={styles.obraStats}>
                  <View style={styles.obraStat}>
                    <Text style={styles.obraStatLabel}>Receita</Text>
                    <Text style={[styles.obraStatValue, styles.receita]}>
                      {formatCurrency(obra.receita)}
                    </Text>
                  </View>
                  <View style={styles.obraStat}>
                    <Text style={styles.obraStatLabel}>Margem</Text>
                     <Text style={[styles.obraStatValue, styles.margem]}>
                      {formatPercent(obra.margem)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderExcedentes = () => {
    if (!excedentes) {
      return (
        <View style={styles.emptyContainer}>
          <Text>Carregando relatório de excedentes...</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Resumo */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumo de Excedentes</Title>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Total Medições</Text>
                <Text style={styles.metricValue}>{excedentes.resumo.total_medicoes}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Excedentes</Text>
                <Text style={[styles.metricValue, styles.alert]}>
                  {excedentes.resumo.medicoes_excedentes}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>% Excedente</Text>
              <Text style={[styles.metricValue, styles.alert]}>
                {formatPercent(excedentes.resumo.percentual_excedente)}
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Valor Total</Text>
              <Text style={[styles.metricValue, styles.alert]}>
                {formatCurrency(excedentes.resumo.valor_total_excedente)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Top Ambientes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Top Ambientes com Excedentes</Title>
            
            {excedentes.top_ambientes.slice(0, 5).map((ambiente, index) => (
              <View key={ambiente.ambiente_id} style={styles.rankingItem}>
                <View style={styles.rankingPosition}>
                  <Text style={styles.rankingNumber}>{index + 1}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingNome}>{ambiente.ambiente_nome}</Text>
                  <Text style={styles.rankingSubtitle}>{ambiente.obra_nome}</Text>
                </View>
                <View style={styles.rankingValue}>
                  <Text style={[styles.rankingPercent, styles.alert]}>
                    {formatPercent(ambiente.percentual_excedente)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Top Colaboradores */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Top Colaboradores com Excedentes</Title>
            
            {excedentes.top_colaboradores.slice(0, 5).map((colab, index) => (
              <View key={colab.colaborador_id} style={styles.rankingItem}>
                <View style={styles.rankingPosition}>
                  <Text style={styles.rankingNumber}>{index + 1}</Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingNome}>{colab.colaborador_nome}</Text>
                  <Text style={styles.rankingSubtitle}>
                    {colab.medicoes_excedentes} de {colab.total_medicoes} medições
                  </Text>
                </View>
                <View style={styles.rankingValue}>
                  <Text style={[styles.rankingPercent, styles.alert]}>
                    {formatPercent(colab.percentual_excedente)}
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderRanking = () => {
    if (!ranking) {
      return (
        <View style={styles.emptyContainer}>
          <Text>Carregando ranking...</Text>
        </View>
      );
    }

    return (
      <View>
        {/* Seletor de Métrica */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ordenar por:</Title>
            <View style={styles.metricasButtons}>
              <Chip
                selected={metricaRanking === MetricaRankingEnum.MARGEM}
                onPress={() => setMetricaRanking(MetricaRankingEnum.MARGEM)}
                style={styles.metricaChip}
              >
                Margem
              </Chip>
              <Chip
                selected={metricaRanking === MetricaRankingEnum.RECEITA}
                onPress={() => setMetricaRanking(MetricaRankingEnum.RECEITA)}
                style={styles.metricaChip}
              >
                Receita
              </Chip>
              <Chip
                selected={metricaRanking === MetricaRankingEnum.LUCRO}
                onPress={() => setMetricaRanking(MetricaRankingEnum.LUCRO)}
                style={styles.metricaChip}
              >
                Lucro
              </Chip>
              <Chip
                selected={metricaRanking === MetricaRankingEnum.PRODUTIVIDADE}
                onPress={() => setMetricaRanking(MetricaRankingEnum.PRODUTIVIDADE)}
                style={styles.metricaChip}
              >
                Produtividade
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Ranking */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ranking de Obras</Title>
            
            {ranking.ranking.map((obra) => (
              <View key={obra.obra_id} style={styles.rankingItem}>
                <View style={[
                  styles.rankingPosition,
                  obra.posicao <= 3 && styles.rankingTopPosition,
                ]}>
                  <Text style={[
                    styles.rankingNumber,
                    obra.posicao <= 3 && styles.rankingTopNumber,
                  ]}>
                    {obra.posicao}
                  </Text>
                </View>
                <View style={styles.rankingInfo}>
                  <Text style={styles.rankingNome}>{obra.obra_nome}</Text>
                  <Text style={styles.rankingSubtitle}>{obra.medicoes} medições</Text>
                </View>
                <View style={styles.rankingValue}>
                  {metricaRanking === MetricaRankingEnum.MARGEM && (
                    <Text style={[styles.rankingPercent, styles.success]}>
                      {formatPercent(obra.margem)}
                    </Text>
                  )}
                  {metricaRanking === MetricaRankingEnum.RECEITA && (
                    <Text style={[styles.rankingPercent, styles.success]}>
                      {formatCurrency(obra.receita)}
                    </Text>
                  )}
                  {metricaRanking === MetricaRankingEnum.LUCRO && (
                    <Text style={[styles.rankingPercent, styles.success]}>
                      {formatCurrency(obra.lucro)}
                    </Text>
                  )}
                  {metricaRanking === MetricaRankingEnum.PRODUTIVIDADE && (
                    <Text style={[styles.rankingPercent, styles.success]}>
                      {obra.produtividade.toFixed(1)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Relatórios</Title>
        
        {/* Filtro de Período */}
        <View style={styles.periodoContainer}>
          <Chip
            selected={periodo === PeriodoEnum.DIA}
            onPress={() => setPeriodo(PeriodoEnum.DIA)}
            style={styles.periodoChip}
          >
            Dia
          </Chip>
          <Chip
            selected={periodo === PeriodoEnum.SEMANA}
            onPress={() => setPeriodo(PeriodoEnum.SEMANA)}
            style={styles.periodoChip}
          >
            Semana
          </Chip>
          <Chip
            selected={periodo === PeriodoEnum.MES}
            onPress={() => setPeriodo(PeriodoEnum.MES)}
            style={styles.periodoChip}
          >
            Mês
          </Chip>
          <Chip
            selected={periodo === PeriodoEnum.ANO}
            onPress={() => setPeriodo(PeriodoEnum.ANO)}
            style={styles.periodoChip}
          >
            Ano
          </Chip>
        </View>
      </View>

      {/* Segmented Buttons */}
      <View style={styles.segmentedContainer}>
        <SegmentedButtons
          value={tipoRelatorio}
          onValueChange={(value) => setTipoRelatorio(value as TipoRelatorio)}
          buttons={[
            {
              value: 'dashboard',
              label: 'Dashboard',
              icon: 'view-dashboard',
            },
            {
              value: 'excedentes',
              label: 'Excedentes',
              icon: 'alert-circle',
            },
            {
              value: 'ranking',
              label: 'Ranking',
              icon: 'podium',
            },
          ]}
        />
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={carregarDados} />
        }
      >
        {tipoRelatorio === 'dashboard' && renderDashboard()}
        {tipoRelatorio === 'excedentes' && renderExcedentes()}
        {tipoRelatorio === 'ranking' && renderRanking()}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    marginBottom: 12,
  },
  periodoContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  periodoChip: {
    flex: 1,
  },
  segmentedContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SM_COLORS.primary,
    marginTop: 4,
  },
  receita: {
    color: '#4caf50',
  },
  custo: {
    color: '#f44336',
  },
  lucro: {
    color: '#2196f3',
  },
  margem: {
    color: '#9c27b0',
  },
  alert: {
    color: '#ff9800',
  },
  success: {
    color: '#4caf50',
  },
  divider: {
    marginVertical: 12,
  },
  obraItem: {
    marginBottom: 12,
  },
  obraNome: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  obraStats: {
    flexDirection: 'row',
    gap: 12,
  },
  obraStat: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  obraStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  obraStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  metricasButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricaChip: {
    marginRight: 0,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  rankingPosition: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingTopPosition: {
    backgroundColor: '#ffd700',
  },
  rankingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  rankingTopNumber: {
    color: '#fff',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingNome: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  rankingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  rankingValue: {
    alignItems: 'flex-end',
  },
  rankingPercent: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  footer: {
    height: 20,
  },
});
