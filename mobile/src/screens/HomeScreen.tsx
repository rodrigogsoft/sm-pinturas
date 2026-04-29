import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Title, Paragraph, Chip, Button, Badge } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSelector } from '../hooks/redux';
import { dashboardService } from '../services/dashboard.service';
import { notificacoesService, Notificacao } from '../services/notificacoes.service';
import { SM_COLORS } from '../theme/colors';

export const HomeScreen = ({ navigation }: any) => {
  const { usuario } = useAppSelector((state) => state.auth);
  const [resumo, setResumo] = React.useState({
    obrasAtivas: 0,
    medicoesPendentes: 0,
    rdosDiarias: 0,
    saldoFaturamento: 0,
  });
  const [notificacoes, setNotificacoes] = React.useState<Notificacao[]>([]);
  const [countNaoLidas, setCountNaoLidas] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = React.useState<Date | null>(null);

  const carregarResumo = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar resumo do dashboard
      const dadosResumo = await dashboardService.getResumoHome();
      setResumo(dadosResumo);

      // Buscar notificações recentes (últimas 3)
      const notifs = await notificacoesService.getMinhasNotificacoes({
        limit: 3,
      });
      setNotificacoes(notifs);

      // Buscar contagem de não lidas
      const count = await notificacoesService.getCountNaoLidas();
      setCountNaoLidas(count);

      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarResumo();
    }, [carregarResumo])
  );

  // Função auxiliar para formatar tempo relativo
  const formatTempoRelativo = (data: Date): string => {
    const agora = new Date();
    const diff = Math.floor((agora.getTime() - data.getTime()) / 1000); // em segundos

    if (diff < 60) return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `há ${Math.floor(diff / 86400)}d`;
    return data.toLocaleDateString('pt-BR');
  };

  // Função para obter ícone da notificação
  const getIconeNotificacao = (tipo: string): string => {
    const icones: Record<string, string> = {
      MEDICAO_PENDENTE: 'chart-box-outline',
      CICLO_FATURAMENTO: 'cash-multiple',
      LOTE_APROVACAO: 'check-circle-outline',
      PRECO_PENDENTE: 'currency-usd',
      OBRA_ATRASO: 'alert-circle-outline',
      SISTEMA: 'information',
    };
    return icones[tipo] || 'bell';
  };

  // Função para obter cor da notificação
  const getCorNotificacao = (prioridade: string): string => {
    const cores: Record<string, string> = {
      CRITICA: '#b71c1c',
      ALTA: '#f44336',
      MEDIA: '#ff9800',
      BAIXA: '#2196f3',
    };
    return cores[prioridade] || '#666';
  };

  const getDataNotificacao = (notif: Notificacao): Date => {
    const data = notif.created_at || notif.data_envio;
    return data ? new Date(data) : new Date();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={carregarResumo} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Paragraph style={styles.greeting}>Olá,</Paragraph>
            <Title style={styles.userName}>{usuario?.nome?.split(' ')[0]}</Title>
          </View>
          <MaterialCommunityIcons name="account-circle" size={50} color={SM_COLORS.primary} />
        </View>

        {/* Status Offline/Online */}
        <View style={styles.statusBar}>
          <MaterialCommunityIcons name="wifi-check" size={18} color="#4caf50" />
          <Text style={styles.statusText}>
            {ultimaAtualizacao
              ? `Atualizado ${formatTempoRelativo(ultimaAtualizacao)}`
              : 'Carregando...'}
          </Text>
        </View>

        {/* Cards de Resumo */}
        <View style={styles.cardsContainer}>
          {/* Obras Ativas */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardRow}>
                <View>
                  <Paragraph style={styles.cardLabel}>Obras Ativas</Paragraph>
                  <Title style={styles.cardValue}>{resumo.obrasAtivas}</Title>
                </View>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={40}
                  color={SM_COLORS.primary}
                  style={styles.cardIcon}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Medições Pendentes */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardRow}>
                <View>
                  <Paragraph style={styles.cardLabel}>Medições</Paragraph>
                  <Title style={styles.cardValue}>{resumo.medicoesPendentes}</Title>
                </View>
                <MaterialCommunityIcons
                  name="chart-box-outline"
                  size={40}
                  color="#ff9800"
                  style={styles.cardIcon}
                />
              </View>
            </Card.Content>
          </Card>

          {/* RDOs Diárias */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardRow}>
                <View>
                  <Paragraph style={styles.cardLabel}>RDOs Este Mês</Paragraph>
                  <Title style={styles.cardValue}>{resumo.rdosDiarias}</Title>
                </View>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={40}
                  color="#4caf50"
                  style={styles.cardIcon}
                />
              </View>
            </Card.Content>
          </Card>

          {/* Saldo Faturamento (Gestor/Admin apenas) */}
          {['admin', 'gerente'].includes(usuario?.papel || '') && (
            <Card style={[styles.card, { backgroundColor: '#f0f7ff' }]}>
              <Card.Content>
                <View style={styles.cardRow}>
                  <View>
                    <Paragraph style={styles.cardLabel}>Faturamento</Paragraph>
                    <Title style={styles.cardValue}>
                      R$ {resumo.saldoFaturamento.toFixed(2)}
                    </Title>
                  </View>
                  <MaterialCommunityIcons
                    name="cash-multiple"
                    size={40}
                    color="#2196f3"
                    style={styles.cardIcon}
                  />
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Ações Rápidas */}
        <View style={styles.acoesList}>
          <Paragraph style={styles.secaoTitulo}>Ações Rápidas</Paragraph>

          <Button
            mode="outlined"
            style={styles.actionButton}
            labelStyle={styles.buttonLabel}
            icon="plus-circle"
            onPress={() => navigation.navigate('Obras')}
          >
            Novo Apontamento
          </Button>

          <Button
            mode="outlined"
            style={styles.actionButton}
            labelStyle={styles.buttonLabel}
            icon="file-document-edit"
            onPress={() => navigation.navigate('RDO')}
          >
            Iniciar RDO
          </Button>

          {usuario?.papel === 'encarregado' && (
            <Button
              mode="outlined"
              style={styles.actionButton}
              labelStyle={styles.buttonLabel}
              icon="account-multiple-plus"
              onPress={() => navigation.navigate('Obras', { screen: 'Alocacao' })}
            >
              Alocar Equipe
            </Button>
          )}
        </View>

        {/* Últimas Notificações */}
        <View style={styles.notificacoes}>
          <View style={styles.secaoHeader}>
            <Paragraph style={styles.secaoTitulo}>Notificações</Paragraph>
            {countNaoLidas > 0 && (
              <Badge style={styles.badge}>{countNaoLidas}</Badge>
            )}
          </View>

          {notificacoes.length === 0 ? (
            <Card style={styles.notificacaoItem}>
              <Card.Content>
                <Paragraph style={styles.notifText}>
                  Nenhuma notificação recente
                </Paragraph>
              </Card.Content>
            </Card>
          ) : (
            notificacoes.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                onPress={() => {
                  notificacoesService.marcarComoLida(notif.id);
                  setCountNaoLidas(prev => Math.max(0, prev - 1));
                }}
              >
                <Card style={[
                  styles.notificacaoItem,
                  !notif.lida && styles.notificacaoNaoLida,
                ]}>
                  <Card.Content>
                    <View style={styles.notifRow}>
                      <MaterialCommunityIcons
                        name={getIconeNotificacao(notif.tipo)}
                        size={24}
                        color={getCorNotificacao(notif.prioridade)}
                      />
                      <View style={styles.notifContent}>
                        <Paragraph style={styles.notifTitle}>{notif.titulo}</Paragraph>
                        <Paragraph style={styles.notifText}>{notif.mensagem}</Paragraph>
                        <Paragraph style={styles.notifData}>
                          {formatTempoRelativo(getDataNotificacao(notif))}
                        </Paragraph>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}

          {notificacoes.length > 0 && (
            <Button
              mode="text"
              onPress={() => Alert.alert('Notificacoes', 'Tela completa de notificacoes sera disponibilizada em breve.')}
              style={styles.verTodasButton}
            >
              Ver todas as notificações
            </Button>
          )}
        </View>

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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  greeting: {
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SM_COLORS.primary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  cardsContainer: {
    padding: 12,
    gap: 10,
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SM_COLORS.primary,
  },
  cardIcon: {
    opacity: 0.3,
  },
  acoesList: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  actionButton: {
    marginBottom: 8,
    borderColor: SM_COLORS.primary,
    borderWidth: 1,
  },
  buttonLabel: {
    color: SM_COLORS.primary,
    fontSize: 14,
  },
  notificacoes: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  secaoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: '#f44336',
  },
  notificacaoItem: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  notificacaoNaoLida: {
    borderLeftWidth: 3,
    borderLeftColor: SM_COLORS.primary,
  },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  notifText: {
    fontSize: 12,
    color: '#666',
  },
  notifData: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  verTodasButton: {
    marginTop: 8,
  },
  footer: {
    height: 20,
  },
});
