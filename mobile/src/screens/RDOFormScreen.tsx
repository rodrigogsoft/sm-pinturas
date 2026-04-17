import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Button, Card, Chip, TextInput } from 'react-native-paper';
import { useAppDispatch } from '../hooks/redux';
import { salvarRDOLocal } from '../store/slices/rdoSlice';
import { Colaborador, Obra, RDO } from '../types';
import { apiClient } from '../services/api';
import { GeolocationService } from '../services/geolocation.service';

interface RDOFormRouteParams {
  obra: Obra;
  rdoDraft?: RDO;
  readOnly?: boolean;
  alocacaoItem?: {
    id?: string;
    id_alocacao_item?: string;
    id_colaborador?: string;
    id_item_ambiente?: string;
    area_planejada?: number;
  };
}

interface RDOFormScreenProps {
  route: { params: RDOFormRouteParams };
  navigation: { goBack: () => void };
}

export const RDOFormScreen = ({ route, navigation }: RDOFormScreenProps) => {
  const dispatch = useAppDispatch();
  const { obra, alocacaoItem, rdoDraft, readOnly } = route.params;

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<RDO>>({
    id_rdo: rdoDraft?.id_rdo,
    id_obra: rdoDraft?.id_obra || obra.id || obra.id_obra,
    id_colaborador: rdoDraft?.id_colaborador || alocacaoItem?.id_colaborador || '',
    id_alocacao_item:
      rdoDraft?.id_alocacao_item || alocacaoItem?.id_alocacao_item || alocacaoItem?.id,
    id_item_ambiente: rdoDraft?.id_item_ambiente || alocacaoItem?.id_item_ambiente,
    area_planejada: rdoDraft?.area_planejada || alocacaoItem?.area_planejada,
    data: rdoDraft?.data || new Date().toISOString().split('T')[0],
    horas_trabalhadas: Number(rdoDraft?.horas_trabalhadas || 0),
    area_pintada: Number(rdoDraft?.area_pintada || 0),
    materiais_utilizados: rdoDraft?.materiais_utilizados || '',
    observacoes: rdoDraft?.observacoes || '',
    assinatura: rdoDraft?.assinatura || '',
    localizacao_latitude: rdoDraft?.localizacao_latitude,
    localizacao_longitude: rdoDraft?.localizacao_longitude,
    status: 'rascunho',
  });

  useEffect(() => {
    if (!readOnly) {
      carregarColaboradores();
    }
  }, [readOnly]);

  const produtividade = useMemo(() => {
    const horas = Number(formData.horas_trabalhadas || 0);
    const area = Number(formData.area_pintada || 0);
    if (horas <= 0) return 0;
    return area / horas;
  }, [formData.horas_trabalhadas, formData.area_pintada]);

  const carregarColaboradores = async () => {
    try {
      const response = await apiClient.getColaboradores(1, 50);
      const lista = response.data?.data || response.data || [];
      setColaboradores(Array.isArray(lista) ? lista : []);
    } catch {
      Alert.alert('Erro', 'Falha ao carregar colaboradores');
    }
  };

  const handleCapturarLocalizacao = async () => {
    setLocationLoading(true);
    try {
      const coords = await GeolocationService.getCurrentPosition();
      setFormData(prev => ({
        ...prev,
        localizacao_latitude: coords.latitude,
        localizacao_longitude: coords.longitude,
      }));
      Alert.alert('Sucesso', 'Localizacao capturada com sucesso.');
    } catch (error: any) {
      Alert.alert('Erro', error?.message || 'Falha ao capturar localizacao');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.id_colaborador) {
      Alert.alert('Validacao', 'Informe o ID do colaborador.');
      return;
    }

    if (!formData.localizacao_latitude || !formData.localizacao_longitude) {
      Alert.alert('Validacao', 'Capture a localizacao antes de salvar.');
      return;
    }

    const horas = Number(formData.horas_trabalhadas || 0);
    const area = Number(formData.area_pintada || 0);
    if (horas <= 0 || area <= 0) {
      Alert.alert('Validacao', 'Preencha horas trabalhadas e area pintada com valores maiores que zero.');
      return;
    }

    setLoading(true);
    try {
      const percentualConclusao =
        Number(formData.area_planejada || 0) > 0
          ? Number(((area / Number(formData.area_planejada)) * 100).toFixed(2))
          : undefined;

      const rdoData: RDO = {
        id_rdo: formData.id_rdo,
        id_obra: String(formData.id_obra || ''),
        id_colaborador: String(formData.id_colaborador || ''),
        id_alocacao_item: formData.id_alocacao_item,
        id_item_ambiente: formData.id_item_ambiente,
        area_planejada: formData.area_planejada,
        percentual_conclusao_item: percentualConclusao,
        data: String(formData.data || ''),
        data_medicao: `${String(formData.data || '')}T00:00:00.000Z`,
        horas_trabalhadas: horas,
        area_pintada: area,
        materiais_utilizados: String(formData.materiais_utilizados || ''),
        observacoes: String(formData.observacoes || ''),
        assinatura: String(formData.assinatura || 'assinatura-mock'),
        localizacao_latitude: formData.localizacao_latitude,
        localizacao_longitude: formData.localizacao_longitude,
        status: 'rascunho',
        data_criacao: new Date().toISOString(),
        data_ultima_atualizacao: new Date().toISOString(),
      };

      await dispatch(salvarRDOLocal(rdoData)).unwrap();
      Alert.alert('Sucesso', 'RDO salvo localmente. A sincronizacao usara ERS 4.1 quando os IDs estiverem disponiveis.');
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Falha ao salvar RDO.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Obra</Text>
            <Text style={styles.value}>{obra.nome}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Identificacao ERS 4.1</Text>
            <TextInput
              label="ID Alocacao Item (opcional)"
              value={String(formData.id_alocacao_item || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, id_alocacao_item: value }))}
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <TextInput
              label="ID Item Ambiente (opcional)"
              value={String(formData.id_item_ambiente || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, id_item_ambiente: value }))}
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <TextInput
              label="ID Colaborador"
              value={String(formData.id_colaborador || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, id_colaborador: value }))}
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            {!readOnly && colaboradores.slice(0, 3).map((colab) => (
              <TouchableOpacity
                key={colab.id_colaborador}
                onPress={() => setFormData(prev => ({ ...prev, id_colaborador: colab.id_colaborador }))}
              >
                <Chip style={styles.suggestionChip}>{colab.nome}</Chip>
              </TouchableOpacity>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Medicao</Text>
            <TextInput
              label="Data"
              value={String(formData.data || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, data: value }))}
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <TextInput
              label="Horas trabalhadas"
              value={String(formData.horas_trabalhadas || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, horas_trabalhadas: Number(value || 0) }))}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <TextInput
              label="Area pintada (m2)"
              value={String(formData.area_pintada || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, area_pintada: Number(value || 0) }))}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <Text style={styles.helper}>Produtividade: {produtividade.toFixed(2)} m2/h</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Detalhes</Text>
            <TextInput
              label="Materiais utilizados"
              value={String(formData.materiais_utilizados || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, materiais_utilizados: value }))}
              mode="outlined"
              multiline
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
            <TextInput
              label="Observacoes"
              value={String(formData.observacoes || '')}
              onChangeText={(value) => setFormData(prev => ({ ...prev, observacoes: value }))}
              mode="outlined"
              multiline
              style={styles.input}
              disabled={Boolean(readOnly)}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.title}>Localizacao</Text>
            <Button
              mode="outlined"
              onPress={handleCapturarLocalizacao}
              loading={locationLoading}
              disabled={Boolean(readOnly)}
            >
              Capturar localizacao
            </Button>
            <Text style={styles.helper}>
              Lat: {formData.localizacao_latitude ? formData.localizacao_latitude.toFixed(6) : '-'}
            </Text>
            <Text style={styles.helper}>
              Long: {formData.localizacao_longitude ? formData.localizacao_longitude.toFixed(6) : '-'}
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.actions}>
          {!readOnly ? (
            <>
              <Button mode="contained-tonal" onPress={() => navigation.goBack()} disabled={loading}>
                Cancelar
              </Button>
              <Button mode="contained" onPress={handleSalvar} loading={loading} disabled={loading}>
                Salvar RDO
              </Button>
            </>
          ) : (
            <Button mode="contained" onPress={() => navigation.goBack()}>
              Fechar
            </Button>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 12,
    gap: 10,
  },
  card: {
    elevation: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  value: {
    fontSize: 14,
    color: '#555',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  helper: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  suggestionChip: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
});
