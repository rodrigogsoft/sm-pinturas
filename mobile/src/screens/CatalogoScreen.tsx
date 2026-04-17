import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  Alert,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Paragraph,
  Chip,
  Portal,
  Modal,
  Button,
  Text,
  Divider,
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import {
  servicosService,
  CategoriaServicoEnum,
  Servico,
  EstatisticasServico,
} from '../services/servicos.service';
import { apiClient } from '../services/api';
import { SM_COLORS } from '../theme/colors';

export const CatalogoScreen = ({ navigation }: any) => {
  const { width } = useWindowDimensions();
  const telaPequena = width < 390;
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaServicoEnum | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [estatisticas, setEstatisticas] = useState<EstatisticasServico | null>(null);
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    unidade_medida: '',
    categoria: CategoriaServicoEnum.OUTROS as CategoriaServicoEnum,
  });

  const carregarServicos = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await servicosService.getServicos({
        categoria: categoriaFiltro,
        search: searchQuery,
        orderBy: 'categoria',
        ativo: true,
      });
      setServicos(dados);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    } finally {
      setLoading(false);
    }
  }, [categoriaFiltro, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      carregarServicos();
    }, [carregarServicos])
  );

  const handleVerDetalhes = async (servico: Servico) => {
    setServicoSelecionado(servico);
    setEditando(false);
    setForm({
      nome: servico.nome || '',
      descricao: servico.descricao || '',
      unidade_medida: servico.unidade_medida || '',
      categoria: servico.categoria || CategoriaServicoEnum.OUTROS,
    });
    setModalVisible(true);
    
    // Buscar estatísticas
    const stats = await servicosService.getEstatisticasServico(servico.id);
    setEstatisticas(stats);
  };

  const handleFecharModal = () => {
    setModalVisible(false);
    setEditando(false);
    setSalvando(false);
    setServicoSelecionado(null);
    setEstatisticas(null);
  };

  const handleSalvarEdicao = async () => {
    if (!servicoSelecionado) return;

    if (!form.nome.trim()) {
      Alert.alert('Validação', 'Nome do serviço é obrigatório.');
      return;
    }

    if (!form.unidade_medida.trim()) {
      Alert.alert('Validação', 'Unidade de medida é obrigatória.');
      return;
    }

    try {
      setSalvando(true);
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        unidade_medida: form.unidade_medida.trim(),
        categoria: form.categoria,
      };

      const response = await apiClient.getClient().patch(`/servicos/${servicoSelecionado.id}`, payload);
      const atualizado: Servico = response?.data ?? { ...servicoSelecionado, ...payload, ativo: servicoSelecionado.ativo };

      setServicoSelecionado(atualizado);
      setServicos((prev) =>
        prev.map((servico) => (servico.id === servicoSelecionado.id ? { ...servico, ...atualizado } : servico))
      );

      setEditando(false);
      Alert.alert('Sucesso', 'Serviço atualizado com sucesso.');
    } catch (error: any) {
      const mensagem =
        error?.response?.data?.message ||
        error?.message ||
        'Não foi possível atualizar o serviço.';
      Alert.alert('Erro', Array.isArray(mensagem) ? mensagem.join('\n') : String(mensagem));
    } finally {
      setSalvando(false);
    }
  };

  const renderCategoria = ({ item }: { item: { value: CategoriaServicoEnum; label: string } }) => (
    <Chip
      selected={categoriaFiltro === item.value}
      onPress={() => {
        if (categoriaFiltro === item.value) {
          setCategoriaFiltro(undefined);
        } else {
          setCategoriaFiltro(item.value);
        }
      }}
      style={styles.chip}
      textStyle={styles.chipText}
      icon={() => (
        <MaterialCommunityIcons
          name={servicosService.getIconeCategoria(item.value)}
          size={18}
          color={categoriaFiltro === item.value ? '#fff' : servicosService.getCorCategoria(item.value)}
        />
      )}
    >
      {item.label}
    </Chip>
  );

  const renderServico = ({ item }: { item: Servico }) => (
    <TouchableOpacity onPress={() => handleVerDetalhes(item)}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name={servicosService.getIconeCategoria(item.categoria)}
              size={32}
              color={servicosService.getCorCategoria(item.categoria)}
            />
            <View style={styles.cardInfo}>
              <Title style={styles.cardTitle}>{item.nome}</Title>
              <Paragraph style={styles.cardCategoria}>{item.categoria}</Paragraph>
            </View>
          </View>

          {item.descricao && (
            <Paragraph style={styles.descricao} numberOfLines={2}>
              {item.descricao}
            </Paragraph>
          )}

          <View style={styles.cardFooter}>
            <Chip
              icon="ruler"
              style={styles.unidadeChip}
              textStyle={styles.unidadeText}
            >
              {item.unidade_medida}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, telaPequena && styles.headerCompacto]}>
        <Searchbar
          placeholder="Buscar serviço..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, telaPequena && styles.searchbarCompacta]}
        />
      </View>

      {/* Filtro de Categorias */}
      <FlatList
        horizontal
        data={servicosService.getCategorias()}
        renderItem={renderCategoria}
        keyExtractor={(item) => item.value}
        contentContainerStyle={[styles.categoriasList, telaPequena && styles.categoriasListCompacta]}
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={false}
      />

      {/* Lista de Serviços */}
      <FlatList
        data={servicos}
        renderItem={renderServico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, telaPequena && styles.listCompacta]}
        onRefresh={carregarServicos}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>
          </View>
        }
      />

      {/* Modal de Detalhes */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={handleFecharModal}
          contentContainerStyle={styles.modal}
        >
          {servicoSelecionado && (
            <View>
              <View style={styles.modalHeader}>
                <MaterialCommunityIcons
                  name={servicosService.getIconeCategoria(servicoSelecionado.categoria)}
                  size={40}
                  color={servicosService.getCorCategoria(servicoSelecionado.categoria)}
                />
                <View style={styles.modalHeaderText}>
                  <Title>{servicoSelecionado.nome}</Title>
                  <Paragraph>{servicoSelecionado.categoria}</Paragraph>
                </View>
              </View>

              <Divider style={styles.divider} />

              {editando ? (
                <>
                  <TextInput
                    label="Nome"
                    mode="outlined"
                    value={form.nome}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, nome: value }))}
                    style={styles.input}
                  />

                  <TextInput
                    label="Descrição"
                    mode="outlined"
                    value={form.descricao}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, descricao: value }))}
                    style={styles.input}
                    multiline
                    numberOfLines={3}
                  />

                  <TextInput
                    label="Unidade de Medida"
                    mode="outlined"
                    value={form.unidade_medida}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, unidade_medida: value.toUpperCase() }))}
                    style={styles.input}
                  />

                  <Text style={styles.modalLabel}>Categoria</Text>
                  <View style={styles.categoriaEditorWrap}>
                    {servicosService.getCategorias().map((categoria) => (
                      <Chip
                        key={categoria.value}
                        selected={form.categoria === categoria.value}
                        onPress={() => setForm((prev) => ({ ...prev, categoria: categoria.value }))}
                        style={styles.chipEditor}
                      >
                        {categoria.label}
                      </Chip>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  {servicoSelecionado.descricao && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>Descrição</Text>
                      <Paragraph>{servicoSelecionado.descricao}</Paragraph>
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Unidade de Medida</Text>
                    <Paragraph>{servicoSelecionado.unidade_medida}</Paragraph>
                  </View>
                </>
              )}

              {!editando && estatisticas && (
                <>
                  <Divider style={styles.divider} />
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Estatísticas de Uso</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estatisticas.total_obras}</Text>
                        <Text style={styles.statLabel}>Obras</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={styles.statValue}>{estatisticas.total_medicoes}</Text>
                        <Text style={styles.statLabel}>Medições</Text>
                      </View>
                    </View>
                    {estatisticas.ultima_utilizacao && (
                      <Paragraph style={styles.ultimaUtilizacao}>
                        Última utilização: {new Date(estatisticas.ultima_utilizacao).toLocaleDateString('pt-BR')}
                      </Paragraph>
                    )}
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                {editando ? (
                  <>
                    <Button mode="outlined" onPress={() => setEditando(false)} style={styles.actionBtn}>
                      Cancelar
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleSalvarEdicao}
                      loading={salvando}
                      disabled={salvando}
                      style={styles.actionBtn}
                    >
                      Salvar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button mode="outlined" onPress={() => setEditando(true)} style={styles.actionBtn}>
                      Editar
                    </Button>
                    <Button mode="contained" onPress={handleFecharModal} style={styles.actionBtn}>
                      Fechar
                    </Button>
                  </>
                )}
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  searchbarCompacta: {
    height: 46,
  },
  categoriasList: {
    paddingHorizontal: 16,
    paddingRight: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriasListCompacta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chip: {
    marginRight: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    lineHeight: 16,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  listCompacta: {
    padding: 12,
    paddingBottom: 88,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  headerCompacto: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  cardCategoria: {
    fontSize: 12,
    color: '#666',
  },
  descricao: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  unidadeChip: {
    height: 28,
  },
  unidadeText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  modal: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderText: {
    marginLeft: 16,
    flex: 1,
  },
  divider: {
    marginVertical: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SM_COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ultimaUtilizacao: {
    fontSize: 12,
    color: '#666',
    marginTop: 12,
  },
  closeButton: {
    marginTop: 8,
  },
  input: {
    marginBottom: 10,
  },
  categoriaEditorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chipEditor: {
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
