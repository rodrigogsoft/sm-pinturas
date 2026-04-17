import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SM_COLORS } from '../theme/colors';

const STACK_HEADER_OPTS = {
  headerStyle: { backgroundColor: SM_COLORS.primary },
  headerTintColor: SM_COLORS.textOnDark,
  headerTitleStyle: { fontWeight: '600' as const },
};

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { ObrasScreen } from '../screens/ObrasScreen';
import { RDOListScreen } from '../screens/RDOListScreen';
import { RDOFormScreen } from '../screens/RDOFormScreen';
import { MedicoesScreen } from '../screens/MedicoesScreen';
import { ConfiguracoesScreen } from '../screens/ConfiguracoesScreen';
import { AlocacaoScreen } from '../screens/Alocacao/AlocacaoScreen';
import { CatalogoScreen } from '../screens/CatalogoScreen';
import { RelatoriosScreen } from '../screens/RelatoriosScreen';
import { ValesAdiantamentoScreen } from '../screens/ValesAdiantamentoScreen';
import { DashboardObrasScreen } from '../screens/DashboardObrasScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack para Obras
const ObrasStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="ObrasList"
      component={ObrasScreen}
      options={{ title: 'Minhas Obras', headerShown: true }}
    />
    <Stack.Screen
      name="Alocacao"
      component={AlocacaoScreen}
      options={{ title: 'Alocação de Equipe' }}
    />
    <Stack.Screen
      name="RDOForm"
      component={RDOFormScreen}
      options={{ title: 'Novo RDO' }}
    />
  </Stack.Navigator>
);

// Stack para RDO
const RDOStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="RDOListTab"
      component={RDOListScreen}
      options={{ title: 'Relatórios de Obra', headerShown: true }}
    />
  </Stack.Navigator>
);

// Stack para Medições
const MedicoesStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="MedicoesTab"
      component={MedicoesScreen}
      options={{ title: 'Medições', headerShown: true }}
    />
  </Stack.Navigator>
);

// Stack para Catálogo
const CatalogoStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="CatalogoTab"
      component={CatalogoScreen}
      options={{ title: 'Catálogo de Serviços', headerShown: true }}
    />
  </Stack.Navigator>
);

// Stack para Relatórios
const RelatoriosStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="RelatoriosTab"
      component={RelatoriosScreen}
      options={{ title: 'Relatórios', headerShown: true }}
    />
  </Stack.Navigator>
);

// Stack para Financeiro (RF14 + RF20)
const FinanceiroStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="DashboardObras"
      component={DashboardObrasScreen}
      options={{ title: 'Dashboard de Obras', headerShown: true }}
    />
    <Stack.Screen
      name="ValesAdiantamento"
      component={ValesAdiantamentoScreen}
      options={{ title: 'Vales de Adiantamento' }}
    />
  </Stack.Navigator>
);

// Stack para Configurações
const ConfigStack = () => (
  <Stack.Navigator
    screenOptions={{
      ...STACK_HEADER_OPTS,
    }}
  >
    <Stack.Screen
      name="ConfigTab"
      component={ConfiguracoesScreen}
      options={{ title: 'Configurações', headerShown: true }}
    />
  </Stack.Navigator>
);

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Obras') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'RDO') {
            iconName = focused ? 'file-document' : 'file-document-outline';
          } else if (route.name === 'Medicoes') {
            iconName = focused ? 'ruler-square' : 'ruler-square';
          } else if (route.name === 'Catalogo') {
            iconName = focused ? 'package-variant' : 'package-variant-closed';
          } else if (route.name === 'Financeiro') {
            iconName = focused ? 'chart-bar' : 'chart-bar';
          } else if (route.name === 'Configuracoes') {
            iconName = focused ? 'cog' : 'cog-outline';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: SM_COLORS.primary,
        tabBarInactiveTintColor: SM_COLORS.textDisabled,
        tabBarStyle: {
          backgroundColor: SM_COLORS.surface,
          borderTopColor: SM_COLORS.divider,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Início' }}
      />
      <Tab.Screen
        name="Obras"
        component={ObrasStack}
        options={{ title: 'Obras' }}
      />
      {/* Removido RDO (RF02/RF04/RDO) */}
      <Tab.Screen
        name="Medicoes"
        component={MedicoesStack}
        options={{ title: 'Medições' }}
      />
      <Tab.Screen
        name="Catalogo"
        component={CatalogoStack}
        options={{ title: 'Catálogo' }}
      />
      <Tab.Screen
        name="Financeiro"
        component={FinanceiroStack}
        options={{ title: 'Financeiro' }}
      />
      <Tab.Screen
        name="Configuracoes"
        component={ConfigStack}
        options={{ title: 'Sessões O.S.' }}
      />
    </Tab.Navigator>
  );
};
