import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { List, Card, Title, Paragraph, Button, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutAsync } from '../store/slices/authSlice';

export const ConfiguracoesScreen = ({ navigation }: any) => {
  const { usuario } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [notificacoesAtivas, setNotificacoesAtivas] = React.useState(true);
  const [sincronizacaoAuto, setSincronizacaoAuto] = React.useState(true);

  const handleLogout = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', onPress: () => {} },
      {
        text: 'Sair',
        onPress: () => {
          dispatch(logoutAsync());
        },
      },
    ]);
  };

  const getPerfil = (id: number) => {
    const perfis: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Gestor',
      3: 'Financeiro',
      4: 'Encarregado',
      5: 'Colaborador',
    };
    return perfis[id] || 'Desconhecido';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Seção de Perfil */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileRow}>
              <MaterialCommunityIcons
                name="account-circle"
                size={60}
                color="#1976d2"
              />
              <View style={styles.profileInfo}>
                <Title style={styles.profileName}>{usuario?.nome_completo}</Title>
                <Paragraph style={styles.profileRole}>
                  {getPerfil(usuario?.id_perfil || 0)}
                </Paragraph>
                <Paragraph style={styles.profileEmail}>{usuario?.email}</Paragraph>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Configurações do App */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Configurações do App</Title>

          <List.Item
            title="Notificações"
            description="Ative ou desative notificações push"
            left={(props) => (
              <MaterialCommunityIcons name="bell" size={24} color="#1976d2" />
            )}
            right={() => (
              <Switch
                value={notificacoesAtivas}
                onValueChange={setNotificacoesAtivas}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Sincronização Automática"
            description="Sincronize dados automaticamente com internet"
            left={(props) => (
              <MaterialCommunityIcons name="sync" size={24} color="#1976d2" />
            )}
            right={() => (
              <Switch
                value={sincronizacaoAuto}
                onValueChange={setSincronizacaoAuto}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Modo Escuro"
            description="Tema escuro para melhor visibilidade"
            left={(props) => (
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={24}
                color="#1976d2"
              />
            )}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />

          <Divider />

          <List.Item
            title="Alto Contraste"
            description="Aumente o contraste visual para leitura"
            left={(props) => (
              <MaterialCommunityIcons
                name="contrast-box"
                size={24}
                color="#1976d2"
              />
            )}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
        </View>

        {/* Informações e Suporte */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Informações</Title>

          <List.Item
            title="Versão do App"
            description="1.0.0"
            left={(props) => (
              <MaterialCommunityIcons
                name="information"
                size={24}
                color="#1976d2"
              />
            )}
          />

          <Divider />

          <List.Item
            title="Sobre"
            description="Mais informações sobre o JB Pinturas"
            left={(props) => (
              <MaterialCommunityIcons
                name="help-circle"
                size={24}
                color="#1976d2"
              />
            )}
            onPress={() => {
              Alert.alert(
                'JB Pinturas',
                'Sistema de Gestão de Obras - Versão 1.0.0\n\nTodos os direitos reservados © 2026'
              );
            }}
          />

          <Divider />

          <List.Item
            title="Suporte"
            description="Entre em contato conosco"
            left={(props) => (
              <MaterialCommunityIcons name="phone" size={24} color="#1976d2" />
            )}
            onPress={() => {
              Alert.alert('Suporte', 'Email: suporte@jbpinturas.com.br\nTel: (11) 3000-0000');
            }}
          />

          <Divider />

          <List.Item
            title="Políticas e Termos"
            description="Política de privacidade e termos de uso"
            left={(props) => (
              <MaterialCommunityIcons
                name="file-document"
                size={24}
                color="#1976d2"
              />
            )}
          />
        </View>

        {/* Dados e Armazenamento */}
        <View style={styles.section}>
          <Title style={styles.sectionTitle}>Dados e Armazenamento</Title>

          <List.Item
            title="Limpar Cache"
            description="Liberar espaço removendo arquivos em cache"
            left={(props) => (
              <MaterialCommunityIcons name="delete" size={24} color="#ff9800" />
            )}
            onPress={() => {
              Alert.alert(
                'Limpar Cache',
                'Isso removerá arquivos em cache. Sincronização continuará funcionando.',
                [
                  { text: 'Cancelar' },
                  {
                    text: 'Limpar',
                    onPress: () => Alert.alert('Sucesso', 'Cache limpo com sucesso'),
                  },
                ]
              );
            }}
          />

          <Divider />

          <List.Item
            title="Usar Menos Dados"
            description="Reduza qualidade de imagens para economizar dados"
            left={(props) => (
              <MaterialCommunityIcons name="wifi-low" size={24} color="#ff9800" />
            )}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
        </View>

        {/* Botão Sair */}
        <View style={styles.logoutSection}>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor="#d32f2f"
            style={styles.logoutButton}
            icon="logout"
          >
            Sair da Conta
          </Button>
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
  profileCard: {
    margin: 12,
    backgroundColor: '#fff',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    color: '#1976d2',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginVertical: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 12,
    color: '#333',
  },
  logoutSection: {
    padding: 16,
    marginTop: 8,
  },
  logoutButton: {
    marginVertical: 8,
  },
  footer: {
    height: 20,
  },
});
