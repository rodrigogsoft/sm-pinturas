import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';

interface Obra {
  id: string;
  descricao: string;
  endereco?: string;
  status: string;
}

const ObrasScreen: React.FC = () => {
  const [obras, setObras] = useState<Obra[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarObras();
  }, []);

  const carregarObras = async () => {
    try {
      const resposta = await api.get('/obras');
      setObras(resposta.data);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as obras');
    } finally {
      setCarregando(false);
    }
  };

  if (carregando) return <ActivityIndicator style={styles.centro} size="large" color="#1976d2" />;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Obras</Text>
      <FlatList
        data={obras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>{item.descricao}</Text>
            {item.endereco && <Text style={styles.cardSubtitulo}>{item.endereco}</Text>}
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        refreshing={carregando}
        onRefresh={carregarObras}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#1976d2' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  cardTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitulo: { fontSize: 14, color: '#666', marginBottom: 4 },
  status: { fontSize: 12, color: '#1976d2', fontWeight: '600' },
});

export default ObrasScreen;
